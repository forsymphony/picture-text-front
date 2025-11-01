import { createRouter, createWebHistory } from 'vue-router'
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
      {
        path: '/management',
        name: 'Management',
        component: () => import('../views/Management.vue'),
        meta: { requiresAuth: true, title: '图文描述' }
      },
      {
        path: '/split-upload',
        name: 'SplitUpload',
        component: () => import('../views/SplitUpload.vue'),
        meta: { requiresAuth: true, title: '拆分图上传' }
      },
      {
        path: '/video',
        name: 'Video',
        component: () => import('../views/Video.vue'),
        meta: { requiresAuth: true, title: '视频处理' }
      }
    ]
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 检查登录状态
  userStore.checkAuth()
  
  // 已移除强制登录检查逻辑
  next()
})

export default router
