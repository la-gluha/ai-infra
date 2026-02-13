/**
 * 首次启动设置页面组件
 * 引导用户选择工作目录
 */
import React, { useState } from 'react'

/** 组件属性 */
interface SetupPageProps {
  /** 设置工作目录的回调 */
  onSetWorkDir: (dir: string) => void
}

/**
 * 设置页面组件
 * 显示欢迎信息和目录选择器
 */
function SetupPage({ onSetWorkDir }: SetupPageProps): React.ReactElement {
  /** 当前选择的目录路径 */
  const [selectedDir, setSelectedDir] = useState('')

  /**
   * 点击浏览按钮，打开系统目录选择对话框
   */
  const handleBrowse = async (): Promise<void> => {
    const dir = await window.api.selectDirectory()
    if (dir) {
      setSelectedDir(dir)
    }
  }

  /**
   * 确认选择目录并进入主界面
   */
  const handleConfirm = (): void => {
    if (selectedDir) {
      onSetWorkDir(selectedDir)
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <h1>欢迎使用 FileSyncTool</h1>
        <p>
          本地文件同步工具，内置 Git 版本管理。
          <br />
          请选择一个工作目录开始使用。
        </p>

        {/* 目录选择器 */}
        <div className="dir-selector">
          <input
            type="text"
            value={selectedDir}
            onChange={(e) => setSelectedDir(e.target.value)}
            placeholder="请选择工作目录..."
            readOnly
          />
          <button className="btn-primary" onClick={handleBrowse}>
            浏览
          </button>
        </div>

        {/* 确认按钮 */}
        <button
          className="btn-primary"
          onClick={handleConfirm}
          disabled={!selectedDir}
          style={{ width: '100%', opacity: selectedDir ? 1 : 0.5 }}
        >
          开始使用
        </button>
      </div>
    </div>
  )
}

export default SetupPage
