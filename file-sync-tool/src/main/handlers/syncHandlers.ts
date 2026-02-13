/**
 * 文件同步处理器模块
 * 负责将源文件/目录同步到目标文件/目录
 */
import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 同步映射配置接口
 */
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

/**
 * 递归复制目录
 * @param src - 源目录路径
 * @param dest - 目标目录路径
 */
function copyDirSync(src: string, dest: string): void {
  // 确保目标目录存在
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      // 递归复制子目录
      copyDirSync(srcPath, destPath)
    } else {
      // 复制文件
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * 执行单个同步映射
 * @param mapping - 同步映射配置
 * @returns 同步结果
 */
function executeSyncMapping(mapping: SyncMapping): { success: boolean; error?: string } {
  try {
    // 校验源路径是否存在
    if (!fs.existsSync(mapping.source)) {
      return { success: false, error: `源路径不存在: ${mapping.source}` }
    }

    const stat = fs.statSync(mapping.source)

    if (stat.isDirectory()) {
      // 目录同步：递归复制整个目录
      copyDirSync(mapping.source, mapping.target)
    } else {
      // 文件同步：确保目标目录存在后复制文件
      const targetDir = path.dirname(mapping.target)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      fs.copyFileSync(mapping.source, mapping.target)
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * 注册所有同步操作相关的 IPC 处理器
 */
export function registerSyncHandlers(): void {
  // 执行所有同步映射
  ipcMain.handle('sync:executeAll', async (_event, mappings: SyncMapping[]) => {
    const results: { id: string; success: boolean; error?: string }[] = []

    for (const mapping of mappings) {
      // 仅执行已启用的映射
      if (!mapping.enabled) continue
      const result = executeSyncMapping(mapping)
      results.push({ id: mapping.id, ...result })
    }

    return { success: true, results }
  })

  // 执行单个同步映射
  ipcMain.handle('sync:executeOne', async (_event, mapping: SyncMapping) => {
    const result = executeSyncMapping(mapping)
    return { id: mapping.id, ...result }
  })
}
