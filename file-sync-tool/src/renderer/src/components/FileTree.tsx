/**
 * 文件树组件
 * 以树形结构展示工作目录的文件和文件夹
 */
import React, { useState, useCallback } from 'react'

/** 组件属性 */
interface FileTreeProps {
  /** 文件树节点数据 */
  nodes: FileTreeNode[]
  /** 当前激活的文件路径 */
  activeFile: string | null
  /** 打开文件的回调 */
  onOpenFile: (node: FileTreeNode) => void
  /** 右键菜单回调 */
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void
}

/**
 * 单个文件树节点组件属性
 */
interface TreeNodeProps {
  /** 节点数据 */
  node: FileTreeNode
  /** 缩进层级 */
  depth: number
  /** 当前激活的文件路径 */
  activeFile: string | null
  /** 打开文件的回调 */
  onOpenFile: (node: FileTreeNode) => void
  /** 右键菜单回调 */
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void
}

/**
 * 获取文件图标
 * 根据文件扩展名返回对应图标
 * @param name - 文件名
 * @param isDirectory - 是否为目录
 * @returns 图标字符
 */
function getFileIcon(name: string, isDirectory: boolean): string {
  if (isDirectory) return '📁'

  const ext = name.split('.').pop()?.toLowerCase()
  // 根据扩展名映射图标
  const iconMap: Record<string, string> = {
    ts: '🔷',
    tsx: '⚛️',
    js: '🟡',
    jsx: '⚛️',
    json: '📋',
    md: '📝',
    css: '🎨',
    html: '🌐',
    svg: '🖼️',
    png: '🖼️',
    jpg: '🖼️',
    gif: '🖼️',
    txt: '📄',
    yml: '⚙️',
    yaml: '⚙️',
    toml: '⚙️',
    gitignore: '🔒'
  }

  return iconMap[ext || ''] || '📄'
}

/**
 * 单个树节点组件
 * 支持展开/折叠目录、点击打开文件
 */
function TreeNode({
  node,
  depth,
  activeFile,
  onOpenFile,
  onContextMenu
}: TreeNodeProps): React.ReactElement {
  /** 目录是否展开 */
  const [expanded, setExpanded] = useState(depth < 1)

  /**
   * 点击节点：目录切换展开/折叠，文件则打开
   */
  const handleClick = useCallback(() => {
    if (node.isDirectory) {
      setExpanded((prev) => !prev)
    } else {
      onOpenFile(node)
    }
  }, [node, onOpenFile])

  /**
   * 右键菜单
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      onContextMenu(e, node)
    },
    [node, onContextMenu]
  )

  // 计算左侧缩进
  const paddingLeft = 8 + depth * 16

  return (
    <>
      <div
        className={`file-tree-item ${activeFile === node.path ? 'active' : ''}`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* 目录展开/折叠箭头 */}
        {node.isDirectory && (
          <span className="arrow">{expanded ? '▾' : '▸'}</span>
        )}
        {/* 文件图标 */}
        <span className="icon">{getFileIcon(node.name, node.isDirectory)}</span>
        {/* 文件名 */}
        <span className="name">{node.name}</span>
      </div>

      {/* 子节点（目录展开时渲染） */}
      {node.isDirectory && expanded && node.children && (
        <>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              onOpenFile={onOpenFile}
              onContextMenu={onContextMenu}
            />
          ))}
        </>
      )}
    </>
  )
}

/**
 * 文件树组件
 * 渲染整个文件树结构
 */
function FileTree({
  nodes,
  activeFile,
  onOpenFile,
  onContextMenu
}: FileTreeProps): React.ReactElement {
  return (
    <div>
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          activeFile={activeFile}
          onOpenFile={onOpenFile}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  )
}

export default FileTree
