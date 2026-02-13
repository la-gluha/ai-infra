/**
 * 提交对话框组件
 * 供用户输入提交信息并执行 Git 提交
 */
import React, { useState } from 'react'

/** 组件属性 */
interface CommitDialogProps {
  /** 提交回调，传入提交信息 */
  onCommit: (message: string) => void
  /** 关闭对话框回调 */
  onClose: () => void
}

/**
 * 提交对话框
 * 包含提交信息输入框和操作按钮
 */
function CommitDialog({ onCommit, onClose }: CommitDialogProps): React.ReactElement {
  /** 提交信息 */
  const [message, setMessage] = useState('')

  /**
   * 执行提交
   */
  const handleCommit = (): void => {
    const msg = message.trim()
    if (!msg) return
    onCommit(msg)
  }

  /**
   * 按 Enter 键快速提交
   */
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleCommit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Git 提交</h3>

        {/* 提交信息输入 */}
        <div className="form-group">
          <label>提交信息</label>
          <textarea
            className="input-field"
            style={{
              height: '80px',
              resize: 'vertical',
              padding: '8px 10px',
              lineHeight: '1.5'
            }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入提交信息... (Ctrl+Enter 快速提交)"
            autoFocus
          />
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          提交后若已配置远程仓库，将自动推送（git push）
        </p>

        {/* 操作按钮 */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-primary"
            onClick={handleCommit}
            disabled={!message.trim()}
            style={{ opacity: message.trim() ? 1 : 0.5 }}
          >
            提交
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommitDialog
