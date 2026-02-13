/**
 * 预加载脚本
 * 通过 contextBridge 安全地向渲染进程暴露主进程 API
 */
import { contextBridge, ipcRenderer } from 'electron'

/**
 * 暴露给渲染进程的 API 接口
 * 所有主进程操作都通过这些接口进行
 */
const api = {
  // ==================== 对话框 API ====================

  /** 打开目录选择对话框 */
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectDirectory'),

  // ==================== 存储 API ====================

  /** 获取工作目录路径 */
  getWorkDir: (): Promise<string | null> => ipcRenderer.invoke('store:getWorkDir'),

  /** 设置工作目录路径 */
  setWorkDir: (dir: string): Promise<boolean> => ipcRenderer.invoke('store:setWorkDir', dir),

  /** 获取同步映射配置列表 */
  getSyncMappings: (): Promise<unknown[]> => ipcRenderer.invoke('store:getSyncMappings'),

  /** 保存同步映射配置列表 */
  setSyncMappings: (mappings: unknown[]): Promise<boolean> =>
    ipcRenderer.invoke('store:setSyncMappings', mappings),

  // ==================== 文件系统 API ====================

  /** 读取目录树结构 */
  readTree: (dirPath: string): Promise<unknown[]> => ipcRenderer.invoke('fs:readTree', dirPath),

  /** 读取文件内容 */
  readFile: (filePath: string): Promise<{ success: boolean; content?: string; error?: string }> =>
    ipcRenderer.invoke('fs:readFile', filePath),

  /** 写入文件内容 */
  writeFile: (
    filePath: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),

  /** 创建新文件 */
  createFile: (filePath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('fs:createFile', filePath),

  /** 创建新目录 */
  createDir: (dirPath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('fs:createDir', dirPath),

  /** 删除文件或目录 */
  deleteItem: (targetPath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('fs:delete', targetPath),

  /** 重命名文件或目录 */
  rename: (
    oldPath: string,
    newPath: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('fs:rename', oldPath, newPath),

  /** 检查路径是否存在 */
  exists: (targetPath: string): Promise<boolean> => ipcRenderer.invoke('fs:exists', targetPath),

  /** 获取文件/目录信息 */
  stat: (targetPath: string): Promise<unknown> => ipcRenderer.invoke('fs:stat', targetPath),

  /** 拼接路径（跨平台兼容） */
  joinPath: (...segments: string[]): Promise<string> =>
    ipcRenderer.invoke('fs:joinPath', ...segments),

  /** 获取父目录路径 */
  parentDir: (targetPath: string): Promise<string> =>
    ipcRenderer.invoke('fs:parentDir', targetPath),

  // ==================== Git API ====================

  /** 初始化 Git 仓库 */
  gitInit: (workDir: string): Promise<{ success: boolean; isNew?: boolean; error?: string }> =>
    ipcRenderer.invoke('git:init', workDir),

  /** 获取 Git 状态 */
  gitStatus: (workDir: string): Promise<unknown> => ipcRenderer.invoke('git:status', workDir),

  /** 添加文件到暂存区 */
  gitAdd: (
    workDir: string,
    files: string | string[]
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('git:add', workDir, files),

  /** 提交更改 */
  gitCommit: (
    workDir: string,
    message: string
  ): Promise<{ success: boolean; summary?: unknown; error?: string }> =>
    ipcRenderer.invoke('git:commit', workDir, message),

  /** 推送到远程仓库 */
  gitPush: (workDir: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('git:push', workDir),

  /** 获取提交日志 */
  gitLog: (
    workDir: string,
    maxCount?: number
  ): Promise<{ success: boolean; logs?: unknown[]; error?: string }> =>
    ipcRenderer.invoke('git:log', workDir, maxCount),

  /** 获取远程仓库列表 */
  gitRemotes: (workDir: string): Promise<unknown> => ipcRenderer.invoke('git:remotes', workDir),

  /** 添加远程仓库 */
  gitAddRemote: (
    workDir: string,
    name: string,
    url: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('git:addRemote', workDir, name, url),

  /** 获取文件差异 */
  gitDiff: (workDir: string): Promise<{ success: boolean; diff?: string; error?: string }> =>
    ipcRenderer.invoke('git:diff', workDir),

  // ==================== 同步 API ====================

  /** 执行所有同步映射 */
  syncAll: (mappings: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke('sync:executeAll', mappings),

  /** 执行单个同步映射 */
  syncOne: (mapping: unknown): Promise<unknown> => ipcRenderer.invoke('sync:executeOne', mapping)
}

// 将 API 暴露到渲染进程的 window.api 对象上
contextBridge.exposeInMainWorld('api', api)
