<template>
  <div class="description-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>图文描述</h2>
      <p>为图片添加和修改文字描述</p>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="40">
        <!-- 左侧：图片显示区域 -->
        <el-col :span="12">
          <el-card class="image-card">
            <template #header>
              <div class="card-title">
                <el-icon><Picture /></el-icon>
                <span>当前图片</span>
              </div>
            </template>
            
            <div class="image-container">
              <div class="image-placeholder" v-if="!currentImage">
                <el-icon class="placeholder-icon"><Picture /></el-icon>
                <p>等待加载图片...</p>
              </div>
              <img v-else :src="currentImage" alt="当前图片" class="current-image" />
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：描述编辑区域 -->
        <el-col :span="12">
          <el-card class="description-card">
            <template #header>
              <div class="card-title">
                <el-icon><EditPen /></el-icon>
                <span>图片描述</span>
              </div>
            </template>
            
            <div class="description-content">
              <!-- 描述文本区域 -->
              <div class="textarea-section">
                <label class="textarea-label">描述内容：</label>
                <el-input
                  v-model="description"
                  type="textarea"
                  :rows="12"
                  placeholder="请输入或修改图片描述..."
                  class="description-textarea"
                />
              </div>

              <!-- 确认选项 -->
              <div class="confirm-section">
                <div class="confirm-group">
                  <label class="confirm-label">描述是否一致：</label>
                  <el-radio-group v-model="isDescriptionConsistent" class="radio-group">
                    <el-radio :label="true">一致</el-radio>
                    <el-radio :label="false">不一致</el-radio>
                  </el-radio-group>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="action-section">
                <el-button 
                  type="primary" 
                  size="large" 
                  class="next-btn"
                  :disabled="!canProceedNext"
                  @click="handleNextImage"
                >
                  <el-icon><ArrowRight /></el-icon>
                  下一张
                </el-button>
              </div>

              <!-- 状态显示 -->
              <div class="status-section">
                <el-divider>当前状态</el-divider>
                <div class="status-item">
                  <span class="status-label">描述状态：</span>
                  <el-tag :type="isDescriptionConsistent === null ? 'info' : (isDescriptionConsistent ? 'success' : 'warning')">
                    {{ isDescriptionConsistent === null ? '未确认' : (isDescriptionConsistent ? '描述一致' : '描述不一致') }}
                  </el-tag>
                </div>
                <div class="status-item">
                  <span class="status-label">字符数：</span>
                  <el-tag type="info">{{ description.length }} 字符</el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import https from '../utils/https'

// 响应式数据
const currentImage = ref(null)
const description = ref('')
const isDescriptionConsistent = ref(null)

// 计算属性：是否可以进行下一张
const canProceedNext = computed(() => {
  return isDescriptionConsistent.value !== null
})

// 获取当前图片和描述（注释版本）
/*
const getCurrentImageAndDescription = async () => {
  try {
    const response = await https.get('/api/images/current-with-description')
    if (response.code === 200) {
      currentImage.value = response.data.imageUrl
      description.value = response.data.description || ''
    }
  } catch (error) {
    ElMessage.error('获取图片和描述失败')
  }
}
*/

// 下一张图片
const handleNextImage = async () => {
  if (!canProceedNext.value) {
    ElMessage.warning('请先确认描述是否一致')
    return
  }

  try {
    // 提交描述修改和确认信息
    /*
    await https.post('/api/images/update-description', {
      description: description.value,
      isConsistent: isDescriptionConsistent.value
    })
    */

    // 获取下一张图片和描述
    /*
    const response = await https.get('/api/images/next-with-description')
    if (response.code === 200) {
      currentImage.value = response.data.imageUrl
      description.value = response.data.description || ''
      // 重置确认状态
      isDescriptionConsistent.value = null
      ElMessage.success('已切换到下一张图片')
    }
    */

    // 临时模拟：重置状态
    isDescriptionConsistent.value = null
    description.value = '这是一张示例图片的描述文字，用户可以在这里进行修改和编辑。'
    ElMessage.success('已切换到下一张图片（模拟）')
  } catch (error) {
    ElMessage.error('切换图片失败')
  }
}

// 页面加载时获取初始数据
// getCurrentImageAndDescription()

// 模拟初始描述
description.value = '这是一张示例图片的描述文字，用户可以在这里进行修改和编辑。'
</script>

<style scoped>
.description-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 140px);
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  color: #303133;
  margin-bottom: 8px;
  font-size: 24px;
}

.page-header p {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.main-content {
  min-height: 600px;
}

.image-card, .description-card {
  height: 650px;
}

.card-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #303133;
}

.card-title .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

.image-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 8px;
  border: 2px dashed #dcdfe6;
}

.image-placeholder {
  text-align: center;
  color: #909399;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.current-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.description-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.textarea-section {
  flex: 1;
  margin-bottom: 20px;
}

.textarea-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}

.description-textarea {
  height: 100%;
}

:deep(.description-textarea .el-textarea__inner) {
  height: 300px !important;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
}

.confirm-section {
  margin-bottom: 20px;
  padding: 15px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.confirm-group {
  display: flex;
  align-items: center;
}

.confirm-label {
  width: 120px;
  font-weight: 500;
  color: #606266;
}

.radio-group {
  flex: 1;
}

.action-section {
  margin-bottom: 20px;
}

.next-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
}

.status-section {
  margin-top: auto;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-label {
  font-size: 14px;
  color: #606266;
}

:deep(.el-card__body) {
  height: calc(100% - 57px);
  display: flex;
  flex-direction: column;
}
</style>
