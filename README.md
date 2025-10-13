# Vue3 后台管理系统

一个基于 Vue3 + Element Plus 的后台管理系统模板。

## 功能特性

- 🚀 Vue3 + Vite 快速开发
- 🎨 Element Plus UI 组件库
- 🔐 用户登录认证
- 📱 响应式布局
- 🛡️ 路由守卫
- 📊 Axios 请求拦截
- 🗃️ Pinia 状态管理

## 项目结构

```
src/
├── layout/          # 布局组件
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
├── utils/           # 工具函数 (axios配置)
├── views/           # 页面组件
├── App.vue          # 根组件
└── main.js          # 入口文件
```

## 安装依赖

```bash
npm install
```

## 启动开发服务器

```bash
npm run dev
```

## 构建生产版本

```bash
npm run build
```

## 使用说明

1. **登录页面**: 输入任意用户名即可登录（需要后端接口支持）
2. **路由守卫**: 未登录用户会自动跳转到登录页
3. **Token管理**: 登录后token会自动保存，所有请求都会携带token
4. **错误处理**: 401错误会自动跳转到登录页，其他错误会显示错误消息

## 接口说明

项目中的 `src/utils/https.js` 配置了 axios 拦截器：

- 请求拦截器：自动添加 Authorization 头部
- 响应拦截器：处理 401 错误和其他业务错误

需要后端提供以下接口：

```
POST /api/auth/login
{
  "username": "用户名"
}

返回格式：
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_here",
    "userInfo": {
      "username": "用户名"
    }
  }
}
```

## 开发提示

- 修改 `src/utils/https.js` 中的 baseURL 为你的后端接口地址
- 在 `src/views/` 目录下添加新的页面组件
- 在 `src/router/index.js` 中配置新的路由
- 使用 Pinia store 管理全局状态
