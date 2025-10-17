import https from '../utils/https'

/**
 * 用户登录
 * @param {string} username - 用户名
 * @returns {Promise}
 */
export const loginApi = (username) => {
  return https.post('/user/login', { username })
}

/**
 * 用户登出
 * @returns {Promise}
 */
export const logoutApi = () => {
  return https.post('/user/logout')
}

