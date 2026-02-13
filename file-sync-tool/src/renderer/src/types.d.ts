/**
 * 全局类型声明文件
 * 声明 preload 脚本暴露的 API 类型
 */

/** 文件树节点 */
interface FileTreeNode {
  /** 文件/目录名称 */
  name: string
  /** 完整路径 */
  path: string
  /** 是否为目录 */
  isDirectory: boolean
  /** 子节点（仅目录有） */
  children?: FileTreeNode[]
}

/** 同步映射配置 */
interface SyncMapping {
  /** 唯一标识 */
  id: string
  /** 源路径 */
  source: string
  /** 目标路径 */
  target: string
  /** 是否启用 */
  enabled: boolean
}

/** Git 文件状态 */
interface GitFileStatus {
  path: string
  index: string
  working_dir: string
}

/** Git 状态信息 */
interface GitStatus {
  success: boolean
  isRepo?: boolean
  current?: string
  tracking?: string
  files?: GitFileStatus[]
  staged?: string[]
  modified?: string[]
  not_added?: string[]
  created?: string[]
  deleted?: string[]
  error?: string
}

/** Git 日志条目 */
interface GitLogEntry {
  hash: string
  date: string
  message: string
  author_name: string
}

/** 预加载脚本暴露的 API */
interface ElectronAPI {
  selectDirectory: () => Promise<string | null>
  getWorkDir: () => Promise<string | null>
  setWorkDir: (dir: string) => Promise<boolean>
  getSyncMappings: () => Promise<SyncMapping[]>
  setSyncMappings: (mappings: SyncMapping[]) => Promise<boolean>
  readTree: (dirPath: string) => Promise<FileTreeNode[]>
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  createFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
  createDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>
  deleteItem: (targetPath: string) => Promise<{ success: boolean; error?: string }>
  rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>
  exists: (targetPath: string) => Promise<boolean>
  stat: (targetPath: string) => Promise<unknown>
  gitInit: (workDir: string) => Promise<{ success: boolean; isNew?: boolean; error?: string }>
  gitStatus: (workDir: string) => Promise<GitStatus>
  gitAdd: (workDir: string, files: string | string[]) => Promise<{ success: boolean; error?: string }>
  gitCommit: (workDir: string, message: string) => Promise<{ success: boolean; summary?: unknown; error?: string }>
  gitPush: (workDir: string) => Promise<{ success: boolean; error?: string }>
  gitLog: (workDir: string, maxCount?: number) => Promise<{ success: boolean; logs?: GitLogEntry[]; error?: string }>
  gitRemotes: (workDir: string) => Promise<{ success: boolean; remotes?: { name: string; fetchUrl: string; pushUrl: string }[]; error?: string }>
  gitAddRemote: (workDir: string, name: string, url: string) => Promise<{ success: boolean; error?: string }>
  gitDiff: (workDir: string) => Promise<{ success: boolean; diff?: string; error?: string }>
  syncAll: (mappings: SyncMapping[]) => Promise<{ success: boolean; results?: { id: string; success: boolean; error?: string }[] }>
  syncOne: (mapping: SyncMapping) => Promise<{ id: string; success: boolean; error?: string }>
}

// 扩展 Window 接口，声明 api 属性
declare global {
  interface Window {
    api: ElectronAPI
  }
}

export {}
