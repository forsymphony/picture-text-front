import https from '../utils/https'

/**
 * 获取拆分任务图片
 * @returns {Promise}
 */
export const getSplitTaskApi = () => {
  return https.get('/task/split/get')
}

