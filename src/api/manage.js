import https from '../utils/https'

/**
 * 获取确认任务图片（单张）
 * @returns {Promise}
 */
export const getConfirmTaskApi = () => {
  return https.get('/task/confirm/get')
}

/**
 * 确认单张图片描述
 * @param {Object} data
 * @returns {Promise}
 */
export const confirmTaskApi = (data) => {
  return https.post('/task/confirm/confirm', data)
}

/**
 * 批量获取确认任务图片
 * @returns {Promise}
 */
export const getConfirmTaskBatchApi = () => {
  return https.get('/task/confirm/get-batch')
}

/**
 * 批量确认图片描述
 * @param {Object} data
 * @param {Array} data.imageDescriptions - 图片描述数组
 * @returns {Promise}
 */
export const confirmTaskBatchApi = (data) => {
  return https.post('/task/confirm/confirm-batch', data)
}

