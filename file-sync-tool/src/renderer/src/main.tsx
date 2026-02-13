/**
 * 渲染进程入口文件
 * 初始化 React 应用并挂载到 DOM
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

// 挂载 React 应用到根节点
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
