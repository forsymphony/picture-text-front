<template>
  <div class="image-recognition-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>图片识别</h2>
      <p>请对图片进行标注和处理</p>
      <div class="batch-info" v-if="category || groupNo">
        <el-tag type="primary" size="large" v-if="category">大类: {{ category }}</el-tag>
        <el-tag type="success" size="large" v-if="groupNo">组别: {{ groupNo }}</el-tag>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="40">
        <!-- 左侧：图片显示和选项区域 -->
        <el-col :span="16">
          <el-card class="image-card">
            <!-- 图片显示区域 -->
            <div class="image-container">
              <div class="image-placeholder" v-if="!currentImage">
                <el-icon class="placeholder-icon"><Picture /></el-icon>
                <p>等待加载图片...</p>
              </div>
              <img v-else :src="currentImage" alt="当前图片" class="current-image" />
            </div>

            <!-- 选项区域 -->
            <div class="options-section">
              <div class="option-group">
                <label class="option-label">是否是正文：</label>
                <el-radio-group v-model="isMainText" class="radio-group">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </div>

              <div class="option-group">
                <label class="option-label">是否已无水印：</label>
                <el-radio-group v-model="isWatermarkFree" class="radio-group">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：操作按钮区域 -->
        <el-col :span="8">
          <el-card class="action-card">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="large" 
                class="action-btn"
                :disabled="!canProceedNext"
                @click="handleNextImage"
              >
                <el-icon><ArrowRight /></el-icon>
                下一张
              </el-button>

              <el-upload
                class="upload-wrapper"
                :show-file-list="false"
                :before-upload="handleUploadImage"
                accept="image/*"
              >
                <el-button 
                  type="success" 
                  size="large" 
                  class="action-btn"
                  :loading="uploading"
                >
                  <el-icon><Upload /></el-icon>
                  {{ uploading ? '上传中...' : '上传图片' }}
                </el-button>
              </el-upload>

              <el-button 
                type="warning" 
                size="large" 
                class="action-btn split-btn"
                :loading="splitProcessing"
                @click="handleSplitImage"
              >
                <el-icon><Operation /></el-icon>
                {{ splitProcessing ? '处理中...' : '该图为拆分图' }}
              </el-button>
            </div>

            <!-- 当前状态显示 -->
            <div class="status-info">
              <el-divider>当前状态</el-divider>
              <div class="status-item">
                <span class="status-label">正文状态：</span>
                <el-tag :type="isMainText === null ? 'info' : (isMainText ? 'success' : 'warning')">
                  {{ isMainText === null ? '未选择' : (isMainText ? '是正文' : '非正文') }}
                </el-tag>
              </div>
              <div class="status-item">
                <span class="status-label">水印状态：</span>
                <el-tag :type="isWatermarkFree === null ? 'info' : (isWatermarkFree ? 'success' : 'warning')">
                  {{ isWatermarkFree === null ? '未选择' : (isWatermarkFree ? '已无水印' : '有水印') }}
                </el-tag>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRecognitionTaskApi, markContentTypeApi, markSplitImageApi, uploadImageApi, replaceRecognitionImageApi } from '../api/task'

// 响应式数据
const currentImage = ref(null)
const currentImageId = ref(null) // 存储当前图片的ID
const category = ref(null) // 大类
const groupNo = ref(null) // 组别
const isMainText = ref(null)
const isWatermarkFree = ref(null)
const uploading = ref(false)
const splitProcessing = ref(false)

// 计算属性：是否可以进行下一张
const canProceedNext = computed(() => {
  return isMainText.value !== null && isWatermarkFree.value
})

// 获取当前图片
const getCurrentImage = async () => {
  try {
    const response = await getRecognitionTaskApi()

    if (response.code === 200) {
      currentImageId.value = response.data.id // 存储图片ID
      currentImage.value = response.data.imageUrl // 设置图片链接
      category.value = response.data.category // 大类
      groupNo.value = response.data.groupNo // 组别
    }
  } catch (error) {
    console.error('获取图片失败:', error)
  }
}

// 下一张图片
const handleNextImage = async () => {
  if (!canProceedNext.value) {
    ElMessage.warning('请先完成当前图片的标注')
    return
  }

  try {
    // 提交当前图片的标注信息
    const response = await markContentTypeApi({
      dataId: currentImageId.value,
      contentType: isMainText.value ? 'MAIN_CONTENT' : 'NON_MAIN_CONTENT',
    })

    if (response.code === 200) {
      // 重置选项
      isMainText.value = null
      isWatermarkFree.value = null
      
      // 获取下一张图片
      await getCurrentImage()
    }
  } catch (error) {
    ElMessage.error('切换图片失败')
    console.error('切换图片失败:', error)
  }
}

// 上传图片
const handleUploadImage = async (file) => {
  uploading.value = true
  
  try {
    // 第一步：上传图片到服务器
    const formData = new FormData()
    formData.append('file', file)
    
    const uploadResponse = await uploadImageApi(formData)
    
    if (uploadResponse.code === 200) {
      const imageUrl = uploadResponse.data.imageUrl
      
      // 第二步：调用替换接口
      const replaceResponse = await replaceRecognitionImageApi({
        dataId: currentImageId.value,
        imageUrl: imageUrl
      })
      
      if (replaceResponse.code === 200) {
        // 更新图片URL和ID
        currentImage.value = replaceResponse.data.imageUrl
        currentImageId.value = replaceResponse.data.id // 更新为新的ID
        // 重置选项
        isMainText.value = null
        isWatermarkFree.value = null
        ElMessage.success('图片上传成功')
      }
    }
  } catch (error) {
    ElMessage.error('图片上传失败')
    console.error('图片上传失败:', error)
  } finally {
    uploading.value = false
  }

  return false // 阻止默认上传行为
}

// 拆分图片处理
const handleSplitImage = async () => {
  try {
    // 二次确认弹窗
    await ElMessageBox.confirm(
      '确定将当前图片标记为拆分图吗？确认后将自动跳转到下一张图片。',
      '拆分图确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }
    )

    splitProcessing.value = true

    try {
      // 发送拆分图请求到后端
      const response = await markSplitImageApi({
        dataId: currentImageId.value
      })

      if (response.code === 200) {
        ElMessage.success('已标记为拆分图')
        
        // 重置选项
        isMainText.value = null
        isWatermarkFree.value = null
        
        // 自动获取下一张图片
        await getCurrentImage()
      }
    } catch (error) {
      ElMessage.error('标记拆分图失败')
      console.error('拆分图处理失败:', error)
    } finally {
      splitProcessing.value = false
    }
  } catch (error) {
    // 用户取消操作
    console.log('用户取消拆分操作')
  }
}

// 页面加载时获取初始图片
getCurrentImage()
</script>

<style scoped>
.image-recognition-container {
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

.batch-info {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 15px;
  align-items: center;
}

.main-content {
  height: 600px;
}

.image-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 8px;
  border: 2px dashed #dcdfe6;
  margin-bottom: 20px;
  min-height: 400px;
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

.options-section {
  padding: 20px 0;
}

.option-group {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.option-label {
  width: 120px;
  font-weight: 500;
  color: #606266;
}

.radio-group {
  flex: 1;
}

.action-card {
  height: 100%;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.action-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
}

.split-btn {
  border-color: #e6a23c;
  background-color: #f0ad4e;
}

.upload-wrapper {
  width: 100%;
}

:deep(.upload-wrapper .el-upload) {
  width: 100%;
}

.status-info {
  margin-top: 20px;
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
  padding: 20px;
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
}
</style>
