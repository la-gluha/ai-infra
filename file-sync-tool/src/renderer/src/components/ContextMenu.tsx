/**
 * 右键上下文菜单组件
 * 在文件树中右键点击时显示操作菜单
 */
import React from 'react'

/** 组件属性 */
interface ContextMenuProps {
  /** 菜单 X 坐标 */
  x: number
  /** 菜单 Y 坐标 */
  y: number
  /** 右键点击的文件节点 */
  node: FileTreeNode
  /** 新建文件回调 */
  onCreateFile: (parentPath: string) => void
  /** 新建文件夹回调 */
  onCreateDir: (parentPath: string) => void
  /** 删除回调 */
  onDelete: (path: string, name: string) => void
  /** 重命名回调 */
  onRename: (path: string, name: string) => void
}

/**
 * 右键上下文菜单
 * 根据节点类型显示不同的操作选项
 */
function ContextMenu({
  x,
  y,
  node,
  onCreateFile,
  onCreateDir,
  onDelete,
  onRename
}: ContextMenuProps): React.ReactElement {
  // 如果是目录，新建操作在当前目录下
  // 如果是文件，新建操作在其父目录下
  const parentPath = node.isDirectory ? node.path : node.path.substring(0, node.path.lastIndexOf('/'))

  return (
    <div className="context-menu" style={{ left: x, top: y }}>
      {/* 目录特有操作 */}
      {node.isDirectory && (
        <>
          <button className="context-menu-item" onClick={() => onCreateFile(parentPath)}>
            📄 新建文件
          </button>
          <button className="context-menu-item" onClick={() => onCreateDir(parentPath)}>
            📁 新建文件夹
          </button>
          <div className="context-menu-divider" />
        </>
      )}

      {/* 通用操作 */}
      <button className="context-menu-item" onClick={() => onRename(node.path, node.name)}>
        ✏️ 重命名
      </button>
      <button className="context-menu-item" onClick={() => onDelete(node.path, node.name)}>
        🗑️ 删除
      </button>
    </div>
  )
}

export default ContextMenu
