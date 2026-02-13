/**
 * 主进程入口文件
 * 负责创建窗口、注册IPC通信、管理应用生命周期
 */
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerFileHandlers } from './handlers/fileHandlers'
import { registerGitHandlers } from './handlers/gitHandlers'
import { registerSyncHandlers } from './handlers/syncHandlers'
import { getStore } from './store'

/** 主窗口引用 */
let mainWindow: BrowserWindow | null = null

/**
 * 创建主窗口
 * 配置窗口大小、预加载脚本及加载页面
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    title: 'FileSyncTool - 本地文件同步工具',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 窗口准备好后显示，避免白屏闪烁
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 外部链接在默认浏览器中打开
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发环境加载dev server，生产环境加载本地文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * 注册全局IPC处理器
 * 包括选择目录、获取/设置工作目录等通用操作
 */
function registerGlobalHandlers(): void {
  const store = getStore()

  // 选择目录对话框
  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: '选择工作目录'
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // 获取工作目录
  ipcMain.handle('store:getWorkDir', () => {
    return store.get('workDir', null)
  })

  // 设置工作目录
  ipcMain.handle('store:setWorkDir', (_event, dir: string) => {
    store.set('workDir', dir)
    return true
  })

  // 获取同步关联配置
  ipcMain.handle('store:getSyncMappings', () => {
    return store.get('syncMappings', [])
  })

  // 设置同步关联配置
  ipcMain.handle('store:setSyncMappings', (_event, mappings: unknown) => {
    store.set('syncMappings', mappings)
    return true
  })
}

// 应用就绪后创建窗口并注册处理器
app.whenReady().then(() => {
  registerGlobalHandlers()
  registerFileHandlers()
  registerGitHandlers()
  registerSyncHandlers()
  createWindow()

  // macOS 点击 dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出应用（Windows/Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
