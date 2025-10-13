<template>
  <div class="layout-container">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px">
        <div class="sidebar">
          <div class="logo">
            <h3>图文系统</h3>
          </div>
          
          <el-menu
            :default-active="$route.path"
            class="sidebar-menu"
            router
          >
            <el-menu-item index="/dashboard">
              <el-icon><Picture /></el-icon>
              <span>图片识别</span>
            </el-menu-item>
            <el-menu-item index="/management">
              <el-icon><Document /></el-icon>
              <span>图文描述</span>
            </el-menu-item>
            <el-menu-item index="/split-upload">
              <el-icon><Upload /></el-icon>
              <span>拆分图上传</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-aside>
      
      <!-- 主要内容区 -->
      <el-container>
        <!-- 头部 -->
        <el-header height="60px">
          <div class="header">
            <div class="header-left">
              <h4>{{ currentPageTitle }}</h4>
            </div>
            
            <div class="header-right">
              <el-dropdown @command="handleCommand">
                <span class="user-info">
                  <el-icon><User /></el-icon>
                  {{ userStore.userInfo?.username || '用户' }}
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>
        
        <!-- 内容区 -->
        <el-main>
          <div class="main-content">
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentPageTitle = computed(() => {
  return route.meta.title || '后台管理'
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (error) {
      // 取消退出
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  height: 100vh;
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4b;
  color: white;
  border-bottom: 1px solid #374151;
}

.logo h3 {
  margin: 0;
  font-size: 18px;
}

.sidebar-menu {
  border-right: none;
  background-color: #304156;
  height: calc(100vh - 60px);
}

:deep(.el-menu-item) {
  color: #bfcbd9;
}

:deep(.el-menu-item.is-active) {
  background-color: #409eff !important;
  color: white;
}

:deep(.el-menu-item:hover) {
  background-color: #263445;
  color: white;
}

.header {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: white;
  border-bottom: 1px solid #e6e6e6;
}

.header-left h4 {
  margin: 0;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #333;
  font-size: 14px;
}

.user-info .el-icon {
  margin: 0 4px;
}

.main-content {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}
</style>
