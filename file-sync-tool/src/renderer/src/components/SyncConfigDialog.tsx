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
 * 同步配置对话框
 * 支持添加、编辑、删除同步映射以及切换启用状态
 */
function SyncConfigDialog({
  mappings,
  workDir,
  onSave,
  onClose
}: SyncConfigDialogProps): React.ReactElement {
  /** 本地编辑的映射列表（保存前不影响外部状态） */
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
   * @param id - 映射唯一标识
   */
  const handleRemove = useCallback((id: string) => {
    setLocalMappings((prev) => prev.filter((m) => m.id !== id))
  }, [])

  /**
   * 切换映射的启用/禁用状态
   * @param id - 映射唯一标识
   */
  const handleToggle = useCallback((id: string) => {
    setLocalMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    )
  }, [])

  /**
   * 使用系统对话框选择源路径
   */
  const handleSelectSource = useCallback(async () => {
    const dir = await window.api.selectDirectory()
    if (dir) setNewSource(dir)
  }, [])

  /**
   * 使用系统对话框选择目标路径
   */
  const handleSelectTarget = useCallback(async () => {
    const dir = await window.api.selectDirectory()
    if (dir) setNewTarget(dir)
  }, [])

  /**
   * 保存配置
   */
  const handleSave = useCallback(() => {
    onSave(localMappings)
    onClose()
  }, [localMappings, onSave, onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ minWidth: '600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>同步关联配置</h3>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '16px'
          }}
        >
          配置文件或文件夹的同步关联。源路径的内容将同步到目标路径。
          <br />
          工作目录: {workDir}
        </p>

        {/* 现有映射列表 */}
        <div style={{ marginBottom: '16px' }}>
          {localMappings.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                background: 'var(--bg-primary)',
                borderRadius: '4px',
                border: '1px dashed var(--border-color)'
              }}
            >
              暂无同步配置，点击下方按钮添加
            </div>
          ) : (
            localMappings.map((mapping) => (
              <div key={mapping.id} className="sync-mapping-item">
                {/* 启用/禁用开关 */}
                <div
                  className={`toggle-switch ${mapping.enabled ? 'active' : ''}`}
                  onClick={() => handleToggle(mapping.id)}
                >
                  <div className="toggle-knob" />
                </div>

                {/* 路径显示 */}
                <div className="paths">
                  <div className="path-row">
                    <span className="path-label">源:</span>
                    <span className="path-value">{mapping.source}</span>
                  </div>
                  <div className="path-row">
                    <span className="path-label">→</span>
                    <span className="path-value">{mapping.target}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="actions">
                  <button
                    className="btn-danger btn-small"
                    onClick={() => handleRemove(mapping.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 添加新映射 */}
        {adding ? (
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px'
            }}
          >
            <div className="form-group">
              <label>源路径（要同步的文件或文件夹）</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="input-field"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="输入或选择源路径..."
                />
                <button className="btn-secondary btn-small" onClick={handleSelectSource}>
                  浏览
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>目标路径（同步到的位置）</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="input-field"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="输入或选择目标路径..."
                />
                <button className="btn-secondary btn-small" onClick={handleSelectTarget}>
                  浏览
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary btn-small" onClick={() => setAdding(false)}>
                取消
              </button>
              <button
                className="btn-primary btn-small"
                onClick={handleAdd}
                disabled={!newSource.trim() || !newTarget.trim()}
                style={{ opacity: newSource.trim() && newTarget.trim() ? 1 : 0.5 }}
              >
                添加
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-secondary" onClick={() => setAdding(true)}>
            + 添加同步映射
          </button>
        )}

        {/* 底部操作按钮 */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSave}>
            保存配置
          </button>
        </div>
      </div>
    </div>
  )
}

export default SyncConfigDialog
