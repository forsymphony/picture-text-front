<template>
  <div class="auditor-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>审核员管理系统</h2>
      <p>请管理所属学生</p>
    </div>
    
    <div class="main-content">
      <el-row>
        <el-col :span="24">
          <el-card class="main-card">
            <div class="student-config-section">
              <h3>学生管理</h3>
              
              <!-- 学生分配操作区 -->
              <div class="operation-area">
                <el-select
                  v-model="selectedStudentIds"
                  multiple
                  filterable
                  placeholder="请选择学生"
                  class="student-select"
                >
                  <el-option
                    v-for="student in availableStudents"
                    :key="student.userId"
                    :label="`${student.username} (${student.userId})`"
                    :value="student.userId"
                  ></el-option>
                </el-select>
                <el-button type="primary" @click="assignStudents" :disabled="selectedStudentIds.length === 0">
                  批量分配
                </el-button>
              </div>
              
              <!-- 已分配学生列表 -->
              <div class="student-list-section">
                <div class="section-header">
                  <h4>已分配学生列表</h4>
                  <el-button 
                    type="danger" 
                    @click="batchUnassignStudents" 
                    :disabled="selectedAssignedStudents.length === 0"
                  >
                    批量解绑
                  </el-button>
                </div>
                <el-table 
                  :data="assignedStudents" 
                  stripe 
                  style="width: 100%"
                  @selection-change="handleSelectionChange"
                >
                  <el-table-column type="selection" width="55"></el-table-column>
                  <el-table-column prop="userId" label="学生ID" width="120" />
                  <el-table-column prop="username" label="用户名" width="180" />
                  <el-table-column prop="groupCount" label="视频分组数量" width="160">
                    <template #default="scope">
                      {{ scope.row.groupCount || 0 }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="300" fixed="right">
                    <template #default="scope">
                      <el-button
                        type="success"
                        size="small"
                        @click="handleAudit(scope.row.userId)"
                      >
                        审核作业
                      </el-button>
                      <el-button
                        type="danger"
                        size="small"
                        @click="unassignStudent(scope.row.userId)"
                      >
                        解绑
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
                
                <!-- 分页组件 -->
                <div class="pagination-container">
                  <el-pagination
                    v-model:current-page="pagination.currentPage"
                    v-model:page-size="pagination.pageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="pagination.total"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                  />
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import https from '../utils/https'
import { useUserStore } from '../stores/user'

// 路由
const router = useRouter()

// 移除标签页相关代码

// 用户信息
const userStore = useUserStore()
const currentUser = userStore.userInfo || { userId: null }

// 已分配学生列表
const assignedStudents = ref([])

// 可分配学生列表
const availableStudents = ref([])

// 选中的学生ID列表（待分配）
const selectedStudentIds = ref([])

// 选中的已分配学生列表（待解绑）
const selectedAssignedStudents = ref([])

// 分页参数
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 处理表格选择事件
const handleSelectionChange = (selection) => {
  selectedAssignedStudents.value = selection
}

// 获取已分配学生列表
const fetchAssignedStudents = async () => {
  try {
    const response = await https.get(`/auditor/students/assigned?auditorId=${currentUser.userId}&pageNum=${pagination.value.currentPage}&pageSize=${pagination.value.pageSize}`)
    assignedStudents.value = response.data.records || []
    pagination.value.total = response.data.total || 0
  } catch (error) {
    console.error('获取已分配学生列表失败：', error)
  }
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  fetchAssignedStudents()
}

// 当前页码改变
const handleCurrentChange = (current) => {
  pagination.value.currentPage = current
  fetchAssignedStudents()
}

// 获取可分配学生列表
const fetchAvailableStudents = async () => {
  try {
    const response = await https.get('/auditor/students/available')
    availableStudents.value = response.data || []
  } catch (error) {
    console.error('获取可分配学生列表失败：', error)
  }
}

// 分配学生
const assignStudents = async () => {
  if (selectedStudentIds.value.length === 0) {
    ElMessage.warning('请选择要分配的学生')
    return
  }

  try {
    // 批量分配学生
    const response = await https.post('/auditor/students/assign', {
      auditorId: currentUser.userId,
      studentIds: selectedStudentIds.value
    })
    
    ElMessage.success('学生分配成功')
    // 重新加载数据
    await Promise.all([fetchAssignedStudents(), fetchAvailableStudents()])
    selectedStudentIds.value = []
  } catch (error) {
    console.error('分配学生失败：', error)
  }
}

// 解绑单个学生
const unassignStudent = async (studentId) => {
  try {
    const response = await https.post('/auditor/students/unassign', {
      auditorId: currentUser.userId,
      studentIds: [studentId]
    })
    
    ElMessage.success('学生解绑成功')
    // 重新加载数据
    await Promise.all([fetchAssignedStudents(), fetchAvailableStudents()])
  } catch (error) {
    console.error('学生解绑失败：', error)
  }
}

// 审核学生作业
const handleAudit = (studentId) => {
  router.push(`/auditor/audit-assignment/${studentId}`)
}

// 批量解绑学生
const batchUnassignStudents = async () => {
  if (selectedAssignedStudents.value.length === 0) {
    ElMessage.warning('请选择要解绑的学生')
    return
  }

  try {
    const studentIds = selectedAssignedStudents.value.map(student => student.userId)
    const response = await https.post('/auditor/students/unassign', {
      auditorId: currentUser.userId,
      studentIds: studentIds
    })
    
    ElMessage.success('学生批量解绑成功')
    // 重新加载数据
    await Promise.all([fetchAssignedStudents(), fetchAvailableStudents()])
    selectedAssignedStudents.value = []
  } catch (error) {
    console.error('批量解绑学生失败：', error)
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  // 检查用户登录状态
  await userStore.checkAuth()
  
  if (userStore.userInfo?.isAuditor && userStore.userInfo?.userId) {
    currentUser.userId = userStore.userInfo.userId
    await fetchAssignedStudents()
    await fetchAvailableStudents()
  } else {
    ElMessage.error('您不是审核员或登录已过期，请重新登录')
    // 可以考虑跳转到登录页
  }
})
</script>

<style scoped>
.auditor-dashboard {
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
  height: 600px;
}

.main-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  padding: 20px;
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
}

.student-config-section {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  min-height: 400px;
}

.student-config-section h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
}

.section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 30px;
      margin-bottom: 15px;
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }

.student-config-section h4 {
  color: #333;
  font-size: 16px;
  margin: 0;
}

.student-config-section p {
  color: #666;
  font-size: 14px;
}

.operation-area {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.student-select {
  width: 300px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .auditor-dashboard {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .page-header h2 {
    font-size: 20px;
  }
  
  .main-content {
    height: auto;
    min-height: 400px;
  }
  
  .student-select {
    width: 100%;
  }
  
  .operation-area {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  /* 表格响应式 */
  :deep(.el-table) {
    font-size: 12px;
  }
  
  :deep(.el-table__cell) {
    padding: 8px 4px;
  }
  
  /* 按钮响应式 */
  :deep(.el-button) {
    width: 100%;
    margin-bottom: 5px;
  }
}

.student-list-section {
  margin-top: 20px;
}
</style>