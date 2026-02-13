/**
 * 通用输入对话框组件
 * 替代 Electron 中不可用的 window.prompt()
 * 提供类 VS Code 的顶部命令面板风格输入框
 */
import React, { useState, useRef, useEffect } from 'react'

/** 组件属性 */
interface InputDialogProps {
  /** 输入框占位提示文字 */
  placeholder: string
  /** 输入框默认值 */
  defaultValue?: string
  /** 确认回调，传入用户输入的值 */
  onConfirm: (value: string) => void
  /** 取消回调 */
  onCancel: () => void
}

/**
 * 输入对话框
 * 模仿 VS Code 的顶部命令面板样式，按 Enter 确认，按 Escape 取消
 */
function InputDialog({
  placeholder,
  defaultValue = '',
  onConfirm,
  onCancel
}: InputDialogProps): React.ReactElement {
  /** 输入值 */
  const [value, setValue] = useState(defaultValue)
  /** 输入框 DOM 引用 */
  const inputRef = useRef<HTMLInputElement>(null)

  // 挂载后自动聚焦并全选
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  /**
   * 键盘事件：Enter 确认，Escape 取消
   */
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      const trimmed = value.trim()
      if (trimmed) {
        onConfirm(trimmed)
      }
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="input-dialog-overlay" onClick={onCancel}>
      <div className="input-dialog" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="input-dialog-field"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

export default InputDialog
