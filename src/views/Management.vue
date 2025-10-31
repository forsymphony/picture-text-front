<template>
  <div class="description-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>图文描述</h2>
      <p>为图片添加和修改文字描述</p>
      <div class="batch-info" v-if="currentImages.length > 0">
        <el-tag type="primary" size="large">分组号: {{ groupNo }}</el-tag>
        <el-tag type="success" size="large">大类: {{ category }}</el-tag>
        <el-tag type="info" size="large">进度: {{ currentImageIndex + 1 }} / {{ currentImages.length }}</el-tag>
      </div>
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
                  :disabled="isDescriptionConsistent !== false"
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
import { ElMessage, ElLoading } from 'element-plus'
import { getConfirmTaskBatchApi, confirmTaskBatchApi } from '../api/manage'

// 响应式数据
const currentImage = ref(null)
const description = ref('')
const isDescriptionConsistent = ref(null)
const currentImageId = ref(null)

// 批量处理相关数据
const currentImages = ref([]) // 当前批次的所有图片
const currentImageIndex = ref(0) // 当前显示的图片索引
const pendingConfirmations = ref([]) // 待提交的确认信息数组
const splitGroupId = ref(null) // 分组ID
const category = ref(null) // 大类
const groupNo = ref(null) // 分组号

// 计算属性：是否可以进行下一张
const canProceedNext = computed(() => {
  return isDescriptionConsistent.value !== null
})

// 批量获取图片和描述
const getBatchImages = async () => {
  try {
    const response = await getConfirmTaskBatchApi()
    if (response.code === 200) {
      // 保存批次信息
      splitGroupId.value = response.data.splitGroupId
      category.value = response.data.category
      groupNo.value = response.data.groupNo
      currentImages.value = response.data.images || []
      
      // 重置索引和待提交数组
      currentImageIndex.value = 0
      pendingConfirmations.value = []
      
      // 显示第一张图片
      if (currentImages.value.length > 0) {
        loadCurrentImage()
      } else {
        ElMessage.warning('暂无图片需要确认')
      }
    }
  } catch (error) {
    console.error('获取批量图片失败:', error)
  }
}

// 加载当前索引的图片
const loadCurrentImage = () => {
  const currentImageData = currentImages.value[currentImageIndex.value]
  if (currentImageData) {
    currentImage.value = currentImageData.imageUrl
    currentImageId.value = currentImageData.id
    description.value = currentImageData.description || ''
    // 重置确认状态
    isDescriptionConsistent.value = null
  }
}

// 下一张图片
const handleNextImage = async () => {
  if (!canProceedNext.value) {
    ElMessage.warning('请先确认描述是否一致')
    return
  }

  try {
    // 保存当前图片的确认信息到待提交数组
    const confirmData = {
      dataId: currentImageId.value,
      isCorrect: isDescriptionConsistent.value,
    }
    
    // 如果描述不一致，添加修改后的描述
    if (!isDescriptionConsistent.value) {
      confirmData.description = description.value
    }
    
    pendingConfirmations.value.push(confirmData)
    
    // 判断是否还有下一张图片
    if (currentImageIndex.value < currentImages.value.length - 1) {
      // 还有图片，显示下一张
      currentImageIndex.value++
      loadCurrentImage()
    } else {
      // 没有图片了，批量提交并获取新的批次
      await submitBatchConfirmations()
    }
  } catch (error) {
    ElMessage.error('处理失败')
    console.error('处理图片失败:', error)
  }
}

// 批量提交确认信息
const submitBatchConfirmations = async () => {
  if (pendingConfirmations.value.length === 0) {
    ElMessage.warning('没有待提交的确认信息')
    return
  }
  
  // 显示全屏loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在提交确认信息...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    // 调用批量确认接口
    const response = await confirmTaskBatchApi({
      imageDescriptions: pendingConfirmations.value
    })
    
    if (response.code === 200) {
      ElMessage.success('批量确认成功')
      
      // 获取新的批次
      await getBatchImages()
    } else {
      throw new Error('批量确认失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '批量确认失败')
    console.error('批量确认失败:', error)
  } finally {
    loading.close()
  }
}

// 页面加载时获取初始数据
getBatchImages()
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

.batch-info {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 15px;
  align-items: center;
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
  height: 200px !important;
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
