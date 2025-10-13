import { defineStore } from 'pinia'
import { ref } from 'vue'
import https from '../utils/https'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const isLoggedIn = ref(!!token.value)

  // 登录 - 后端接口版本（已注释）
  /*
  const login = async (username) => {
    try {
      // 这里调用后端登录接口
      const response = await https.post('/auth/login', { username })
      
      if (response.code === 200) {
        token.value = response.data.token
        userInfo.value = response.data.userInfo
        isLoggedIn.value = true
        
        // 保存token到本地存储
        localStorage.setItem('token', token.value)
        
        return Promise.resolve(response)
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }
  */

  // 登录 - 本地验证版本
  const login = async (username) => {
    try {
      // 本地模拟登录验证
      if (username === '123') {
        // 模拟成功登录
        const mockResponse = {
          code: 200,
          message: '登录成功',
          data: {
            token: 'mock_token_' + Date.now(),
            userInfo: {
              username: username,
              id: 1
            }
          }
        }
        
        token.value = mockResponse.data.token
        userInfo.value = mockResponse.data.userInfo
        isLoggedIn.value = true
        
        // 保存token和用户信息到本地存储
        localStorage.setItem('token', token.value)
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        
        return Promise.resolve(mockResponse)
      } else {
        // 模拟登录失败
        const mockError = {
          code: 400,
          message: '用户名不存在，请输入正确的用户名'
        }
        return Promise.reject(mockError)
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    userInfo.value = null
    isLoggedIn.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
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
          userInfo.value = { username: '123', id: 1 }
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
