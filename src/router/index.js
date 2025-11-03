import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true, title: '图片识别' }
      },
      // {
      //   path: '/management',
      //   name: 'Management',
      //   component: () => import('../views/Management.vue'),
      //   meta: { requiresAuth: true, title: '图文描述' }
      // },
      // {
      //   path: '/split-upload',
      //   name: 'SplitUpload',
      //   component: () => import('../views/SplitUpload.vue'),
      //   meta: { requiresAuth: true, title: '拆分图上传' }
      // },
      // {
      //   path: '/video',
      //   name: 'Video',
      //   component: () => import('../views/Video.vue'),
      //   meta: { requiresAuth: true, title: '视频处理' }
      // }
    ]
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 检查登录状态
  userStore.checkAuth()
  
  // 判断路由是否需要登录权限
  if (to.meta.requiresAuth) {
    // 需要登录权限，检查是否已登录
    if (userStore.isLoggedIn) {
      next() // 已登录，放行
    } else {
      next('/login') // 未登录，跳转到登录页
    }
  } else {
    // 不需要登录权限
    if (to.path === '/login' && userStore.isLoggedIn) {
      next('/dashboard') // 已登录用户访问登录页，跳转到首页
    } else {
      next() // 放行
    }
  }
})

export default router
