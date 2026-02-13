/**
 * 应用根组件
 * 根据是否设置工作目录，显示设置页面或主界面
 */
import React, { useState, useEffect, useCallback } from 'react'
import SetupPage from './components/SetupPage'
import MainLayout from './components/MainLayout'
import Notification from './components/Notification'

/**
 * 通知消息类型
 */
export interface NotificationMessage {
  /** 唯一标识 */
  id: string
  /** 消息内容 */
  message: string
  /** 消息类型 */
  type: 'success' | 'error' | 'info'
}

/**
 * App 根组件
 * 管理全局状态：工作目录、通知消息
 */
function App(): React.ReactElement {
  /** 工作目录路径，null 表示未设置 */
  const [workDir, setWorkDir] = useState<string | null>(null)
  /** 是否正在加载配置 */
  const [loading, setLoading] = useState(true)
  /** 通知消息队列 */
  const [notifications, setNotifications] = useState<NotificationMessage[]>([])

  /**
   * 初始化：从存储中获取工作目录
   */
  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        const dir = await window.api.getWorkDir()
        setWorkDir(dir)
      } catch (error) {
        console.error('获取工作目录失败:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  /**
   * 显示通知消息
   * @param message - 消息内容
   * @param type - 消息类型
   */
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
    // 3秒后自动移除通知
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }, [])

  /**
   * 设置工作目录的回调
   * @param dir - 选择的目录路径
   */
  const handleSetWorkDir = useCallback(
    async (dir: string) => {
      await window.api.setWorkDir(dir)
      // 初始化 Git 仓库
      const result = await window.api.gitInit(dir)
      if (result.success) {
        if (result.isNew) {
          showNotification('已初始化 Git 仓库', 'success')
        }
      }
      setWorkDir(dir)
    },
    [showNotification]
  )

  // 加载中显示空白
  if (loading) {
    return <div className="app-layout" />
  }

  return (
    <>
      {/* 未设置工作目录时显示设置页面 */}
      {!workDir ? (
        <SetupPage onSetWorkDir={handleSetWorkDir} />
      ) : (
        <MainLayout
          workDir={workDir}
          onChangeWorkDir={handleSetWorkDir}
          showNotification={showNotification}
        />
      )}
      {/* 通知消息 */}
      {notifications.map((n) => (
        <Notification key={n.id} message={n.message} type={n.type} />
      ))}
    </>
  )
}

export default App
