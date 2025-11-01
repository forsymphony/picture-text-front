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
                  <el-tag type="info" size="small">拖拽图片可调整顺序</el-tag>
                </div>
                
                <VueDraggable
                  v-model="previewImages"
                  class="preview-grid"
                  :animation="200"
                  ghostClass="ghost"
                  chosenClass="chosen"
                >
                  <div 
                    v-for="(image, index) in previewImages" 
                    :key="image.timestamp"
                    class="preview-item"
                  >
                    <div class="preview-image-container">
                      <div class="drag-handle">
                        <el-icon><Rank /></el-icon>
                      </div>
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
                </VueDraggable>
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
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { VueDraggable } from 'vue-draggable-plus'
import { getSplitTaskApi, submitSplitImagesApi } from '../api/split'
import { uploadImageApi } from '../api/task'

// 响应式数据
const originalImage = ref(null)
const originalImageId = ref(null)
const previewImages = ref([])
const uploading = ref(false)
const confirming = ref(false)

// 获取原始图片（注释版本）

const getOriginalImage = async () => {
  try {
    const response = await getSplitTaskApi()
    if (response.code === 200) {
      originalImageId.value = response.data.id
      originalImage.value = response.data.imageUrl
    }
  } catch (error) {
    console.error('获取原始图片失败:', error)
  }
}

// 上传图片处理
const handleUploadImages = async (file) => {
  uploading.value = true
  
  try {
    // 使用Promise确保按顺序添加图片
    await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = {
          url: e.target.result,
          name: file.name,
          size: file.size,
          file: file,
          timestamp: Date.now() // 添加时间戳确保顺序
        }
        previewImages.value.push(imageData)
        resolve()
      }
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      reader.readAsDataURL(file)
    })
    
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
    
    // 显示全屏loading
    const loading = ElLoading.service({
      lock: true,
      text: '正在上传图片，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      // 按顺序上传每张图片，获取imgUrl列表
      const imgUrlList = []
      
      for (let i = 0; i < previewImages.value.length; i++) {
        const imageData = previewImages.value[i]
        
        // 更新loading文本显示上传进度
        loading.setText(`正在上传第 ${i + 1}/${previewImages.value.length} 张图片...`)
        
        const formData = new FormData()
        formData.append('file', imageData.file)
        
        const uploadResponse = await uploadImageApi(formData)
        
        if (uploadResponse.code === 200) {
          // 按顺序添加到imgUrl列表
          imgUrlList.push(uploadResponse.data.imageUrl)
        } else {
          throw new Error(`上传第 ${i + 1} 张图片失败`)
        }
      }
      
      // 更新loading文本
      loading.setText('正在提交拆分图片...')
      
      // 调用拆分接口
      const splitResponse = await submitSplitImagesApi({
        dataId: originalImageId.value,
        imgUrl: imgUrlList // 保持上传顺序的imgUrl数组
      })
      
      if (splitResponse.code === 200) {
        ElMessage.success('拆分图片上传成功')
        
        // 清空预览图片
        previewImages.value = []
        
        // 获取下一张原始图片
        await getOriginalImage()
        
        ElMessage.info('已切换到下一张原始图片')
      } else {
        throw new Error('提交拆分图片失败')
      }
    } catch (error) {
      ElMessage.error(error.message || '上传失败，请重试')
      console.error('上传失败:', error)
    } finally {
      // 关闭全屏loading
      loading.close()
      confirming.value = false
    }
  } catch (error) {
    // 用户取消操作
    console.log('用户取消上传操作')
  }
}

// 页面加载时获取原始图片
getOriginalImage()

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
  cursor: move;
  transition: transform 0.2s ease;
}

.preview-item:hover {
  transform: scale(1.05);
}

.preview-item.chosen {
  opacity: 0.5;
}

.preview-item.ghost {
  opacity: 0.3;
  background: #409eff;
  border-radius: 8px;
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

.drag-handle {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 10;
  background: rgba(64, 158, 255, 0.9);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  font-size: 14px;
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
