<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>讯飞AI面试</h1>
    </div>
    
    <div class="profile-form">
      <div class="form-section">
        <h2>基础信息</h2>
        <div class="form-row">
          <div class="form-group">
            <label>姓名</label>
            <input type="text" v-model="userInfo.name" placeholder="填写你的名字">
          </div>
          <div class="form-group">
            <label>性别</label>
            <select v-model="userInfo.gender">
              <option value="">选择你的性别</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <div class="form-group">
            <label>出生日期</label>
            <input type="date" v-model="userInfo.birthDate">
          </div>
        </div>
      </div>
      
      <div class="form-section">
        <h2>教育经历</h2>
        <div class="education-group" v-for="(edu, index) in userInfo.educations" :key="index">
          <div class="form-row">
            <div class="form-group">
              <label>学校</label>
              <input type="text" v-model="edu.school" placeholder="填写你的学校">
            </div>
            <div class="form-group">
              <label>学历</label>
              <select v-model="edu.degree">
                <option value="">选择学历</option>
                <option value="bachelor">本科</option>
                <option value="master">硕士</option>
                <option value="doctor">博士</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>开始时间</label>
              <input type="month" v-model="edu.startDate">
            </div>
            <div class="form-group">
              <label>结束时间</label>
              <input type="month" v-model="edu.endDate">
            </div>
          </div>
        </div>
        <button class="add-btn">+ 添加教育经历</button>
      </div>
      
      <div class="form-section">
        <h2>个人优势</h2>
        <textarea v-model="userInfo.strengths" placeholder="填写信息"></textarea>
      </div>
      
      <div class="form-section">
        <h2>所获奖项</h2>
        <div class="awards-group" v-for="(award, index) in userInfo.awards" :key="index">
          <div class="form-row">
            <div class="form-group">
              <label>比赛</label>
              <input type="text" v-model="award.competition" placeholder="填写比赛名称">
            </div>
            <div class="form-group">
              <label>奖次</label>
              <input type="text" v-model="award.level" placeholder="填写获奖级别">
            </div>
            <div class="form-group">
              <label>时间</label>
              <input type="month" v-model="award.date">
            </div>
          </div>
        </div>
        <button class="add-btn">+ 添加奖项</button>
      </div>
      
      <button class="submit-btn" @click="submitProfile">
        提交并进入简历诊断
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        name: '',
        gender: '',
        birthDate: '',
        strengths: '',
        educations: [
          { school: '', degree: '', startDate: '', endDate: '' }
        ],
        awards: [
          { competition: '', level: '', date: '' }
        ]
      }
    }
  },
  methods: {
    submitProfile() {
      // 提交后进入下一步
      this.$router.push('/diagnosis');
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-header h1 {
  color: #2a6dc9;
  font-size: 28px;
}

.profile-form {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 30px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

input, select, textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

textarea {
  width: 100%;
  height: 120px;
  resize: vertical;
}

.add-btn {
  background: #2a6dc9;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
}

.submit-btn {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 20px auto 10px;
  padding: 14px;
  background: linear-gradient(90deg, #2a6dc9 0%, #38a6ff 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  cursor: pointer;
}
</style>