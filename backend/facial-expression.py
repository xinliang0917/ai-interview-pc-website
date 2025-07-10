import cv2
import time
import base64
import requests
import hashlib
from io import BytesIO
from PIL import Image
import os
from flask import Flask, request, jsonify
from flask_restful import Api, Resource
import threading
import queue
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
api = Api(app)

# 配置信息
config = {
    "UPLOAD_FOLDER": "uploads",
    "ALLOWED_EXTENSIONS": {'mp4', 'mov', 'avi', 'mkv'},
    "USER_VIDEO_FOLDER": "user_videos",
    "API_ENDPOINT": "http://localhost:5000",  # 指向你原有API的地址
    "MAX_CONTENT_LENGTH": 100 * 1024 * 1024  # 最大100MB
}

# 创建必要的文件夹
for folder in [config["UPLOAD_FOLDER"], config["USER_VIDEO_FOLDER"]]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# 设置上传限制
app.config['MAX_CONTENT_LENGTH'] = config["MAX_CONTENT_LENGTH"]
app.config['UPLOAD_FOLDER'] = config["UPLOAD_FOLDER"]

# 任务队列和结果存储
task_queue = queue.Queue()
task_results = {}
results_lock = threading.Lock()  # 用于保护task_results的访问


# 允许的文件扩展名检查
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in config["ALLOWED_EXTENSIONS"]


# 视频处理工作线程
def process_video_tasks():
    while True:
        task = task_queue.get()
        if task is None:
            break

        task_id, user_id, video_path = task

        try:
            # 调用原有API进行视频分析
            with open(video_path, 'rb') as f:
                files = {'video': f}
                response = requests.post(f"{config['API_ENDPOINT']}/analyze", files=files)

            if response.status_code == 200:
                result = response.json()
                with results_lock:
                    task_results[task_id] = {
                        "status": "completed",
                        "result": result,
                        "user_id": user_id,
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
            else:
                with results_lock:
                    task_results[task_id] = {
                        "status": "error",
                        "error": f"API调用失败: {response.status_code}",
                        "user_id": user_id,
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }

        except Exception as e:
            with results_lock:
                task_results[task_id] = {
                    "status": "error",
                    "error": str(e),
                    "user_id": user_id,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
        finally:
            # 清理临时文件
            if os.path.exists(video_path):
                os.remove(video_path)
            task_queue.task_done()


# 启动工作线程
processing_thread = threading.Thread(target=process_video_tasks, daemon=True)
processing_thread.start()


# 微信小程序API接口
@app.route('/wx/upload', methods=['POST'])
def wx_upload_video():
    """微信小程序上传视频接口"""
    try:
        # 检查是否有文件上传
        if 'video' not in request.files:
            return jsonify({"code": 400, "message": "未上传视频文件"})

        file = request.files['video']

        # 检查文件是否有名称
        if file.filename == '':
            return jsonify({"code": 400, "message": "文件名为空"})

        # 检查文件扩展名
        if not allowed_file(file.filename):
            return jsonify(
                {"code": 400, "message": f"不支持的文件格式，支持的格式: {', '.join(config['ALLOWED_EXTENSIONS'])}"})

        # 获取用户ID（从请求中获取或生成）
        user_id = request.form.get('user_id', f"user_{int(time.time() * 1000)}")

        # 生成安全的文件名
        filename = secure_filename(f"{user_id}_{int(time.time())}_{file.filename}")
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # 保存文件
        file.save(video_path)

        # 生成任务ID
        task_id = f"task_{int(time.time() * 1000)}"

        # 将任务放入队列
        task_queue.put((task_id, user_id, video_path))

        # 返回任务ID给小程序
        return jsonify({
            "code": 200,
            "message": "视频上传成功，正在分析",
            "data": {
                "task_id": task_id,
                "user_id": user_id
            }
        })

    except Exception as e:
        return jsonify({"code": 500, "message": f"服务器错误: {str(e)}"})


@app.route('/wx/result/<task_id>', methods=['GET'])
def wx_get_result(task_id):
    """微信小程序获取分析结果接口"""
    try:
        with results_lock:
            if task_id in task_results:
                result = task_results[task_id]
                return jsonify({
                    "code": 200,
                    "message": "查询成功",
                    "data": result
                })
            else:
                return jsonify({
                    "code": 200,
                    "message": "结果未就绪，请稍后再试",
                    "data": {
                        "status": "pending",
                        "task_id": task_id
                    }
                })
    except Exception as e:
        return jsonify({"code": 500, "message": f"服务器错误: {str(e)}"})


@app.route('/wx/user/<user_id>/history', methods=['GET'])
def wx_get_user_history(user_id):
    """获取用户历史分析记录"""
    try:
        with results_lock:
            user_tasks = [task for task_id, task in task_results.items()
                          if task.get('user_id') == user_id and task.get('status') == 'completed']

        return jsonify({
            "code": 200,
            "message": "查询成功",
            "data": user_tasks
        })
    except Exception as e:
        return jsonify({"code": 500, "message": f"服务器错误: {str(e)}"})


if __name__ == '__main__':
    print("微信小程序中间层服务已启动")
    app.run(host='0.0.0.0', port=8080, debug=True)