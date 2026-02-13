/**
 * 主界面布局组件
 * 包含自定义标题栏、侧边栏（文件树）、编辑器区域、底部面板、状态栏
 */
import React, { useState, useEffect, useCallback } from 'react'
import FileTree from './FileTree'
import EditorArea from './EditorArea'
import BottomPanel from './BottomPanel'
import StatusBar from './StatusBar'
import CommitDialog from './CommitDialog'
import SyncConfigDialog from './SyncConfigDialog'
import ContextMenu from './ContextMenu'
import InputDialog from './InputDialog'
import ConfirmDialog from './ConfirmDialog'

/** 打开的文件标签页 */
export interface OpenTab {
  /** 文件完整路径 */
  path: string
  /** 文件名 */
  name: string
  /** 文件内容 */
  content: string
  /** 是否已修改 */
  modified: boolean
}

/** 输入对话框状态 */
interface InputDialogState {
  /** 占位提示 */
  placeholder: string
  /** 默认值 */
  defaultValue?: string
  /** 确认回调 */
  onConfirm: (value: string) => void
}

/** 确认对话框状态 */
interface ConfirmDialogState {
  /** 提示信息 */
  message: string
  /** 确认回调 */
  onConfirm: () => void
}

/** 组件属性 */
interface MainLayoutProps {
  /** 工作目录路径 */
  workDir: string
  /** 切换工作目录的回调 */
  onChangeWorkDir: (dir: string) => void
  /** 显示通知的回调 */
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void
}

/**
 * 主界面布局组件
 * 管理文件树、编辑器标签页、Git状态等核心状态
 */
function MainLayout({
  workDir,
  onChangeWorkDir,
  showNotification
}: MainLayoutProps): React.ReactElement {
  /** 文件树数据 */
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
  /** 打开的标签页列表 */
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([])
  /** 当前激活的标签页路径 */
  const [activeTab, setActiveTab] = useState<string | null>(null)
  /** Git 状态 */
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null)
  /** 是否显示提交对话框 */
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  /** 是否显示同步配置对话框 */
  const [showSyncConfig, setShowSyncConfig] = useState(false)
  /** 是否显示底部面板 */
  const [showBottomPanel, setShowBottomPanel] = useState(false)
  /** 同步映射配置列表 */
  const [syncMappings, setSyncMappings] = useState<SyncMapping[]>([])
  /** 窗口是否最大化 */
  const [isMaximized, setIsMaximized] = useState(false)
  /** 上下文菜单状态 */
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node: FileTreeNode
  } | null>(null)
  /** 输入对话框状态 */
  const [inputDialog, setInputDialog] = useState<InputDialogState | null>(null)
  /** 确认对话框状态 */
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)

  /**
   * 加载文件树
   */
  const loadFileTree = useCallback(async () => {
    try {
      const tree = await window.api.readTree(workDir)
      setFileTree(tree as FileTreeNode[])
    } catch (error) {
      console.error('加载文件树失败:', error)
    }
  }, [workDir])

  /**
   * 刷新 Git 状态
   */
  const refreshGitStatus = useCallback(async () => {
    try {
      const status = await window.api.gitStatus(workDir)
      setGitStatus(status)
    } catch (error) {
      console.error('获取 Git 状态失败:', error)
    }
  }, [workDir])

  /**
   * 加载同步映射配置
   */
  const loadSyncMappings = useCallback(async () => {
    const mappings = (await window.api.getSyncMappings()) as SyncMapping[]
    setSyncMappings(mappings)
  }, [])

  // 初始化加载
  useEffect(() => {
    loadFileTree()
    refreshGitStatus()
    loadSyncMappings()
    // 初始查询窗口是否最大化
    window.api.windowIsMaximized().then(setIsMaximized)
  }, [loadFileTree, refreshGitStatus, loadSyncMappings])

  // ==================== 窗口控制 ====================

  /** 最小化窗口 */
  const handleMinimize = useCallback(() => {
    window.api.windowMinimize()
  }, [])

  /** 最大化 / 还原窗口 */
  const handleMaximize = useCallback(async () => {
    const maximized = await window.api.windowMaximize()
    setIsMaximized(maximized)
  }, [])

  /** 关闭窗口 */
  const handleClose = useCallback(() => {
    window.api.windowClose()
  }, [])

  // ==================== 文件操作 ====================

  /**
   * 打开文件
   * @param node - 文件节点
   */
  const handleOpenFile = useCallback(
    async (node: FileTreeNode) => {
      if (node.isDirectory) return

      const existing = openTabs.find((t) => t.path === node.path)
      if (existing) {
        setActiveTab(node.path)
        return
      }

      const result = await window.api.readFile(node.path)
      if (result.success) {
        const newTab: OpenTab = {
          path: node.path,
          name: node.name,
          content: result.content || '',
          modified: false
        }
        setOpenTabs((prev) => [...prev, newTab])
        setActiveTab(node.path)
      } else {
        showNotification(`打开文件失败: ${result.error}`, 'error')
      }
    },
    [openTabs, showNotification]
  )

  /**
   * 关闭标签页
   */
  const handleCloseTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => prev.filter((t) => t.path !== path))
      if (activeTab === path) {
        setActiveTab((prev) => {
          const remaining = openTabs.filter((t) => t.path !== path)
          return remaining.length > 0 ? remaining[remaining.length - 1].path : null
        })
      }
    },
    [activeTab, openTabs]
  )

  /**
   * 编辑器内容变更
   */
  const handleContentChange = useCallback((path: string, content: string) => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, content, modified: true } : t))
    )
  }, [])

  /**
   * 保存当前文件
   */
  const handleSaveFile = useCallback(
    async (path: string) => {
      const tab = openTabs.find((t) => t.path === path)
      if (!tab) return

      const result = await window.api.writeFile(path, tab.content)
      if (result.success) {
        setOpenTabs((prev) => prev.map((t) => (t.path === path ? { ...t, modified: false } : t)))
        showNotification('文件已保存', 'success')
        refreshGitStatus()
      } else {
        showNotification(`保存失败: ${result.error}`, 'error')
      }
    },
    [openTabs, showNotification, refreshGitStatus]
  )

  // ==================== Git 操作 ====================

  /**
   * 执行 Git 提交
   */
  const handleCommit = useCallback(
    async (message: string) => {
      // 先保存所有已修改的文件
      for (const tab of openTabs) {
        if (tab.modified) {
          await window.api.writeFile(tab.path, tab.content)
        }
      }
      setOpenTabs((prev) => prev.map((t) => ({ ...t, modified: false })))

      const result = await window.api.gitCommit(workDir, message)
      if (result.success) {
        showNotification('提交成功', 'success')

        // 检查远程仓库，有则自动推送
        const remotesResult = await window.api.gitRemotes(workDir)
        if (remotesResult.success && remotesResult.remotes && remotesResult.remotes.length > 0) {
          const pushResult = await window.api.gitPush(workDir)
          if (pushResult.success) {
            showNotification('已推送到远程仓库', 'success')
          } else {
            showNotification(`推送失败: ${pushResult.error}`, 'error')
          }
        }
        refreshGitStatus()
      } else {
        showNotification(`提交失败: ${result.error}`, 'error')
      }
    },
    [workDir, openTabs, showNotification, refreshGitStatus]
  )

  // ==================== 同步操作 ====================

  /**
   * 执行文件同步
   */
  const handleSync = useCallback(async () => {
    if (syncMappings.length === 0) {
      showNotification('未配置同步映射', 'info')
      return
    }
    const result = await window.api.syncAll(syncMappings)
    if (result.success && result.results) {
      const failed = result.results.filter((r) => !r.success)
      if (failed.length === 0) {
        showNotification('同步完成', 'success')
      } else {
        showNotification(`同步部分失败: ${failed.length} 项`, 'error')
      }
    } else {
      showNotification('同步执行失败', 'error')
    }
  }, [syncMappings, showNotification])

  // ==================== 文件树操作（使用自定义对话框） ====================

  /**
   * 右键菜单
   */
  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileTreeNode) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }, [])

  /**
   * 新建文件（通过自定义输入对话框）
   */
  const handleCreateFile = useCallback(
    (parentPath: string) => {
      setInputDialog({
        placeholder: '输入文件名',
        onConfirm: async (name: string) => {
          setInputDialog(null)
          const filePath = await window.api.joinPath(parentPath, name)
          const result = await window.api.createFile(filePath)
          if (result.success) {
            showNotification('文件已创建', 'success')
            loadFileTree()
          } else {
            showNotification(`创建失败: ${result.error}`, 'error')
          }
        }
      })
    },
    [showNotification, loadFileTree]
  )

  /**
   * 新建目录（通过自定义输入对话框）
   */
  const handleCreateDir = useCallback(
    (parentPath: string) => {
      setInputDialog({
        placeholder: '输入文件夹名',
        onConfirm: async (name: string) => {
          setInputDialog(null)
          const dirPath = await window.api.joinPath(parentPath, name)
          const result = await window.api.createDir(dirPath)
          if (result.success) {
            showNotification('文件夹已创建', 'success')
            loadFileTree()
          } else {
            showNotification(`创建失败: ${result.error}`, 'error')
          }
        }
      })
    },
    [showNotification, loadFileTree]
  )

  /**
   * 删除文件或目录（通过自定义确认对话框）
   */
  const handleDelete = useCallback(
    (targetPath: string, name: string) => {
      setConfirmDialog({
        message: `确定要删除 "${name}" 吗？此操作不可撤回。`,
        onConfirm: async () => {
          setConfirmDialog(null)
          const result = await window.api.deleteItem(targetPath)
          if (result.success) {
            showNotification('已删除', 'success')
            setOpenTabs((prev) => prev.filter((t) => !t.path.startsWith(targetPath)))
            loadFileTree()
            refreshGitStatus()
          } else {
            showNotification(`删除失败: ${result.error}`, 'error')
          }
        }
      })
    },
    [showNotification, loadFileTree, refreshGitStatus]
  )

  /**
   * 重命名文件或目录（通过自定义输入对话框）
   */
  const handleRename = useCallback(
    (oldPath: string, oldName: string) => {
      setInputDialog({
        placeholder: '输入新名称',
        defaultValue: oldName,
        onConfirm: async (newName: string) => {
          setInputDialog(null)
          if (newName === oldName) return
          const parentDirPath = await window.api.parentDir(oldPath)
          const newPath = await window.api.joinPath(parentDirPath, newName)
          const result = await window.api.rename(oldPath, newPath)
          if (result.success) {
            showNotification('重命名成功', 'success')
            loadFileTree()
            refreshGitStatus()
          } else {
            showNotification(`重命名失败: ${result.error}`, 'error')
          }
        }
      })
    },
    [showNotification, loadFileTree, refreshGitStatus]
  )

  /**
   * 保存同步映射配置
   */
  const handleSaveSyncMappings = useCallback(
    async (mappings: SyncMapping[]) => {
      setSyncMappings(mappings)
      await window.api.setSyncMappings(mappings)
      showNotification('同步配置已保存', 'success')
    },
    [showNotification]
  )

  /**
   * 更换工作目录
   */
  const handleChangeWorkDir = useCallback(async () => {
    const dir = await window.api.selectDirectory()
    if (dir) {
      setOpenTabs([])
      setActiveTab(null)
      onChangeWorkDir(dir)
    }
  }, [onChangeWorkDir])

  // 点击空白处关闭右键菜单
  useEffect(() => {
    const handleClick = (): void => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  return (
    <div className="app-layout">
      {/* ==================== 自定义标题栏 ==================== */}
      <div className="titlebar">
        {/* 左侧：应用名 */}
        <div className="titlebar-title">FileSyncTool</div>

        {/* 中间：操作按钮区 */}
        <div className="titlebar-actions">
          <button className="titlebar-btn" onClick={handleChangeWorkDir}>切换目录</button>
          <button className="titlebar-btn" onClick={handleSync}>同步</button>
          <button className="titlebar-btn" onClick={() => setShowSyncConfig(true)}>同步配置</button>
          <button className="titlebar-btn accent" onClick={() => setShowCommitDialog(true)}>提交</button>
          <button className="titlebar-btn" onClick={() => setShowBottomPanel(!showBottomPanel)}>
            {showBottomPanel ? '隐藏面板' : '显示面板'}
          </button>
        </div>

        {/* 右侧：窗口控制按钮 */}
        <div className="titlebar-controls">
          <button className="titlebar-control" onClick={handleMinimize} title="最小化">
            <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
          </button>
          <button className="titlebar-control" onClick={handleMaximize} title={isMaximized ? '还原' : '最大化'}>
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 0v2H0v8h8V8h2V0H2zm6 8H1V3h7v5zM9 7V1H3v1h5v5h1z" fill="currentColor"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none"/></svg>
            )}
          </button>
          <button className="titlebar-control close" onClick={handleClose} title="关闭">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 0L0 1l4 4-4 4 1 1 4-4 4 4 1-1-4-4 4-4-1-1-4 4z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>

      {/* ==================== 主体区域 ==================== */}
      <div className="app-body">
        {/* 侧边栏 - 文件树 */}
        <div className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-label">资源管理器</span>
            <div className="sidebar-actions">
              <button title="新建文件" onClick={() => handleCreateFile(workDir)}>
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M9.5 1.1l3.4 3.4.1.6V14c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V2c0-.6.4-1 1-1h5.1l.4.1zM9 2H4v12h8V6H9V2zm4 4l-3-3v3h3z" fill="currentColor"/><path d="M8 7v2H6v1h2v2h1v-2h2V9H9V7H8z" fill="currentColor"/></svg>
              </button>
              <button title="新建文件夹" onClick={() => handleCreateDir(workDir)}>
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M14 4H9.618l-1-2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1zm0 9H2V3h6.382l1 2H14v8z" fill="currentColor"/><path d="M8 7v2H6v1h2v2h1v-2h2V9H9V7H8z" fill="currentColor"/></svg>
              </button>
              <button title="刷新" onClick={loadFileTree}>
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.146-1.545 1.146-.277 0-.588-.132-.924-.394-.475-.37-.755-.856-.842-1.446l-.002-.07h1.585l-2-3.5-2 3.5h1.403c.073.983.479 1.822 1.21 2.396.473.37.994.556 1.555.571l.122.001c.542 0 1.03-.19 1.46-.566.41-.358.7-.658.874-.91l.826-.695zm-3.903 4.782c-.41.358-.7.658-.874.91l-.826.695.578.939 1.068-.812.076-.094c.335-.415.927-1.146 1.545-1.146.278 0 .589.132.924.394.475.37.756.856.842 1.446l.002.07H11.3l2 3.5 2-3.5h-1.403c-.073-.983-.479-1.822-1.21-2.396-.473-.37-.993-.556-1.555-.571l-.122-.001c-.542 0-1.03.19-1.46.566z" fill="currentColor"/></svg>
              </button>
            </div>
          </div>
          <div className="sidebar-content">
            <FileTree
              nodes={fileTree}
              activeFile={activeTab}
              onOpenFile={handleOpenFile}
              onContextMenu={handleContextMenu}
            />
          </div>
        </div>

        {/* 编辑器区域 */}
        <EditorArea
          tabs={openTabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onCloseTab={handleCloseTab}
          onContentChange={handleContentChange}
          onSaveFile={handleSaveFile}
        />
      </div>

      {/* 底部面板 */}
      {showBottomPanel && <BottomPanel workDir={workDir} gitStatus={gitStatus} />}

      {/* 状态栏 */}
      <StatusBar workDir={workDir} gitStatus={gitStatus} />

      {/* ==================== 对话框层 ==================== */}

      {showCommitDialog && (
        <CommitDialog
          onCommit={(msg) => {
            handleCommit(msg)
            setShowCommitDialog(false)
          }}
          onClose={() => setShowCommitDialog(false)}
        />
      )}

      {showSyncConfig && (
        <SyncConfigDialog
          mappings={syncMappings}
          workDir={workDir}
          onSave={handleSaveSyncMappings}
          onClose={() => setShowSyncConfig(false)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onCreateFile={(p) => { handleCreateFile(p); setContextMenu(null) }}
          onCreateDir={(p) => { handleCreateDir(p); setContextMenu(null) }}
          onDelete={(p, n) => { handleDelete(p, n); setContextMenu(null) }}
          onRename={(p, n) => { handleRename(p, n); setContextMenu(null) }}
        />
      )}

      {/* 自定义输入对话框（替代 window.prompt） */}
      {inputDialog && (
        <InputDialog
          placeholder={inputDialog.placeholder}
          defaultValue={inputDialog.defaultValue}
          onConfirm={inputDialog.onConfirm}
          onCancel={() => setInputDialog(null)}
        />
      )}

      {/* 自定义确认对话框（替代 window.confirm） */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}

export default MainLayout
