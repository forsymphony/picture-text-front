import https from '../utils/https'

/**
 * 获取视频任务
 * @returns {Promise}
 */
export const getVideoTaskApi = () => {
  return https.get('/video/task/get')
}

/**
 * 提交视频任务
 * @param {Object} data
 * @param {Array<number>} data.videoIds - 视频ID数组
 * @param {Array<Array<string>>} data.imageUrls - 图片URL二维数组，每个区域是一个数组
 * @returns {Promise}
 */
export const submitVideoTaskApi = (data) => {
  return https.post('/video/task/submit', data)
}

