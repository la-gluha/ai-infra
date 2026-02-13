/**
 * 同步配置对话框组件
 * 可视化管理文件/文件夹的同步关联配置
 */
import React, { useState, useCallback } from 'react'

/** 组件属性 */
interface SyncConfigDialogProps {
  /** 当前同步映射列表 */
  mappings: SyncMapping[]
  /** 工作目录路径 */
  workDir: string
  /** 保存配置回调 */
  onSave: (mappings: SyncMapping[]) => void
  /** 关闭对话框回调 */
  onClose: () => void
}

/**
 * 路径选择器子组件
 * 提供输入框 + 选择文件 + 选择文件夹三个操作
 */
function PathPicker({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}): React.ReactElement {
  /**
   * 选择文件
   */
  const handleSelectFile = useCallback(async () => {
    const file = await window.api.selectFile()
    if (file) onChange(file)
  }, [onChange])

  /**
   * 选择文件夹
   */
  const handleSelectDir = useCallback(async () => {
    const dir = await window.api.selectDirectory()
    if (dir) onChange(dir)
  }, [onChange])

  return (
    <div className="sync-field">
      <label className="sync-field-label">{label}</label>
      <div className="sync-field-row">
        <input
          className="sync-field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button className="sync-pick-btn" onClick={handleSelectFile} title="选择文件">
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path d="M9.5 1.1l3.4 3.4.1.6V14c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V2c0-.6.4-1 1-1h5.1l.4.1zM9 2H4v12h8V6H9V2z" fill="currentColor" opacity="0.85"/>
          </svg>
          <span>文件</span>
        </button>
        <button className="sync-pick-btn" onClick={handleSelectDir} title="选择文件夹">
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path d="M14 4H9.618l-1-2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1z" fill="currentColor"/>
          </svg>
          <span>文件夹</span>
        </button>
      </div>
    </div>
  )
}

/**
 * 同步配置对话框
 * 支持添加、删除同步映射，切换启用状态
 */
function SyncConfigDialog({
  mappings,
  workDir,
  onSave,
  onClose
}: SyncConfigDialogProps): React.ReactElement {
  /** 本地编辑的映射列表 */
  const [localMappings, setLocalMappings] = useState<SyncMapping[]>([...mappings])
  /** 是否正在添加新映射 */
  const [adding, setAdding] = useState(false)
  /** 新映射的源路径 */
  const [newSource, setNewSource] = useState('')
  /** 新映射的目标路径 */
  const [newTarget, setNewTarget] = useState('')

  /**
   * 添加新的同步映射
   */
  const handleAdd = useCallback(() => {
    if (!newSource.trim() || !newTarget.trim()) return
    const newMapping: SyncMapping = {
      id: Date.now().toString(),
      source: newSource.trim(),
      target: newTarget.trim(),
      enabled: true
    }
    setLocalMappings((prev) => [...prev, newMapping])
    setNewSource('')
    setNewTarget('')
    setAdding(false)
  }, [newSource, newTarget])

  /**
   * 删除映射
   */
  const handleRemove = useCallback((id: string) => {
    setLocalMappings((prev) => prev.filter((m) => m.id !== id))
  }, [])

  /**
   * 切换映射启用/禁用
   */
  const handleToggle = useCallback((id: string) => {
    setLocalMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    )
  }, [])

  /**
   * 保存配置
   */
  const handleSave = useCallback(() => {
    onSave(localMappings)
    onClose()
  }, [localMappings, onSave, onClose])

  /** 新增表单是否可提交 */
  const canAdd = newSource.trim() && newTarget.trim()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sync-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 标题区 */}
        <div className="sync-dialog-header">
          <h3>同步关联配置</h3>
          <button className="sync-close-btn" onClick={onClose} title="关闭">
            <svg width="12" height="12" viewBox="0 0 10 10">
              <path d="M1 0L0 1l4 4-4 4 1 1 4-4 4 4 1-1-4-4 4-4-1-1-4 4z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* 说明 */}
        <p className="sync-dialog-desc">
          配置文件或文件夹的同步关联，源路径的内容将同步到目标路径。
          <br />
          <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
            工作目录: {workDir}
          </span>
        </p>

        {/* 映射列表 */}
        <div className="sync-list">
          {localMappings.length === 0 && !adding && (
            <div className="sync-empty">暂无同步配置，点击下方按钮添加</div>
          )}

          {localMappings.map((mapping) => (
            <div key={mapping.id} className={`sync-item ${mapping.enabled ? '' : 'disabled'}`}>
              {/* 左侧：开关 */}
              <div
                className={`toggle-switch ${mapping.enabled ? 'active' : ''}`}
                onClick={() => handleToggle(mapping.id)}
              >
                <div className="toggle-knob" />
              </div>

              {/* 中间：路径信息 */}
              <div className="sync-item-paths">
                <div className="sync-item-row">
                  <span className="sync-item-tag source">源</span>
                  <span className="sync-item-path">{mapping.source}</span>
                </div>
                <div className="sync-item-row">
                  <span className="sync-item-tag target">→</span>
                  <span className="sync-item-path">{mapping.target}</span>
                </div>
              </div>

              {/* 右侧：删除 */}
              <button
                className="sync-item-delete"
                onClick={() => handleRemove(mapping.id)}
                title="删除"
              >
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <path d="M8 8.707l3.646 3.647.708-.708L8.707 8l3.647-3.646-.708-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* 新增映射表单 */}
        {adding && (
          <div className="sync-add-form">
            <PathPicker
              label="源路径"
              value={newSource}
              onChange={setNewSource}
              placeholder="选择要同步的文件或文件夹..."
            />
            <PathPicker
              label="目标路径"
              value={newTarget}
              onChange={setNewTarget}
              placeholder="选择同步到的目标位置..."
            />
            <div className="sync-add-actions">
              <button className="btn-secondary btn-small" onClick={() => { setAdding(false); setNewSource(''); setNewTarget('') }}>
                取消
              </button>
              <button
                className="btn-primary btn-small"
                onClick={handleAdd}
                disabled={!canAdd}
                style={{ opacity: canAdd ? 1 : 0.4 }}
              >
                确认添加
              </button>
            </div>
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="sync-dialog-footer">
          {!adding && (
            <button className="sync-add-btn" onClick={() => setAdding(true)}>
              <svg width="14" height="14" viewBox="0 0 16 16">
                <path d="M8 3v4H4v1h4v4h1V8h4V7H9V3H8z" fill="currentColor"/>
              </svg>
              添加映射
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn-secondary btn-small" onClick={onClose}>取消</button>
          <button className="btn-primary btn-small" onClick={handleSave}>保存配置</button>
        </div>
      </div>
    </div>
  )
}

export default SyncConfigDialog
