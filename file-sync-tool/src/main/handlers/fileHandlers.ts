/**
 * 文件操作处理器模块
 * 提供文件/目录的读写、创建、删除、重命名等操作
 */
import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 文件树节点接口
 */
interface FileTreeNode {
  /** 文件/目录名称 */
  name: string
  /** 完整路径 */
  path: string
  /** 是否为目录 */
  isDirectory: boolean
  /** 子节点列表（仅目录有） */
  children?: FileTreeNode[]
}

/**
 * 递归读取目录树
 * @param dirPath - 目录路径
 * @param depth - 递归深度限制，默认3层
 * @returns 文件树节点数组
 */
function readDirectoryTree(dirPath: string, depth: number = 3): FileTreeNode[] {
  // 深度为0时停止递归
  if (depth <= 0) return []

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const nodes: FileTreeNode[] = []

    for (const entry of entries) {
      // 跳过隐藏文件和 node_modules
      if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue
      if (entry.name === 'node_modules') continue

      const fullPath = path.join(dirPath, entry.name)
      const node: FileTreeNode = {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory()
      }

      // 如果是目录则递归读取子节点
      if (entry.isDirectory()) {
        node.children = readDirectoryTree(fullPath, depth - 1)
      }

      nodes.push(node)
    }

    // 目录优先排序，同类型按名称排序
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    return nodes
  } catch (error) {
    console.error('读取目录树失败:', error)
    return []
  }
}

/**
 * 注册所有文件操作相关的 IPC 处理器
 */
export function registerFileHandlers(): void {
  // 读取目录树结构
  ipcMain.handle('fs:readTree', (_event, dirPath: string) => {
    return readDirectoryTree(dirPath, 10)
  })

  // 读取文件内容
  ipcMain.handle('fs:readFile', (_event, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return { success: true, content }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 写入文件内容
  ipcMain.handle('fs:writeFile', (_event, filePath: string, content: string) => {
    try {
      // 确保父目录存在
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 创建新文件
  ipcMain.handle('fs:createFile', (_event, filePath: string) => {
    try {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      // 文件不存在时才创建
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf-8')
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 创建新目录
  ipcMain.handle('fs:createDir', (_event, dirPath: string) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 删除文件或目录
  ipcMain.handle('fs:delete', (_event, targetPath: string) => {
    try {
      const stat = fs.statSync(targetPath)
      if (stat.isDirectory()) {
        // 递归删除目录
        fs.rmSync(targetPath, { recursive: true, force: true })
      } else {
        fs.unlinkSync(targetPath)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 重命名文件或目录
  ipcMain.handle('fs:rename', (_event, oldPath: string, newPath: string) => {
    try {
      fs.renameSync(oldPath, newPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 检查路径是否存在
  ipcMain.handle('fs:exists', (_event, targetPath: string) => {
    return fs.existsSync(targetPath)
  })

  // 拼接路径（跨平台兼容）
  ipcMain.handle('fs:joinPath', (_event, ...segments: string[]) => {
    return path.join(...segments)
  })

  // 获取父目录路径
  ipcMain.handle('fs:parentDir', (_event, targetPath: string) => {
    return path.dirname(targetPath)
  })

  // 获取文件/目录信息
  ipcMain.handle('fs:stat', (_event, targetPath: string) => {
    try {
      const stat = fs.statSync(targetPath)
      return {
        success: true,
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        ctime: stat.ctime.toISOString()
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
