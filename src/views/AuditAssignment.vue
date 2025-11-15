<template>
  <div class="audit-assignment-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>审核学员作业</h2>
      <div class="batch-info" v-if="assignmentInfo.studentName">
        <el-tag size="large">学员: {{ assignmentInfo.studentName }}</el-tag>
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
              <p>暂无视频任务</p>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：审核任务区域 -->
        <el-col :span="14">
          <el-card class="upload-card">
            <template #header>
              <div class="card-title">
                <el-icon><Picture /></el-icon>
                <span>审核任务</span>
                <span v-if="assignmentInfo.studentName" class="student-name"> - {{ assignmentInfo.studentName }}</span>
              </div>
            </template>
            
            <!-- 作业结果展示 -->
            <div class="result-content">
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
                        <img :src="image.url" :alt="`预览图 ${imageIndex + 1}`" class="preview-image" @click="previewImage(image.url)" />
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
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 底部返回按钮 -->
      <div class="bottom-actions">
        <el-button 
          type="info" 
          size="large" 
          class="back-btn"
          @click="goBack"
        >
          <el-icon><Back /></el-icon>
          返回学员列表
        </el-button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { VideoPlay, Picture, Close, Check, Star, Back, Delete, Rank, Plus } from '@element-plus/icons-vue'
import request from '../utils/https'
import { VueDraggable } from 'vue-draggable-plus'

// 路由
const router = useRouter()
const route = useRoute()

// 状态
const isProcessing = ref(false)
const loading = ref(false)

// 作业信息
const assignmentInfo = ref({
  studentName: '',
  groupNo: '',
  status: 'pending',
  studentId: '',
  submitTime: '',
  type: ''
})

const videos = ref([])
const category = ref(null)
const groupNo = ref(null)
// 图片区域
const imageAreas = ref([{ images: [] }])




// 生命周期
onMounted(() => {
  // 获取学员ID
  const studentId = route.params.id
  if (studentId) {
    loadStudentAssignmentData(studentId)
  }
})


// 获取视频任务
const getVideoTask = async (studentId) => {
  try {
    const response = await request.post(`/auditor/getStudentWork/${studentId}`)
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

// 加载学员作业数据
const loadStudentAssignmentData = async (studentId) => {
  loading.value = true

    // 1. 获取学员基本信息 (tb_user)
    const studentRes = await request.post(`/auditor/getStudent/${studentId}`)
    assignmentInfo.value.studentName = studentRes.data.username
    assignmentInfo.value.studentId = studentId
    
    // 2. 获取学员作业视频信息
    await getVideoTask(studentId)
    
    // 3. 获取图片数据
    if (videos.value.length > 0) {
      const videoIds = videos.value.map(video => video.id)
      try {
        const imagesRes = await request.post('/auditor/getStudentWorkImages', videoIds)
        if (imagesRes.code === 200) {
          const imagesByGroup = imagesRes.data.imagesByGroup
          if (imagesByGroup && Object.keys(imagesByGroup).length > 0) {
            // 根据分组创建图片区域
            imageAreas.value = Object.keys(imagesByGroup).map(groupKey => {
              return {
                images: imagesByGroup[groupKey].map(imageItem => ({
                  url: imageItem.imageUrl,
                  name: `图片_${imageItem.id}`,
                  size: 0,
                  timestamp: Date.now() + Math.random()
                }))
              }
            })
          } else {
            // 默认创建一个空区域
            imageAreas.value = [{ images: [] }]
          }
        } else {
          ElMessage.warning('获取图片数据失败')
          imageAreas.value = [{ images: [] }]
        }
      } catch (error) {
        ElMessage.error('获取图片数据失败')
        console.error('获取图片数据失败:', error)
        imageAreas.value = [{ images: [] }]
      }
    } else {
      // 默认创建一个空区域
      imageAreas.value = [{ images: [] }]
    }

}

// 返回学员列表
const goBack = () => {
  router.push('/auditor/dashboard')
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

// 获取状态标签类型
const getStatusType = (status) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}

// 预览图片
const previewImage = (url) => {
  // 可以使用 Element Plus 的 Image 预览组件或自定义弹窗
  window.open(url, '_blank')
}


</script>

<style scoped>
.video-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.batch-info {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
}

.video-card, .upload-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.student-name {
  margin-left: 10px;
  font-weight: normal;
  color: #606266;
  font-size: 14px;
}

/* 左侧视频列表样式 */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-item {
  background-color: #f7f8fa;
  padding: 15px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.video-item:hover {
  background-color: #ecf5ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.video-info h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
}

.video-status {
  margin: 0 0 8px 0;
}

.video-time {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.video-link-wrapper {
  margin-top: 10px;
}

.video-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  text-decoration: none;
  transition: color 0.3s;
  font-weight: 500;
}

.video-link:hover {
  color: #66b1ff;
}

.play-icon {
  font-size: 16px;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  color: #909399;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

/* 图片上传区域样式 */
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
  padding: 60px 20px;
}

:deep(.upload-area .el-upload) {
  width: 100%;
}

/* 审核操作按钮样式 */
.audit-section {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.reject-btn, .approve-btn, .score-btn {
  flex: 1;
}

/* 底部操作样式 */
.bottom-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-start;
}

.back-btn {
  min-width: 150px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .batch-info {
    width: 100%;
    justify-content: space-between;
  }
  
  .preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .preview-image-container {
    height: 120px;
  }
  
  .audit-section {
    flex-direction: column;
  }
}

@media (max-width: 576px) {
  .video-container {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .page-header h2 {
    font-size: 20px;
  }
  
  .batch-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .preview-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .preview-image-container {
    height: 100px;
  }
}
</style>