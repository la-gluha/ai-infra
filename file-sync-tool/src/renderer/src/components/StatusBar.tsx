/**
 * 状态栏组件
 * 显示 Git 分支、工作目录路径等信息
 */
import React from 'react'

/** 组件属性 */
interface StatusBarProps {
  /** 工作目录路径 */
  workDir: string
  /** Git 状态信息 */
  gitStatus: GitStatus | null
}

/**
 * 状态栏组件
 * 固定显示在窗口底部
 */
function StatusBar({ workDir, gitStatus }: StatusBarProps): React.ReactElement {
  return (
    <div className="status-bar">
      {/* Git 分支信息 */}
      <div className="status-item">
        {gitStatus?.isRepo ? (
          <>
            <span>⎇</span>
            <span>{gitStatus.current || 'main'}</span>
          </>
        ) : (
          <span>未初始化 Git</span>
        )}
      </div>

      {/* 变更文件数量 */}
      {gitStatus?.isRepo && gitStatus.files && gitStatus.files.length > 0 && (
        <div className="status-item">
          <span>✱ {gitStatus.files.length} 个变更</span>
        </div>
      )}

      {/* 工作目录路径 */}
      <div className="status-item" style={{ marginLeft: 'auto' }}>
        <span>{workDir}</span>
      </div>
    </div>
  )
}

export default StatusBar
