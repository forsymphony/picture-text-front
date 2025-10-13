<template>
  <div class="split-upload-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>拆分图上传</h2>
      <p>将原始图片拆分成多个部分并上传</p>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="40">
        <!-- 左侧：原始图片预览区域 -->
        <el-col :span="10">
          <el-card class="original-image-card">
            <template #header>
              <div class="card-title">
                <el-icon><View /></el-icon>
                <span>原始图片</span>
              </div>
            </template>
            
            <div class="original-image-container">
              <div class="image-placeholder" v-if="!originalImage">
                <el-icon class="placeholder-icon"><Picture /></el-icon>
                <p>等待加载原始图片...</p>
              </div>
              <img v-else :src="originalImage" alt="原始图片" class="original-image" />
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：上传和预览区域 -->
        <el-col :span="14">
          <el-card class="upload-card">
            <template #header>
              <div class="card-title">
                <el-icon><Upload /></el-icon>
                <span>拆分图片上传</span>
              </div>
            </template>
            
            <div class="upload-content">
              <!-- 上传按钮 -->
              <div class="upload-section">
                <el-upload
                  class="upload-area"
                  :show-file-list="false"
                  :before-upload="handleUploadImages"
                  accept="image/*"
                  multiple
                >
                  <el-button 
                    type="primary" 
                    size="large" 
                    class="upload-btn"
                    :loading="uploading"
                  >
                    <el-icon><Plus /></el-icon>
                    {{ uploading ? '上传中...' : '上传图片' }}
                  </el-button>
                </el-upload>
                <p class="upload-tips">可同时选择多张图片上传</p>
              </div>

              <!-- 预览图片区域 -->
              <div class="preview-section" v-if="previewImages.length > 0">
                <div class="preview-header">
                  <h4>上传预览 ({{ previewImages.length }}张)</h4>
                </div>
                
                <div class="preview-grid">
                  <div 
                    v-for="(image, index) in previewImages" 
                    :key="index"
                    class="preview-item"
                  >
                    <div class="preview-image-container">
                      <img :src="image.url" :alt="`预览图 ${index + 1}`" class="preview-image" />
                      <div class="preview-overlay">
                        <el-button 
                          type="danger" 
                          size="small" 
                          circle 
                          @click="removePreviewImage(index)"
                          class="remove-btn"
                        >
                          <el-icon><Close /></el-icon>
                        </el-button>
                      </div>
                    </div>
                    <p class="image-name">{{ image.name }}</p>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div class="empty-state" v-else>
                <el-empty description="暂无上传图片" />
              </div>

              <!-- 确认上传按钮 -->
              <div class="confirm-section">
                <el-button 
                  type="success" 
                  size="large" 
                  class="confirm-btn"
                  :disabled="previewImages.length === 0"
                  :loading="confirming"
                  @click="handleConfirmUpload"
                >
                  <el-icon><Check /></el-icon>
                  {{ confirming ? '确认中...' : '确认上传' }}
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import https from '../utils/https'

// 响应式数据
const originalImage = ref(null)
const previewImages = ref([])
const uploading = ref(false)
const confirming = ref(false)

// 获取原始图片（注释版本）
/*
const getOriginalImage = async () => {
  try {
    const response = await https.get('/api/images/current-original')
    if (response.code === 200) {
      originalImage.value = response.data.imageUrl
    }
  } catch (error) {
    ElMessage.error('获取原始图片失败')
  }
}
*/

// 上传图片处理
const handleUploadImages = async (file) => {
  uploading.value = true
  
  try {
    // 创建文件读取器
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = {
        url: e.target.result,
        name: file.name,
        size: file.size,
        file: file
      }
      previewImages.value.push(imageData)
    }
    reader.readAsDataURL(file)
    
    ElMessage.success(`成功添加图片: ${file.name}`)
  } catch (error) {
    ElMessage.error('图片添加失败')
  } finally {
    uploading.value = false
  }

  return false // 阻止默认上传行为
}

// 删除预览图片
const removePreviewImage = (index) => {
  const image = previewImages.value[index]
  previewImages.value.splice(index, 1)
  ElMessage.success(`已删除图片: ${image.name}`)
}

// 确认上传
const handleConfirmUpload = async () => {
  if (previewImages.value.length === 0) {
    ElMessage.warning('请先上传图片')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要上传这 ${previewImages.value.length} 张拆分图片吗？上传后将自动跳转到下一张原始图片。`,
      '确认上传',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    confirming.value = true

    try {
      // 发送拆分图片到后端
      /*
      const formData = new FormData()
      previewImages.value.forEach((image, index) => {
        formData.append(`splitImages`, image.file)
      })
      
      await https.post('/api/images/upload-split', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      */

      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 2000))

      ElMessage.success('拆分图片上传成功')

      // 清空预览图片
      previewImages.value = []

      // 跳转到下一张（模拟）
      /*
      const nextResponse = await https.get('/api/images/next-original')
      if (nextResponse.code === 200) {
        originalImage.value = nextResponse.data.imageUrl
        ElMessage.info('已切换到下一张原始图片')
      }
      */
      
      ElMessage.info('已切换到下一张原始图片（模拟）')
    } catch (error) {
      ElMessage.error('上传失败，请重试')
      console.error('上传失败:', error)
    } finally {
      confirming.value = false
    }
  } catch (error) {
    // 用户取消操作
    console.log('用户取消上传操作')
  }
}

// 页面加载时获取原始图片
// getOriginalImage()

// 模拟原始图片（开发测试用）
// originalImage.value = 'https://via.placeholder.com/400x500/4f81bd/ffffff?text=Original+Image'
</script>

<style scoped>
.split-upload-container {
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
  min-height: 650px;
}

.original-image-card, .upload-card {
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

.original-image-container {
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

.original-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.upload-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.upload-section {
  margin-bottom: 20px;
  text-align: center;
  padding: 20px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
}

.upload-btn {
  height: 50px;
  font-size: 16px;
  padding: 0 30px;
}

.upload-tips {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.preview-section {
  flex: 1;
  overflow-y: auto;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.preview-header h4 {
  margin: 0;
  color: #606266;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.preview-item {
  text-align: center;
}

.preview-image-container {
  position: relative;
  width: 120px;
  height: 120px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto;
  background: #fafafa;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preview-image-container:hover .preview-overlay {
  opacity: 1;
}

.remove-btn {
  width: 32px;
  height: 32px;
}

.image-name {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
  line-height: 1.2;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.confirm-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
}

:deep(.el-card__body) {
  height: calc(100% - 57px);
  display: flex;
  flex-direction: column;
}

:deep(.upload-area .el-upload) {
  width: 100%;
}
</style>
