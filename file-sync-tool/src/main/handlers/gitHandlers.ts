/**
 * Git操作处理器模块
 * 使用 simple-git 提供 Git 仓库的初始化、提交、推送等功能
 */
import { ipcMain } from 'electron'
import simpleGit, { SimpleGit } from 'simple-git'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 获取指定目录的 Git 实例
 * @param workDir - 工作目录路径
 * @returns SimpleGit 实例
 */
function getGit(workDir: string): SimpleGit {
  return simpleGit(workDir)
}

/**
 * 注册所有 Git 操作相关的 IPC 处理器
 */
export function registerGitHandlers(): void {
  // 初始化 Git 仓库
  ipcMain.handle('git:init', async (_event, workDir: string) => {
    try {
      const git = getGit(workDir)
      // 检查是否已经是 git 仓库
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        await git.init()
        // 创建 .gitignore 文件
        const gitignorePath = path.join(workDir, '.gitignore')
        if (!fs.existsSync(gitignorePath)) {
          fs.writeFileSync(gitignorePath, 'node_modules/\n.DS_Store\nThumbs.db\n', 'utf-8')
        }
      }
      return { success: true, isNew: !isRepo }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 获取 Git 状态
  ipcMain.handle('git:status', async (_event, workDir: string) => {
    try {
      const git = getGit(workDir)
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        return { success: true, isRepo: false }
      }
      const status = await git.status()
      return {
        success: true,
        isRepo: true,
        current: status.current, // 当前分支
        tracking: status.tracking, // 跟踪的远程分支
        files: status.files.map((f) => ({
          path: f.path,
          index: f.index, // 暂存区状态
          working_dir: f.working_dir // 工作区状态
        })),
        staged: status.staged, // 已暂存的文件
        modified: status.modified, // 已修改的文件
        not_added: status.not_added, // 未跟踪的文件
        created: status.created, // 新建的文件
        deleted: status.deleted // 已删除的文件
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 添加文件到暂存区
  ipcMain.handle('git:add', async (_event, workDir: string, files: string | string[]) => {
    try {
      const git = getGit(workDir)
      await git.add(files)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 提交更改
  ipcMain.handle('git:commit', async (_event, workDir: string, message: string) => {
    try {
      const git = getGit(workDir)
      // 先添加所有更改
      await git.add('.')
      const result = await git.commit(message)
      return {
        success: true,
        summary: {
          branch: result.branch,
          commit: result.commit,
          summary: result.summary
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 推送到远程仓库
  ipcMain.handle('git:push', async (_event, workDir: string) => {
    try {
      const git = getGit(workDir)
      // 检查是否有远程仓库
      const remotes = await git.getRemotes(true)
      if (remotes.length === 0) {
        return { success: false, error: '未配置远程仓库' }
      }
      await git.push()
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 获取提交日志
  ipcMain.handle('git:log', async (_event, workDir: string, maxCount: number = 50) => {
    try {
      const git = getGit(workDir)
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        return { success: true, logs: [] }
      }
      const log = await git.log({ maxCount })
      return {
        success: true,
        logs: log.all.map((entry) => ({
          hash: entry.hash,
          date: entry.date,
          message: entry.message,
          author_name: entry.author_name
        }))
      }
    } catch (error) {
      // 空仓库没有日志时不报错
      return { success: true, logs: [] }
    }
  })

  // 获取远程仓库列表
  ipcMain.handle('git:remotes', async (_event, workDir: string) => {
    try {
      const git = getGit(workDir)
      const remotes = await git.getRemotes(true)
      return {
        success: true,
        remotes: remotes.map((r) => ({
          name: r.name,
          fetchUrl: r.refs.fetch,
          pushUrl: r.refs.push
        }))
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 添加远程仓库
  ipcMain.handle(
    'git:addRemote',
    async (_event, workDir: string, name: string, url: string) => {
      try {
        const git = getGit(workDir)
        await git.addRemote(name, url)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    }
  )

  // 查看文件差异
  ipcMain.handle('git:diff', async (_event, workDir: string) => {
    try {
      const git = getGit(workDir)
      const diff = await git.diff()
      return { success: true, diff }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
