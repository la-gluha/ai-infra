/**
 * 持久化存储模块
 * 使用 electron-store 管理应用配置数据
 */
import Store from 'electron-store'

/** 存储单例 */
let store: Store | null = null

/**
 * 获取存储实例（单例模式）
 * @returns electron-store 实例
 */
export function getStore(): Store {
  if (!store) {
    // 初始化存储实例
    store = new Store({
      name: 'file-sync-tool-config',
      defaults: {
        workDir: null, // 工作目录路径
        syncMappings: [] // 同步关联映射列表
      }
    })
  }
  return store
}
