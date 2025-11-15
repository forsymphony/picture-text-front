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
      // 普通用户路由
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true, title: '图片识别', isAuditor: false }
      },
      // {
      //   path: '/management',
      //   name: 'Management',
      //   component: () => import('../views/Management.vue'),
      //   meta: { requiresAuth: true, title: '图文描述', isAuditor: false }
      // },
      // {
      //   path: '/split-upload',
      //   name: 'SplitUpload',
      //   component: () => import('../views/SplitUpload.vue'),
      //   meta: { requiresAuth: true, title: '拆分图上传', isAuditor: false }
      // },
      {
        path: '/video',
        name: 'Video',
        component: () => import('../views/Video.vue'),
        meta: { requiresAuth: true, title: '视频处理', isAuditor: false }
      },
      // 审核员路由
      {
        path: '/auditor/dashboard',
        name: 'AuditorDashboard',
        component: () => import('../views/AuditorDashboard.vue'),
        meta: { requiresAuth: true, title: '审核员管理', isAuditor: true }
      },
      // 审核员路由
      {        path: '/auditor/audit-assignment/:id',        name: 'AuditorAssignment',        component: () => import('../views/AuditAssignment.vue'),        meta: { requiresAuth: true, title: '审核任务', isAuditor: true }      }
    ]
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      // 根据用户类型重定向到不同的首页
      const userStore = useUserStore()
      userStore.checkAuth()
      return userStore.userInfo?.isAuditor ? '/auditor/dashboard' : '/dashboard'
    }
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
      // 检查用户类型是否与路由匹配
      if (to.meta.isAuditor !== undefined) {
        if (to.meta.isAuditor && userStore.userInfo?.isAuditor) {
          next() // 审核员访问审核员页面，放行
        } else if (!to.meta.isAuditor && !userStore.userInfo?.isAuditor) {
          next() // 普通用户访问普通用户页面，放行
        } else if (userStore.userInfo?.isAuditor) {
          next('/auditor/dashboard') // 审核员访问普通用户页面，重定向到审核员页面
        } else {
          next('/dashboard') // 普通用户访问审核员页面，重定向到普通用户页面
        }
      } else {
        next() // 没有指定用户类型要求，放行
      }
    } else {
      next('/login') // 未登录，跳转到登录页
    }
  } else {
    // 不需要登录权限
    if (to.path === '/login' && userStore.isLoggedIn) {
      // 已登录用户访问登录页，根据用户类型重定向
      if (userStore.userInfo?.isAuditor) {
        next('/auditor/dashboard') // 审核员重定向到审核员页面
      } else {
        next('/dashboard') // 普通用户重定向到普通用户页面
      }
    } else {
      next() // 放行
    }
  }
})

export default router
