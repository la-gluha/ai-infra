/**
 * 主界面布局组件
 * 包含顶栏、侧边栏（文件树）、编辑器区域、底部面板、状态栏
 */
import React, { useState, useEffect, useCallback } from 'react'
import FileTree from './FileTree'
import EditorArea from './EditorArea'
import BottomPanel from './BottomPanel'
import StatusBar from './StatusBar'
import CommitDialog from './CommitDialog'
import SyncConfigDialog from './SyncConfigDialog'
import ContextMenu from './ContextMenu'

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
  /** 上下文菜单状态 */
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node: FileTreeNode
  } | null>(null)

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
  }, [loadFileTree, refreshGitStatus, loadSyncMappings])

  /**
   * 打开文件
   * @param node - 文件节点
   */
  const handleOpenFile = useCallback(
    async (node: FileTreeNode) => {
      // 如果是目录则不打开
      if (node.isDirectory) return

      // 检查是否已打开
      const existing = openTabs.find((t) => t.path === node.path)
      if (existing) {
        setActiveTab(node.path)
        return
      }

      // 读取文件内容
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
   * @param path - 文件路径
   */
  const handleCloseTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => prev.filter((t) => t.path !== path))
      // 如果关闭的是当前激活的标签，切换到最后一个
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
   * 更新标签页内容（编辑器内容变化时）
   * @param path - 文件路径
   * @param content - 新内容
   */
  const handleContentChange = useCallback((path: string, content: string) => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, content, modified: true } : t))
    )
  }, [])

  /**
   * 保存当前文件
   * @param path - 文件路径
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

  /**
   * 执行 Git 提交
   * @param message - 提交消息
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

      // 执行 Git 提交
      const result = await window.api.gitCommit(workDir, message)
      if (result.success) {
        showNotification('提交成功', 'success')

        // 检查是否有远程仓库，有则自动推送
        const remotesResult = await window.api.gitRemotes(workDir)
        if (
          remotesResult.success &&
          remotesResult.remotes &&
          remotesResult.remotes.length > 0
        ) {
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

  /**
   * 处理右键菜单
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileTreeNode) => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, node })
    },
    []
  )

  /**
   * 在文件树中创建新文件
   */
  const handleCreateFile = useCallback(
    async (parentPath: string) => {
      const name = prompt('请输入文件名:')
      if (!name) return

      // 使用主进程的 path.join 拼接路径（跨平台兼容）
      const filePath = await window.api.joinPath(parentPath, name)
      const result = await window.api.createFile(filePath)
      if (result.success) {
        showNotification('文件已创建', 'success')
        loadFileTree()
      } else {
        showNotification(`创建失败: ${result.error}`, 'error')
      }
    },
    [showNotification, loadFileTree]
  )

  /**
   * 在文件树中创建新目录
   */
  const handleCreateDir = useCallback(
    async (parentPath: string) => {
      const name = prompt('请输入文件夹名:')
      if (!name) return

      // 使用主进程的 path.join 拼接路径（跨平台兼容）
      const dirPath = await window.api.joinPath(parentPath, name)
      const result = await window.api.createDir(dirPath)
      if (result.success) {
        showNotification('文件夹已创建', 'success')
        loadFileTree()
      } else {
        showNotification(`创建失败: ${result.error}`, 'error')
      }
    },
    [showNotification, loadFileTree]
  )

  /**
   * 删除文件或目录
   */
  const handleDelete = useCallback(
    async (targetPath: string, name: string) => {
      if (!confirm(`确定要删除 "${name}" 吗？`)) return

      const result = await window.api.deleteItem(targetPath)
      if (result.success) {
        showNotification('已删除', 'success')
        // 关闭已打开的相关标签
        setOpenTabs((prev) => prev.filter((t) => !t.path.startsWith(targetPath)))
        loadFileTree()
        refreshGitStatus()
      } else {
        showNotification(`删除失败: ${result.error}`, 'error')
      }
    },
    [showNotification, loadFileTree, refreshGitStatus]
  )

  /**
   * 重命名文件或目录
   */
  const handleRename = useCallback(
    async (oldPath: string, oldName: string) => {
      const newName = prompt('请输入新名称:', oldName)
      if (!newName || newName === oldName) return

      // 使用主进程获取父目录并拼接新路径
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
      // 关闭所有标签
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
      {/* 顶栏 */}
      <div className="app-header">
        <span className="title">FileSyncTool</span>
        <button className="btn-secondary btn-small" onClick={handleChangeWorkDir}>
          切换目录
        </button>
        <button className="btn-secondary btn-small" onClick={handleSync}>
          同步
        </button>
        <button className="btn-secondary btn-small" onClick={() => setShowSyncConfig(true)}>
          同步配置
        </button>
        <button className="btn-primary btn-small" onClick={() => setShowCommitDialog(true)}>
          提交
        </button>
        <button
          className="btn-secondary btn-small"
          onClick={() => setShowBottomPanel(!showBottomPanel)}
        >
          {showBottomPanel ? '隐藏面板' : '显示面板'}
        </button>
      </div>

      {/* 主体区域 */}
      <div className="app-body">
        {/* 侧边栏 - 文件树 */}
        <div className="sidebar">
          <div className="sidebar-header">
            <span>资源管理器</span>
            <div className="sidebar-actions">
              <button title="新建文件" onClick={() => handleCreateFile(workDir)}>
                +
              </button>
              <button title="新建文件夹" onClick={() => handleCreateDir(workDir)}>
                📁
              </button>
              <button title="刷新" onClick={loadFileTree}>
                ↻
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
      {showBottomPanel && (
        <BottomPanel workDir={workDir} gitStatus={gitStatus} />
      )}

      {/* 状态栏 */}
      <StatusBar workDir={workDir} gitStatus={gitStatus} />

      {/* 提交对话框 */}
      {showCommitDialog && (
        <CommitDialog
          onCommit={(msg) => {
            handleCommit(msg)
            setShowCommitDialog(false)
          }}
          onClose={() => setShowCommitDialog(false)}
        />
      )}

      {/* 同步配置对话框 */}
      {showSyncConfig && (
        <SyncConfigDialog
          mappings={syncMappings}
          workDir={workDir}
          onSave={handleSaveSyncMappings}
          onClose={() => setShowSyncConfig(false)}
        />
      )}

      {/* 上下文菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onCreateFile={(parentPath) => {
            handleCreateFile(parentPath)
            setContextMenu(null)
          }}
          onCreateDir={(parentPath) => {
            handleCreateDir(parentPath)
            setContextMenu(null)
          }}
          onDelete={(path, name) => {
            handleDelete(path, name)
            setContextMenu(null)
          }}
          onRename={(path, name) => {
            handleRename(path, name)
            setContextMenu(null)
          }}
        />
      )}
    </div>
  )
}

export default MainLayout
