<template>
  <div class="video-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>视频处理</h2>
      <p>为视频添加相关图片</p>
      <div class="batch-info" v-if="videos.length > 0">
        <el-tag type="primary" size="large">分组号: {{ groupNo }}</el-tag>
        <el-tag type="success" size="large">大类: {{ category }}</el-tag>
        <el-tag type="info" size="large">视频数量: {{ videos.length }}</el-tag>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="40">
        <!-- 左侧：视频显示区域 -->
        <el-col :span="10">
          <el-card class="video-card">
            <template #header>
              <div class="card-title">
                <el-icon><VideoPlay /></el-icon>
                <span>视频列表</span>
              </div>
            </template>
            
            <div class="video-list" v-if="videos.length > 0">
              <div 
                v-for="(video, index) in videos" 
                :key="video.id"
                class="video-item"
              >
                <div class="video-info">
                  <h4>视频 {{ index + 1 }}</h4>
                  <p class="video-status">
                    <el-tag :type="getStatusType(video.status)" size="small">
                      {{ video.status }}
                    </el-tag>
                  </p>
                  <p class="video-time" v-if="video.createTime">
                    {{ formatTime(video.createTime) }}
                  </p>
                </div>
                <div class="video-link-wrapper">
                  <a 
                    :href="video.videoUrl" 
                    target="_blank"
                    class="video-link"
                  >
                    <el-icon class="play-icon"><VideoPlay /></el-icon>
                    <span>点击查看视频</span>
                  </a>
                </div>
              </div>
            </div>
            <div class="video-placeholder" v-else>
              <el-icon class="placeholder-icon"><VideoPlay /></el-icon>
              <p>等待加载视频...</p>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：图片上传区域 -->
        <el-col :span="14">
          <el-card class="upload-card">
            <template #header>
              <div class="card-title">
                <el-icon><Upload /></el-icon>
                <span>图片上传区域</span>
                <el-button 
                  type="primary" 
                  size="small" 
                  class="add-area-btn"
                  @click="addImageArea"
                >
                  <el-icon><Plus /></el-icon>
                  添加区域
                </el-button>
              </div>
            </template>
            
            <div class="upload-content">
              <!-- 图片上传区域列表 -->
              <div 
                v-for="(area, areaIndex) in imageAreas" 
                :key="areaIndex"
                class="image-area"
              >
                <div class="area-header">
                  <h4>区域 {{ areaIndex + 1 }}</h4>
                  <el-button 
                    type="danger" 
                    size="small" 
                    :disabled="imageAreas.length === 1"
                    @click="removeImageArea(areaIndex)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除区域
                  </el-button>
                </div>

                <!-- 上传按钮 -->
                <div class="upload-section">
                  <el-upload
                    class="upload-area"
                    :show-file-list="false"
                    :before-upload="(file) => handleUploadImages(file, areaIndex)"
                    accept="image/*"
                    multiple
                  >
                    <el-button 
                      type="primary" 
                      size="default" 
                      class="upload-btn"
                    >
                      <el-icon><Plus /></el-icon>
                      上传图片
                    </el-button>
                  </el-upload>
                  <p class="upload-tips">可同时选择多张图片上传</p>
                </div>

                <!-- 预览图片区域 -->
                <div class="preview-section" v-if="area.images.length > 0">
                  <div class="preview-header">
                    <h5>预览 ({{ area.images.length }}张)</h5>
                    <el-tag type="info" size="small">拖拽调整顺序</el-tag>
                  </div>
                  
                  <VueDraggable
                    v-model="area.images"
                    class="preview-grid"
                    :animation="200"
                    ghostClass="ghost"
                    chosenClass="chosen"
                  >
                    <div 
                      v-for="(image, imageIndex) in area.images" 
                      :key="image.timestamp"
                      class="preview-item"
                    >
                      <div class="preview-image-container">
                        <div class="drag-handle">
                          <el-icon><Rank /></el-icon>
                        </div>
                        <img :src="image.url" :alt="`预览图 ${imageIndex + 1}`" class="preview-image" />
                        <div class="preview-overlay">
                          <el-button 
                            type="danger" 
                            size="small" 
                            circle 
                            @click="removePreviewImage(areaIndex, imageIndex)"
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
                  <el-empty description="暂无上传图片" :image-size="80" />
                </div>
              </div>

              <!-- 按钮区域 -->
              <div class="next-section">
                <el-button 
                  type="danger" 
                  size="large" 
                  class="garbage-btn"
                  :disabled="videos.length === 0"
                  :loading="markingGarbage"
                  @click="handleMarkGarbage"
                >
                  <el-icon><Delete /></el-icon>
                  {{ markingGarbage ? '标记中...' : '标记为垃圾视频' }}
                </el-button>
                <el-button 
                  type="success" 
                  size="large" 
                  class="next-btn"
                  :disabled="!canProceedNext"
                  :loading="submitting"
                  @click="handleNext"
                >
                  <el-icon><ArrowRight /></el-icon>
                  {{ submitting ? '提交中...' : '下一个' }}
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
import { ref, computed } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { VueDraggable } from 'vue-draggable-plus'
import { getVideoTaskApi, submitVideoTaskApi, markGarbageVideoApi } from '../api/video'
import { uploadImageApi } from '../api/task'

// 响应式数据
const videos = ref([])
const category = ref(null)
const groupNo = ref(null)
const imageAreas = ref([{ images: [] }]) // 每个区域包含一个图片数组
const submitting = ref(false)
const markingGarbage = ref(false)

// 计算属性：是否可以进行下一步（至少有一个区域有图片）
const canProceedNext = computed(() => {
  return imageAreas.value.some(area => area.images.length > 0)
})

// 获取视频任务
const getVideoTask = async () => {
  try {
    const response = await getVideoTaskApi()
    if (response.code === 200) {
      videos.value = response.data.videos || []
      category.value = response.data.category
      groupNo.value = response.data.groupNo
      
      // 重置图片区域
      imageAreas.value = [{ images: [] }]
    }
  } catch (error) {
    ElMessage.error('获取视频任务失败')
    console.error('获取视频任务失败:', error)
  }
}

// 添加图片上传区域
const addImageArea = () => {
  imageAreas.value.push({ images: [] })
}

// 删除图片上传区域
const removeImageArea = (index) => {
  if (imageAreas.value.length > 1) {
    imageAreas.value.splice(index, 1)
  } else {
    ElMessage.warning('至少需要保留一个区域')
  }
}

// 上传图片处理
const handleUploadImages = async (file, areaIndex) => {
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
          timestamp: Date.now()
        }
        imageAreas.value[areaIndex].images.push(imageData)
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
  }

  return false // 阻止默认上传行为
}

// 删除预览图片
const removePreviewImage = (areaIndex, imageIndex) => {
  const image = imageAreas.value[areaIndex].images[imageIndex]
  imageAreas.value[areaIndex].images.splice(imageIndex, 1)
  ElMessage.success(`已删除图片: ${image.name}`)
}

// 处理下一个
const handleNext = async () => {
  if (!canProceedNext.value) {
    ElMessage.warning('请至少在一个区域上传图片')
    return
  }

  submitting.value = true
  
  // 显示全屏loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在上传图片，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 按顺序上传所有图片：从第一个区域的第一张开始，依次上传
    const imageUrls = [] // 二维数组，每个区域是一个数组
    
    let totalImages = 0
    let uploadedCount = 0
    
    // 计算总图片数
    imageAreas.value.forEach(area => {
      totalImages += area.images.length
    })
    
    // 按区域顺序上传
    for (let areaIndex = 0; areaIndex < imageAreas.value.length; areaIndex++) {
      const area = imageAreas.value[areaIndex]
      const areaImageUrls = [] // 当前区域的图片URL数组
      
      // 上传当前区域的所有图片
      for (let imageIndex = 0; imageIndex < area.images.length; imageIndex++) {
        const imageData = area.images[imageIndex]
        uploadedCount++
        
        // 更新loading文本显示上传进度
        loading.setText(`正在上传第 ${uploadedCount}/${totalImages} 张图片...`)
        
        const formData = new FormData()
        formData.append('file', imageData.file)
        
        const uploadResponse = await uploadImageApi(formData)
        
        if (uploadResponse.code === 200) {
          // 按顺序添加到当前区域的URL数组
          areaImageUrls.push(uploadResponse.data.imageUrl)
        } else {
          throw new Error(`上传第 ${uploadedCount} 张图片失败`)
        }
      }
      
      // 将当前区域的URL数组添加到总数组
      imageUrls.push(areaImageUrls)
    }
    
    // 更新loading文本
    loading.setText('正在提交数据...')
    
    // 提取视频ID数组
    const videoIds = videos.value.map(video => video.id)
    
    // 调用提交接口
    const response = await submitVideoTaskApi({
      videoIds: videoIds,
      imageUrls: imageUrls
    })
    
    if (response.code === 200) {
      ElMessage.success('提交成功')
      
      // 获取新的视频任务
      await getVideoTask()
    } else {
      throw new Error('提交失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '提交失败，请重试')
    console.error('提交失败:', error)
  } finally {
    loading.close()
    submitting.value = false
  }
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    '待处理': 'info',
    '处理中': 'warning',
    '已完成': 'success',
    '失败': 'danger'
  }
  return statusMap[status] || 'info'
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}

// 标记垃圾视频
const handleMarkGarbage = async () => {
  if (videos.value.length === 0) {
    ElMessage.warning('没有可标记的视频')
    return
  }

  try {
    // 确认操作
    await ElMessageBox.confirm(
      `确定要将这${videos.value.length}个视频标记为垃圾视频吗？`,
      '确认标记',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    markingGarbage.value = true
    
    // 显示全屏loading
    const loading = ElLoading.service({
      lock: true,
      text: '正在标记垃圾视频，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      // 依次标记每个视频
      for (let i = 0; i < videos.value.length; i++) {
        const video = videos.value[i]
        loading.setText(`正在标记第 ${i + 1}/${videos.value.length} 个视频...`)
        
        const response = await markGarbageVideoApi(video.id)
        
        if (response.code !== 200) {
          throw new Error(`标记第 ${i + 1} 个视频失败`)
        }
      }
      
      ElMessage.success('标记成功')
      
      // 获取下一组视频
      loading.setText('正在获取下一组视频...')
      await getVideoTask()
    } catch (error) {
      ElMessage.error(error.message || '标记失败，请重试')
      console.error('标记垃圾视频失败:', error)
    } finally {
      loading.close()
      markingGarbage.value = false
    }
  } catch {
    // 用户取消操作
  }
}

// 页面加载时获取视频任务
getVideoTask()
</script>

<style scoped>
.video-container {
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
  min-height: 650px;
}

.video-card, .upload-card {
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

.add-area-btn {
  margin-left: auto;
}

.video-list {
  height: 100%;
  overflow-y: auto;
}

.video-item {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.video-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.video-info {
  margin-bottom: 10px;
}

.video-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.video-status {
  margin: 5px 0;
}

.video-time {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 12px;
}

.video-link-wrapper {
  width: 100%;
}

.video-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.video-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.video-link .play-icon {
  font-size: 20px;
}

.video-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-content {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-area {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.area-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.upload-section {
  margin-bottom: 15px;
  text-align: center;
  padding: 15px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: white;
}

.upload-btn {
  height: 40px;
  font-size: 14px;
  padding: 0 20px;
}

.upload-tips {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.preview-section {
  margin-bottom: 15px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.preview-header h5 {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  max-height: 200px;
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
  width: 100px;
  height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto;
  background: #fafafa;
}

.drag-handle {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 10;
  background: rgba(64, 158, 255, 0.9);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  font-size: 12px;
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
  width: 28px;
  height: 28px;
}

.image-name {
  margin-top: 5px;
  font-size: 11px;
  color: #606266;
  word-break: break-all;
  line-height: 1.2;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  padding: 20px 0;
}

.next-section {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  position: sticky;
  bottom: 0;
  background: white;
  display: flex;
  gap: 10px;
}

.garbage-btn {
  flex: 1;
  height: 50px;
  font-size: 16px;
}

.next-btn {
  flex: 1;
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

