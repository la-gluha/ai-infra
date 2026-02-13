/**
 * 确认对话框组件
 * 替代 Electron 中不可用的 window.confirm()
 */
import React, { useEffect, useRef } from 'react'

/** 组件属性 */
interface ConfirmDialogProps {
  /** 确认提示信息 */
  message: string
  /** 确认回调 */
  onConfirm: () => void
  /** 取消回调 */
  onCancel: () => void
}

/**
 * 确认对话框
 * 居中显示确认提示，支持 Enter 确认和 Escape 取消
 */
function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps): React.ReactElement {
  /** 确认按钮 DOM 引用，用于自动聚焦 */
  const confirmRef = useRef<HTMLButtonElement>(null)

  // 挂载后聚焦确认按钮
  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  /**
   * 键盘事件：Enter 确认，Escape 取消
   */
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="modal-overlay" onClick={onCancel} onKeyDown={handleKeyDown}>
      <div className="modal-content" style={{ minWidth: '360px', maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '20px' }}>
          {message}
        </p>
        <div className="modal-actions">
          <button className="btn-secondary btn-small" onClick={onCancel}>取消</button>
          <button ref={confirmRef} className="btn-danger btn-small" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
