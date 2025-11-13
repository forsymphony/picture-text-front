import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, logoutApi } from '../api/user'
import router from '../router'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const isLoggedIn = ref(!!token.value)

  // 用户登录
  const login = async (username, password = '', isAuditor = false) => {
    try {
      const response = await loginApi(username, password, isAuditor)
      
      if (response.code === 200) {
        token.value = response.data.token
        userInfo.value = { 
          username: response.data.username || username, 
          userId: response.data.userId, 
          isAuditor: isAuditor 
        }
        isLoggedIn.value = true
        
        // 保存token和用户信息到本地存储
        localStorage.setItem('token', token.value)
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        
        return Promise.resolve(response)
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      // 调用登出接口
      await logoutApi()
    } catch (error) {
      console.error('登出接口调用失败:', error)
    } finally {
      // 无论接口是否成功，都清除本地数据
      token.value = ''
      userInfo.value = null
      isLoggedIn.value = false
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      // 跳转到登录页面
      router.push('/login')
    }
  }

  // 检查登录状态
  const checkAuth = () => {
    const localToken = localStorage.getItem('token')
    const localUserInfo = localStorage.getItem('userInfo')
    
    if (localToken) {
      token.value = localToken
      isLoggedIn.value = true
      
      // 恢复用户信息
      if (localUserInfo) {
        try {
          userInfo.value = JSON.parse(localUserInfo)
        } catch (error) {
          console.error('解析用户信息失败:', error)
          // 如果解析失败，使用默认用户信息
          userInfo.value = { username: '123', userId: 1, isAuditor: false }
        }
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    checkAuth
  }
})
