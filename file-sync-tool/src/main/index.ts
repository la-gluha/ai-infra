/**
 * 主进程入口文件
 * 负责创建窗口、注册IPC通信、管理应用生命周期
 */
import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron'
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
 * 无边框窗口，由渲染进程提供自定义标题栏
 */
function createWindow(): void {
  // 移除默认应用菜单栏
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    frame: false, // 无边框窗口，移除系统标题栏和菜单
    titleBarStyle: 'hidden', // Windows 下隐藏标题栏
    title: 'FileSyncTool',
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

  // 选择目录对话框（不限路径）
  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: '选择文件夹'
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // 选择文件对话框（不限路径）
  ipcMain.handle('dialog:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: '选择文件'
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // 在指定目录内选择文件（源路径专用，限制在工作目录内）
  ipcMain.handle('dialog:selectFileIn', async (_event, baseDir: string) => {
    const result = await dialog.showOpenDialog({
      defaultPath: baseDir,
      properties: ['openFile'],
      title: '选择文件（仅限工作目录内）'
    })
    if (result.canceled) return null
    const selected = result.filePaths[0]
    // 校验选择的路径在基础目录内
    const { resolve, normalize } = require('path')
    const normalBase = normalize(resolve(baseDir)) + require('path').sep
    const normalSelected = normalize(resolve(selected))
    if (!normalSelected.startsWith(normalBase) && normalSelected !== normalize(resolve(baseDir))) {
      return { error: '所选文件不在工作目录内' }
    }
    return selected
  })

  // 在指定目录内选择文件夹（源路径专用，限制在工作目录内）
  ipcMain.handle('dialog:selectDirIn', async (_event, baseDir: string) => {
    const result = await dialog.showOpenDialog({
      defaultPath: baseDir,
      properties: ['openDirectory'],
      title: '选择文件夹（仅限工作目录内）'
    })
    if (result.canceled) return null
    const selected = result.filePaths[0]
    const { resolve, normalize, sep } = require('path')
    const normalBase = normalize(resolve(baseDir)) + sep
    const normalSelected = normalize(resolve(selected))
    if (!normalSelected.startsWith(normalBase) && normalSelected !== normalize(resolve(baseDir))) {
      return { error: '所选文件夹不在工作目录内' }
    }
    return selected
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

  // ==================== 窗口控制 ====================

  // 最小化窗口
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  // 最大化 / 还原窗口
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
    return mainWindow?.isMaximized()
  })

  // 关闭窗口
  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })

  // 查询是否已最大化
  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false
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
