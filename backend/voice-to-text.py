from flask import Flask, request, jsonify
import os
import uuid
import threading
import time
from werkzeug.utils import secure_filename

# 原有导入保持不变
import _thread as thread
from time import mktime
import subprocess
import websocket
import base64
import datetime
import hashlib
import hmac
import json
import ssl
from datetime import datetime
from urllib.parse import urlencode
from wsgiref.handlers import format_date_time

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wav'}
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB限制

# 原有常量定义保持不变
STATUS_FIRST_FRAME = 0
STATUS_CONTINUE_FRAME = 1
STATUS_LAST_FRAME = 2

# 任务存储
tasks = {}


class Ws_Param:
    # 原有Ws_Param类保持不变
    def __init__(self, APPID, APIKey, APISecret, AudioFile):
        self.APPID = APPID
        self.APIKey = APIKey
        self.APISecret = APISecret
        self.AudioFile = AudioFile
        self.iat_params = {
            "domain": "slm", "language": "zh_cn", "accent": "mandarin", "dwa": "wpgs", "result":
                {
                    "encoding": "utf8",
                    "compress": "raw",
                    "format": "plain"
                }
        }

    def create_url(self):
        url = 'ws://iat.xf-yun.com/v1'
        now = datetime.now()
        date = format_date_time(mktime(now.timetuple()))

        signature_origin = "host: " + "iat.xf-yun.com" + "\n"
        signature_origin += "date: " + date + "\n"
        signature_origin += "GET " + "/v1 " + "HTTP/1.1"

        signature_sha = hmac.new(self.APISecret.encode('utf-8'), signature_origin.encode('utf-8'),
                                 digestmod=hashlib.sha256).digest()
        signature_sha = base64.b64encode(signature_sha).decode(encoding='utf-8')

        authorization_origin = "api_key=\"%s\", algorithm=\"%s\", headers=\"%s\", signature=\"%s\"" % (
            self.APIKey, "hmac-sha256", "host date request-line", signature_sha)
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')

        v = {
            "authorization": authorization,
            "date": date,
            "host": "iat.xf-yun.com"
        }
        return url + '?' + urlencode(v)


def convert_video_to_wav(video_path, output_wav_path=None):
    """原有转换函数保持不变"""
    if output_wav_path is None:
        output_wav_path = os.path.splitext(video_path)[0] + '.wav'

    try:
        command = [
            'ffmpeg',
            '-i', video_path,
            '-vn',
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            output_wav_path
        ]
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_wav_path
    except Exception as e:
        print(f"转换失败: {e}")
        return None


def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


class RecognitionResult:
    """用于管理识别结果的类"""

    def __init__(self):
        self.buffer = ""
        self.final_result = ""
        self.status = "processing"  # processing, completed, error
        self.message = ""

    def update(self, text):
        """更新识别结果"""
        # 原有重叠处理逻辑
        overlap = 0
        max_overlap = min(len(self.buffer), len(text))
        for i in range(1, max_overlap + 1):
            if self.buffer[-i:] == text[:i]:
                overlap = i

        new_text = text[overlap:] if overlap > 0 else text
        self.buffer = text
        self.final_result += new_text


@app.route('/api/recognize', methods=['POST'])
def recognize():
    """文件上传接口"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    # 生成唯一任务ID
    task_id = str(uuid.uuid4())
    filename = secure_filename(f"{task_id}_{file.filename}")
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # 初始化任务结果
    tasks[task_id] = RecognitionResult()

    # 启动后台处理线程
    threading.Thread(target=process_audio, args=(task_id, filepath)).start()

    return jsonify({
        'task_id': task_id,
        'status': 'processing'
    })


@app.route('/api/result/<task_id>', methods=['GET'])
def get_result(task_id):
    """获取识别结果接口"""
    if task_id not in tasks:
        return jsonify({'error': 'Invalid task ID'}), 404

    result = tasks[task_id]
    if result.status == 'completed':
        return jsonify({
            'status': 'completed',
            'result': result.final_result
        })
    elif result.status == 'error':
        return jsonify({
            'status': 'error',
            'message': result.message
        })
    else:
        return jsonify({
            'status': 'processing',
            'progress': len(result.final_result)
        })


def process_audio(task_id, filepath):
    """后台处理音频文件"""
    try:
        result = tasks[task_id]

        # 如果是视频文件，先转换为音频
        if not filepath.lower().endswith('.wav'):
            audio_file = convert_video_to_wav(filepath)
            if not audio_file:
                raise Exception("Failed to convert video to audio")
        else:
            audio_file = filepath

        # 初始化WebSocket参数
        wsParam = Ws_Param(
            APPID='3dd41207',
            APIKey='7ae3c8e17a5aa348628d11c1bcc4e047',
            APISecret='YzJmODRjOWMxNmI3ZmJkMDhkYTA5MDU1',
            AudioFile=audio_file
        )

        # 定义WebSocket回调
        def on_message(ws, message):
            try:
                msg = json.loads(message)
                code = msg["header"]["code"]
                status = msg["header"]["status"]

                if code != 0:
                    result.status = 'error'
                    result.message = f"API error: {code}"
                    ws.close()
                    return

                if "payload" in msg and "result" in msg["payload"]:
                    text = msg["payload"]["result"]["text"]
                    text = json.loads(base64.b64decode(text).decode('utf8'))
                    current_text = ''.join([j["w"] for i in text['ws'] for j in i["cw"]]).strip()
                    result.update(current_text)

                if status == 2:
                    result.status = 'completed'
                    ws.close()

            except Exception as e:
                result.status = 'error'
                result.message = str(e)
                ws.close()

        def on_error(ws, error):
            result.status = 'error'
            result.message = str(error)

        def on_close(ws, *args):
            pass

        def on_open(ws):
            def run(*args):
                frameSize = 1280
                intervel = 0.04
                status = STATUS_FIRST_FRAME

                with open(audio_file, "rb") as fp:
                    while True:
                        buf = fp.read(frameSize)
                        if not buf:
                            status = STATUS_LAST_FRAME

                        audio = str(base64.b64encode(buf), 'utf-8')

                        if status == STATUS_FIRST_FRAME:
                            data = {
                                "header": {"status": 0, "app_id": wsParam.APPID},
                                "parameter": {"iat": wsParam.iat_params},
                                "payload": {
                                    "audio": {
                                        "audio": audio,
                                        "sample_rate": 16000,
                                        "encoding": "raw"
                                    }
                                }
                            }
                        elif status == STATUS_CONTINUE_FRAME:
                            data = {
                                "header": {"status": 1, "app_id": wsParam.APPID},
                                "parameter": {"iat": wsParam.iat_params},
                                "payload": {
                                    "audio": {
                                        "audio": audio,
                                        "sample_rate": 16000,
                                        "encoding": "raw"
                                    }
                                }
                            }
                        elif status == STATUS_LAST_FRAME:
                            data = {
                                "header": {"status": 2, "app_id": wsParam.APPID},
                                "parameter": {"iat": wsParam.iat_params},
                                "payload": {
                                    "audio": {
                                        "audio": audio,
                                        "sample_rate": 16000,
                                        "encoding": "raw"
                                    }
                                }
                            }

                        ws.send(json.dumps(data))
                        if status == STATUS_FIRST_FRAME:
                            status = STATUS_CONTINUE_FRAME
                        elif status == STATUS_LAST_FRAME:
                            break

                        time.sleep(intervel)

            thread.start_new_thread(run, ())

        # 启动WebSocket连接
        wsUrl = wsParam.create_url()
        ws = websocket.WebSocketApp(
            wsUrl,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        ws.on_open = on_open
        ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})

        # 清理临时文件
        os.remove(audio_file)
        if audio_file != filepath:
            os.remove(filepath)

    except Exception as e:
        tasks[task_id].status = 'error'
        tasks[task_id].message = str(e)


if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(host='0.0.0.0', port=5000, threaded=True)