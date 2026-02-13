/**
 * 通知消息组件
 * 在屏幕右上角显示操作反馈通知
 */
import React from 'react'

/** 组件属性 */
interface NotificationProps {
  /** 消息内容 */
  message: string
  /** 消息类型：success/error/info */
  type: 'success' | 'error' | 'info'
}

/**
 * 通知消息气泡组件
 * 根据类型显示不同颜色的通知
 */
function Notification({ message, type }: NotificationProps): React.ReactElement {
  return <div className={`notification ${type}`}>{message}</div>
}

export default Notification
