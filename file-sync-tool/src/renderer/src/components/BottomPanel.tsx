/**
 * 底部面板组件
 * 显示 Git 状态信息和提交日志
 */
import React, { useState, useEffect, useCallback } from 'react'

/** 组件属性 */
interface BottomPanelProps {
  /** 工作目录路径 */
  workDir: string
  /** Git 状态 */
  gitStatus: GitStatus | null
}

/**
 * 底部面板组件
 * 包含"变更文件"和"提交日志"两个标签
 */
function BottomPanel({ workDir, gitStatus }: BottomPanelProps): React.ReactElement {
  /** 当前激活的标签页 */
  const [activeTab, setActiveTab] = useState<'changes' | 'log'>('changes')
  /** 提交日志列表 */
  const [logs, setLogs] = useState<GitLogEntry[]>([])

  /**
   * 加载提交日志
   */
  const loadLogs = useCallback(async () => {
    const result = await window.api.gitLog(workDir, 30)
    if (result.success && result.logs) {
      setLogs(result.logs)
    }
  }, [workDir])

  // 切换到日志标签时加载数据
  useEffect(() => {
    if (activeTab === 'log') {
      loadLogs()
    }
  }, [activeTab, loadLogs])

  /**
   * 获取文件状态标签颜色
   * @param workingDir - 工作区状态标记
   * @returns CSS 颜色值
   */
  const getStatusColor = (workingDir: string): string => {
    switch (workingDir) {
      case 'M':
        return '#dcdcaa' // 修改 - 黄色
      case '?':
        return '#4ec9b0' // 未跟踪 - 绿色
      case 'D':
        return '#f44747' // 删除 - 红色
      case 'A':
        return '#4ec9b0' // 新增 - 绿色
      default:
        return '#cccccc'
    }
  }

  return (
    <div className="bottom-panel">
      {/* 面板标签栏 */}
      <div className="bottom-panel-header">
        <button
          className={`bottom-panel-tab ${activeTab === 'changes' ? 'active' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          变更文件 ({gitStatus?.files?.length || 0})
        </button>
        <button
          className={`bottom-panel-tab ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          提交日志
        </button>
      </div>

      {/* 面板内容 */}
      <div className="bottom-panel-content">
        {activeTab === 'changes' ? (
          // 变更文件列表
          gitStatus?.files && gitStatus.files.length > 0 ? (
            gitStatus.files.map((file) => (
              <div
                key={file.path}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '2px 0'
                }}
              >
                <span>{file.path}</span>
                <span style={{ color: getStatusColor(file.working_dir) }}>
                  {file.working_dir === '?' ? 'U' : file.working_dir}
                </span>
              </div>
            ))
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>没有变更文件</span>
          )
        ) : // 提交日志列表
        logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log.hash}
              style={{
                padding: '4px 0',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--accent-color)' }}>{log.hash.substring(0, 7)}</span>
                <span>{log.message}</span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginTop: '2px'
                }}
              >
                {log.author_name} · {new Date(log.date).toLocaleString('zh-CN')}
              </div>
            </div>
          ))
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>暂无提交记录</span>
        )}
      </div>
    </div>
  )
}

export default BottomPanel
