import { createRouter, createWebHistory } from 'vue-router';

// 页面组件引入
import HomePage from '../views/HomePage.vue';
import LoginView from '../views/LoginView.vue';
import ProfileView from '../views/ProfileView.vue';
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { title: '讯飞AI面试' }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录/注册 - 讯飞AI面试' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      title: '个人信息填写 - 讯飞AI面试',
      requiresAuth: true
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
});

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 更新页面标题
  document.title = to.meta.title || '讯飞AI面试';

  // 鉴权检查
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查用户是否登录
    const user = localStorage.getItem('user');
    if (!user) {
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
  }

  next();
});

export default router;