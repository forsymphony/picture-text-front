<template>
  <div class="login-container">
    <div class="login-box">
       <div class="login-title">
         <h2>图文系统</h2>
         <p>{{ isAuditorLogin ? '请输入您的用户名和密码登录' : '请输入您的用户名登录' }}</p>
       </div>
      
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="rules" 
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <!-- 审核员登录需要密码 -->
        <el-form-item v-if="isAuditorLogin" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : (isAuditorLogin ? '审核员登录' : '用户登录') }}
          </el-button>
        </el-form-item>
        
        <!-- 登录方式切换按钮 -->
        <div class="login-switch">
          <el-button 
            type="text" 
            size="small"
            @click="toggleLoginType"
          >
            {{ isAuditorLogin ? '切换到普通用户登录' : '切换到审核员登录' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)
const isAuditorLogin = ref(false) // 是否为审核员登录

const loginForm = reactive({
  username: '',
  password: '' // 审核员登录需要密码
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 切换登录类型
const toggleLoginType = () => {
  isAuditorLogin.value = !isAuditorLogin.value
  // 重置表单验证
  loginFormRef.value?.clearValidate()
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  
  try {
    await userStore.login(loginForm.username, loginForm.password, isAuditorLogin.value)
    ElMessage.success('登录成功')
    // 根据登录类型跳转到不同页面
    if (isAuditorLogin.value) {
      router.push('/auditor')
    } else {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('登录失败:', error)
    // 显示错误消息
    const errorMessage = error?.message || '登录失败，请稍后重试'
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
}

.login-title h2 {
  color: #333;
  margin-bottom: 8px;
  font-size: 24px;
}

.login-title p {
  color: #666;
  font-size: 14px;
}

.login-form {
  width: 100%;
}

.login-btn {
  width: 100%;
}

.login-switch {
  text-align: center;
  margin-top: 15px;
}

:deep(.el-input__inner) {
  height: 45px;
}
</style>
