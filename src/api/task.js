import https from '../utils/https'

/**
 * 获取识别任务图片
 * @returns {Promise}
 */
export const getRecognitionTaskApi = () => {
  return https.get('/task/recognition/get')
}

/**
 * 标记内容类型（下一张）
 * @param {Object} data - 标注数据
 * @param {number} data.dataId - 图片ID
 * @param {boolean} data.isMainText - 是否是正文
 * @param {boolean} data.isWatermarkFree - 是否已无水印
 * @returns {Promise}
 */
export const markContentTypeApi = (data) => {
  return https.post('/task/recognition/mark-content-type', data)
}

/**
 * 标记为拆分图
 * @param {Object} data - 标注数据
 * @param {number} data.dataId - 图片ID
 * @returns {Promise}
 */
export const markSplitImageApi = (data) => {
  return https.post('/task/recognition/mark-split', data)
}

/**
 * 上传图片到服务器
 * @param {FormData} formData - 图片表单数据
 * @returns {Promise}
 */
export const uploadImageApi = (formData) => {
  return https.post('/api/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 替换当前识别任务的图片
 * @param {Object} data - 替换数据
 * @param {number} data.dataId - 当前图片ID
 * @param {string} data.imageUrl - 新图片URL
 * @returns {Promise}
 */
export const replaceRecognitionImageApi = (data) => {
  return https.post('/task/recognition/replace', data)
}

