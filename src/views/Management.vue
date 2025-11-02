<template>
  <div class="description-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>图文描述</h2>
      <p>为图片添加和修改文字描述</p>
      <div class="batch-info" v-if="currentImages.length > 0">
        <el-tag type="primary" size="large">分组号: {{ groupNo }}</el-tag>
        <el-tag type="success" size="large">大类: {{ category }}</el-tag>
        <el-tag type="info" size="large">总数: {{ currentImages.length }}</el-tag>
        <el-tag :type="allConfirmed ? 'success' : 'warning'" size="large">
          已确认: {{ confirmedCount }} / {{ currentImages.length }}
        </el-tag>
      </div>
    </div>

    <!-- 主要内容区域 - 滚动显示所有图片和描述 -->
    <div class="main-content">
      <!-- 图片描述列表 -->
      <div 
        v-for="(image, index) in currentImages" 
        :key="image.id"
        class="image-item-wrapper"
      >
        <el-row :gutter="40">
          <!-- 左侧：图片显示区域 -->
          <el-col :span="12">
            <el-card class="image-card">
              <template #header>
                <div class="card-title">
                  <el-icon><Picture /></el-icon>
                  <span>图片 {{ index + 1 }}</span>
                  <el-tag 
                    :type="image.isConfirmed === null ? 'info' : (image.isConfirmed ? 'success' : 'warning')" 
                    size="small" 
                    class="status-tag"
                  >
                    {{ image.isConfirmed === null ? '未确认' : (image.isConfirmed ? '已确认' : '需修改') }}
                  </el-tag>
                </div>
              </template>
              
              <div class="image-container">
                <img :src="image.imageUrl" :alt="`图片 ${index + 1}`" class="current-image" />
              </div>
            </el-card>
          </el-col>

          <!-- 右侧：描述编辑区域 -->
          <el-col :span="12">
            <el-card class="description-card">
              <template #header>
                <div class="card-title">
                  <el-icon><EditPen /></el-icon>
                  <span>描述 {{ index + 1 }}</span>
                </div>
              </template>
              
              <div class="description-content">
                <!-- 描述文本区域 -->
                <div class="textarea-section">
                  <el-input
                    v-model="image.description"
                    type="textarea"
                    :rows="8"
                    placeholder="请输入或修改图片描述..."
                    class="description-textarea"
                    :disabled="image.isConfirmed !== false"
                  />
                </div>

                <!-- 确认选项 -->
                <div class="confirm-section">
                  <div class="confirm-group">
                    <label class="confirm-label">描述是否一致：</label>
                    <el-radio-group v-model="image.isConfirmed" class="radio-group">
                      <el-radio :label="true">一致</el-radio>
                      <el-radio :label="false">不一致</el-radio>
                    </el-radio-group>
                  </div>
                </div>

                <!-- 状态显示 -->
                <div class="status-info">
                  <div class="status-item">
                    <span class="status-label">字符数：</span>
                    <el-tag type="info" size="small">{{ image.description?.length || 0 }} 字符</el-tag>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section" v-if="currentImages.length > 0">
        <el-button 
          type="primary" 
          size="large" 
          class="submit-btn"
          :disabled="!allConfirmed"
          :loading="submitting"
          @click="handleSubmit"
        >
          <el-icon><Check /></el-icon>
          {{ submitting ? '提交中...' : '确认并获取下一组' }}
        </el-button>
        <p class="submit-tip" v-if="!allConfirmed">
          请确认所有描述都为"一致"后再提交
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { getConfirmTaskBatchApi, confirmTaskBatchApi } from '../api/manage'

// 响应式数据
const currentImages = ref([]) // 当前批次的所有图片，每个图片对象包含 isConfirmed 状态
const splitGroupId = ref(null) // 分组ID
const category = ref(null) // 大类
const groupNo = ref(null) // 分组号
const submitting = ref(false) // 提交中状态

// 计算属性：已确认的数量
const confirmedCount = computed(() => {
  return currentImages.value.filter(img => img.isConfirmed === true).length
})

// 计算属性：是否全部确认为一致
const allConfirmed = computed(() => {
  if (currentImages.value.length === 0) return false
  return currentImages.value.every(img => img.isConfirmed === true)
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
      
      // 处理图片数据，为每个图片添加 isConfirmed 状态
      currentImages.value = (response.data.images || []).map(img => ({
        ...img,
        isConfirmed: null // null: 未选择, true: 一致, false: 不一致
      }))
      
      if (currentImages.value.length === 0) {
        ElMessage.warning('暂无图片需要确认')
      }
    }
  } catch (error) {
    console.error('获取批量图片失败:', error)
    ElMessage.error('获取批量图片失败')
  }
}

// 提交确认信息
const handleSubmit = async () => {
  if (!allConfirmed.value) {
    ElMessage.warning('请确认所有描述都为"一致"后再提交')
    return
  }

  submitting.value = true
  
  // 显示全屏loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在提交确认信息...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    // 构建提交数据
    const imageDescriptions = currentImages.value.map(img => {
      const data = {
        dataId: img.id,
        isCorrect: img.isConfirmed,
      }
      
      // 如果描述不一致，添加修改后的描述
      if (!img.isConfirmed) {
        data.description = img.description
      }
      
      return data
    })
    
    // 调用批量确认接口
    const response = await confirmTaskBatchApi({
      imageDescriptions: imageDescriptions
    })
    
    if (response.code === 200) {
      ElMessage.success('批量确认成功')
      
      // 获取新的批次
      await getBatchImages()
      
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      throw new Error('批量确认失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '批量确认失败')
    console.error('批量确认失败:', error)
  } finally {
    loading.close()
    submitting.value = false
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
  flex-wrap: wrap;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.image-item-wrapper {
  margin-bottom: 20px;
  padding-bottom: 30px;
  border-bottom: 2px solid #e4e7ed;
}

.image-item-wrapper:last-child {
  border-bottom: none;
}

.image-card, .description-card {
  height: 450px;
}

.card-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #303133;
  gap: 10px;
}

.card-title .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

.card-title span {
  flex: 1;
}

.status-tag {
  margin-left: auto;
  font-weight: 600;
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
  gap: 15px;
}

.textarea-section {
  flex: 1;
}

:deep(.description-textarea .el-textarea__inner) {
  height: 180px !important;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
}

.confirm-section {
  padding: 12px 0;
  border-top: 1px solid #ebeef5;
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

.status-info {
  padding: 10px 0;
  border-top: 1px solid #ebeef5;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-label {
  font-size: 14px;
  color: #606266;
}

.submit-section {
  text-align: center;
  padding: 30px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  position: sticky;
  bottom: 20px;
  z-index: 10;
}

.submit-btn {
  width: 100%;
  max-width: 600px;
  height: 55px;
  font-size: 18px;
  font-weight: 600;
}

.submit-tip {
  margin-top: 10px;
  color: #e6a23c;
  font-size: 14px;
}

:deep(.el-card__body) {
  height: calc(100% - 57px);
  display: flex;
  flex-direction: column;
}
</style>
