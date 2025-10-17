import https from '../utils/https'

/**
 * 获取确认任务图片
 * @returns {Promise}
 */
export const getConfirmTaskApi = () => {
  return https.get('/task/confirm/get')
}

export const confirmTaskApi = (data) => {
  return https.post('/task/confirm/confirm', data)
}

