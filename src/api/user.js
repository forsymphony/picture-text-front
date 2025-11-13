import https from '../utils/https'

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码（审核员登录时需要）
 * @param {boolean} isAuditor - 是否为审核员登录
 * @returns {Promise}
 */
export const loginApi = (username, password = '', isAuditor = false) => {
  if (isAuditor) {
    return https.post('/user/auditor/login', { username, password })
  } else {
    return https.post('/user/login', { username })
  }
}

/**
 * 用户登出
 * @returns {Promise}
 */
export const logoutApi = () => {
  return https.post('/user/logout')
}

