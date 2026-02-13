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
 * 递归复制目录内容
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
      // 复制文件（覆盖已有）
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * 执行单个同步映射
 * 处理四种组合：文件→文件、文件→目录、目录→目录、目录→不存在路径
 * @param mapping - 同步映射配置
 * @returns 同步结果，包含复制的文件数量
 */
function executeSyncMapping(mapping: SyncMapping): { success: boolean; error?: string; detail?: string } {
  try {
    const sourcePath = path.resolve(mapping.source)
    const targetPath = path.resolve(mapping.target)

    // 校验源路径是否存在
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: `源路径不存在: ${sourcePath}` }
    }

    const sourceStat = fs.statSync(sourcePath)

    if (sourceStat.isDirectory()) {
      // 源是目录 → 将目录内容递归复制到目标目录
      copyDirSync(sourcePath, targetPath)
      return { success: true, detail: `目录已同步: ${sourcePath} → ${targetPath}` }
    } else {
      // 源是文件
      let finalTarget = targetPath

      // 如果目标路径已经是一个存在的目录，则将文件复制到该目录内（保留原文件名）
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
        finalTarget = path.join(targetPath, path.basename(sourcePath))
      } else {
        // 目标路径不存在或是一个文件 → 确保父目录存在
        const targetDir = path.dirname(finalTarget)
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
        }
      }

      // 读取源文件内容并写入目标（确保完整覆盖）
      const content = fs.readFileSync(sourcePath)
      fs.writeFileSync(finalTarget, content)
      return { success: true, detail: `文件已同步: ${sourcePath} → ${finalTarget}` }
    }
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
    const results: { id: string; success: boolean; error?: string; detail?: string }[] = []

    for (const mapping of mappings) {
      // 仅执行已启用的映射
      if (!mapping.enabled) continue
      const result = executeSyncMapping(mapping)
      results.push({ id: mapping.id, ...result })
    }

    // 计算总体结果
    const executed = results.length
    const failed = results.filter((r) => !r.success).length
    return { success: true, results, executed, failed }
  })

  // 执行单个同步映射
  ipcMain.handle('sync:executeOne', async (_event, mapping: SyncMapping) => {
    const result = executeSyncMapping(mapping)
    return { id: mapping.id, ...result }
  })
}
