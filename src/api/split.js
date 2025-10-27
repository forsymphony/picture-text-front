import https from '../utils/https'

/**
 * 获取拆分任务图片
 * @returns {Promise}
 */
export const getSplitTaskApi = () => {
  return https.get('/task/split/get')
}

/**
 * 提交拆分图片
 * @param {Object} data - 拆分数据
 * @param {number} data.dataId - 原始图片ID
 * @param {Array<string>} data.imgUrl - 拆分图片URL数组（保持上传顺序）
 * @returns {Promise}
 */
export const submitSplitImagesApi = (data) => {
  return https.post('/api/task/split/split', data)
}

