// 1. 定义所有组件
const HomePage = {
  template: `
    <div class="home-page">
      <div class="fullscreen-bg">
       
        <img src="./images/bg.png" alt="讯飞AI面试背景">
      </div>
      <div class="bg-card-sheet"></div>
      <div class="grid-overlay"></div>
      
      <div class="content-overlay">
        <div class="content-left">
          <h1>讯飞AI面试</h1>
          <div class="subtitle">全方位诊断简历存在的问题</div>
          <div class="desc">
            基于BOSS直聘求职大数据全方位评估简历，结合招聘市场趋势实时提供简历定制建议
          </div>
          
          <button class="start-btn" id="start-btn" @click="handleStart">
            <i class="fas fa-rocket"></i> 立即体验
          </button>
        </div>
      </div>
      
      <div ref="particlesContainer" class="particles"></div>
    </div>
  `,
  mounted() {
    this.initParticles();
  },
  methods: {
    handleStart() {
      const startBtn = document.getElementById('start-btn');
      startBtn.style.transform = 'translateY(8px)';
      startBtn.style.boxShadow = '0 4px 15px rgba(60, 255, 180, 0.3)';

      setTimeout(() => {
        startBtn.style.transform = 'translateY(-5px)';
        startBtn.style.boxShadow =
          '0 12px 35px rgba(60, 255, 180, 0.6), 0 0 0 6px rgba(127, 255, 167, 0.4)';
      }, 150);

      setTimeout(() => {
        alert('欢迎使用讯飞AI面试服务！即将开始诊断您的简历...');
        this.$router.push('/login');
      }, 500);
    },

    initParticles() {
      const particlesContainer = this.$refs.particlesContainer;

      for (let i = 0; i < 60; i++) {
        this.createParticle(particlesContainer);
      }

      this.addFloatAnimation();
    },

    createParticle(container) {
      const particle = document.createElement('div');
      particle.classList.add('particle');

      const size = Math.random() * 5 + 2;
      const posX = Math.random() * window.innerWidth;
      const posY = Math.random() * window.innerHeight;
      const animationTime = Math.random() * 20 + 10;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}px`;
      particle.style.top = `${posY}px`;

      const colors = ['#7fffa7', '#3be6b2', '#a0c4ff', '#ffd166', '#ef476f'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.background = color;

      particle.style.animation = `floatParticle ${animationTime}s linear infinite`;
      particle.style.opacity = Math.random() * 0.5 + 0.3;
      particle.style.animationDelay = `${Math.random() * 5}s`;

      container.appendChild(particle);
    },

    addFloatAnimation() {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes floatParticle {
          0% { transform: translate(0, 0); }
          25% { transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px); }
          50% { transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px); }
          75% { transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px); }
          100% { transform: translate(0, 0); }
        }
      `;
      document.head.appendChild(style);
    }
  }
};

const LoginView = {
  components: {
    'vue-verify-code': window['vue-verify-code']
  },
  data() {
    return {
      showLogin: true,
      loginForm: {
        phoneOrUser: '',
        password: '',
        verifyCode: '',
        remember: false
      },
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        verifyCode: ''
      },
      loginIdentifyCode: '',
      registerIdentifyCode: ''
    }
  },
  mounted() {
    this.refreshLoginCode();
    this.refreshRegisterCode();
  },
  methods: {
    // 生成随机验证码
    makeCode(length) {
      let code = '';
      for (let i = 0; i < length; i++) {
        const r = Math.floor(Math.random() * 36);
        if (r < 10) {
          code += r;
        } else {
          code += String.fromCharCode(r - 10 + 65);
        }
      }
      return code;
    },
    refreshLoginCode() {
      this.loginForm.verifyCode = '';
      this.loginIdentifyCode = this.makeCode(4);
    },
    refreshRegisterCode() {
      this.registerForm.verifyCode = '';
      this.registerIdentifyCode = this.makeCode(4);
    },
    handleLogin() {
      if (!this.loginForm.phoneOrUser || !this.loginForm.password || !this.loginForm.verifyCode) {
        alert('请填写完整信息');
        return;
      }
      if (this.loginForm.verifyCode.toLowerCase() !== this.loginIdentifyCode.toLowerCase()) {
        alert('验证码输入错误！');
        this.refreshLoginCode();
        return;
      }
      localStorage.setItem('user', 'true');
      this.$router.push('/profile');
    },
    handleRegister() {
      if (!this.registerForm.username || !this.registerForm.email || !this.registerForm.password || !this.registerForm.confirmPassword || !this.registerForm.verifyCode) {
        alert('请填写完整信息');
        return;
      }
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        alert('两次输入的密码不一致');
        return;
      }
      if (this.registerForm.verifyCode.toLowerCase() !== this.registerIdentifyCode.toLowerCase()) {
        alert('验证码输入错误！');
        this.refreshRegisterCode();
        return;
      }
      alert('注册成功，请登录');
      this.showLogin = true;
    }
  },
  template: `
    <div class='login-register-bg'>
      <div class="login-register-card">
        <div v-if="showLogin" class="login-panel">
          <div class="form-title">登录</div>
          <div class="input-group">
            <input type="text" v-model="loginForm.phoneOrUser" placeholder="用户名/手机号">
          </div>
          <div class="input-group">
            <input type="password" v-model="loginForm.password" placeholder="密码">
          </div>
          <div class="input-group verify-row">
            <input type="text" v-model="loginForm.verifyCode" placeholder="验证码" style="flex:1;">
            <span class="custom-code" @click="refreshLoginCode">{{loginIdentifyCode}}</span>
            <button class="refresh-btn" @click="refreshLoginCode">刷新</button>
          </div>
          <div class="input-group remember-row">
            <input type="checkbox" id="rememberMe" v-model="loginForm.remember">
            <label for="rememberMe">记住密码</label>
          </div>
          <button class="main-btn" @click="handleLogin">登录</button>
          <div class="switch-tip">
            没有账号？<a href="javascript:void(0)" @click="showLogin=false">注册</a>
          </div>
        </div>
        <div v-else class="register-panel">
          <div class="form-title">注册</div>
          <div class="input-group">
            <input type="text" v-model="registerForm.username" placeholder="用户名">
          </div>
          <div class="input-group">
            <input type="email" v-model="registerForm.email" placeholder="邮箱">
          </div>
          <div class="input-group">
            <input type="password" v-model="registerForm.password" placeholder="密码">
          </div>
          <div class="input-group">
            <input type="password" v-model="registerForm.confirmPassword" placeholder="确认密码">
          </div>
          <div class="input-group verify-row">
            <input type="text" v-model="registerForm.verifyCode" placeholder="验证码" style="flex:1;">
            <span class="custom-code" @click="refreshRegisterCode">{{registerIdentifyCode}}</span>
            <button class="refresh-btn" @click="refreshRegisterCode">刷新</button>
          </div>
          <button class="main-btn" @click="handleRegister">注册</button>
          <div class="switch-tip">
            已有账号？<a href="javascript:void(0)" @click="showLogin=true">登录</a>
          </div>
        </div>
      </div>
    </div>
  `
};

const ProfileView = {
  template: `
    <div class="profile-container">
      <!-- 不规则晕染背景层 -->
      <div class="bg-blur-ellipse bg-blur-yellow"></div>
      <div class="bg-blur-ellipse bg-blur-blue"></div>
      <div class="bg-blur-ellipse bg-blur-green"></div>
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
          <button class="add-btn" @click="addEducation">+ 添加教育经历</button>
        </div>
        <div class="form-section">
          <h2>实习经历</h2>
          <div class="internship-group" v-for="(intern, index) in userInfo.internships" :key="index">
            <div class="form-row">
              <div class="form-group">
                <label>公司</label>
                <input type="text" v-model="intern.company" placeholder="填写公司名称">
              </div>
              <div class="form-group">
                <label>职位</label>
                <input type="text" v-model="intern.position" placeholder="填写实习职位">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>开始时间</label>
                <input type="month" v-model="intern.startDate">
              </div>
              <div class="form-group">
                <label>结束时间</label>
                <input type="month" v-model="intern.endDate">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="flex:2;">
                <label>实习内容</label>
                <textarea v-model="intern.content" placeholder="简要描述实习内容"></textarea>
              </div>
            </div>
          </div>
          <button class="add-btn" @click="addInternship">+ 添加实习经历</button>
        </div>
        <div class="form-section">
          <h2>个人优势</h2>
          <textarea v-model="userInfo.strengths" placeholder="请描述您的个人优势、专业技能等"></textarea>
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
          <button class="add-btn" @click="addAward">+ 添加奖项</button>
        </div>
        <button class="submit-btn" @click="submitProfile">
          提交并进入简历诊断
        </button>
      </div>
    </div>
  `,
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
        internships: [
          { company: '', position: '', startDate: '', endDate: '', content: '' }
        ],
        awards: [
          { competition: '', level: '', date: '' }
        ]
      }
    }
  },
  methods: {
    addEducation() {
      this.userInfo.educations.push({ school: '', degree: '', startDate: '', endDate: '' });
    },
    addInternship() {
      this.userInfo.internships.push({ company: '', position: '', startDate: '', endDate: '', content: '' });
    },
    addAward() {
      this.userInfo.awards.push({ competition: '', level: '', date: '' });
    },
    submitProfile() {
      if (!this.userInfo.name || !this.userInfo.gender) {
        alert('请填写基本个人信息');
        return;
      }
      localStorage.setItem('profileData', JSON.stringify(this.userInfo));
      alert('个人信息已提交，即将开始简历诊断！');
      this.$router.push('/');
    }
  }
};

// 2. 配置路由
const routes = [
  {
    path: '/',
    component: HomePage,
    meta: { title: '讯飞AI面试' }
  },
  {
    path: '/login',
    component: LoginView,
    meta: { title: '登录/注册 - 讯飞AI面试' }
  },
  {
    path: '/profile',
    component: ProfileView,
    meta: {
      title: '个人信息填写 - 讯飞AI面试',
      requiresAuth: true
    }
  }
];

// 3. 创建路由实例
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
});

// 4. 全局路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '讯飞AI面试';

  if (to.matched.some(record => record.meta.requiresAuth)) {
    const user = localStorage.getItem('user');
    if (!user) {
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }
  }

  next();
});

// 5. 创建并挂载Vue应用
const app = Vue.createApp({});
app.use(router);
app.mount('#app');