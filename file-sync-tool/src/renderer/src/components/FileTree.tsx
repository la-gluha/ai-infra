/**
 * 文件树组件
 * 以树形结构展示工作目录，样式对齐 VS Code 资源管理器
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

/** 单个文件树节点组件属性 */
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
 * 获取文件扩展名对应的颜色
 * 与 VS Code 主题配色一致
 * @param name - 文件名
 * @returns 十六进制颜色值
 */
function getFileColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const colorMap: Record<string, string> = {
    ts: '#3178c6',
    tsx: '#3178c6',
    js: '#e8d44d',
    jsx: '#e8d44d',
    json: '#c7a237',
    md: '#519aba',
    css: '#563d7c',
    scss: '#c6538c',
    less: '#1d365d',
    html: '#e44d26',
    xml: '#e44d26',
    svg: '#ffb13b',
    py: '#3572a5',
    rs: '#dea584',
    go: '#00add8',
    java: '#b07219',
    c: '#555555',
    cpp: '#f34b7d',
    sh: '#89e051',
    yml: '#cb171e',
    yaml: '#cb171e',
    toml: '#9c4221',
    txt: '#6a9955',
    gitignore: '#6a9955',
    vue: '#41b883',
    sql: '#e38c00'
  }
  return colorMap[ext] || '#cccccc'
}

/**
 * 文件图标 SVG 组件
 * @param props - name: 文件名, isDirectory: 是否为目录, expanded: 目录是否展开
 */
function FileIcon({ name, isDirectory, expanded }: { name: string; isDirectory: boolean; expanded?: boolean }): React.ReactElement {
  if (isDirectory) {
    // 目录图标（展开/折叠状态不同颜色）
    return expanded ? (
      <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        <path d="M1.5 14h12a.5.5 0 00.491-.598l-1.5-8A.5.5 0 0012 5H6.382l-1-2H1.5a.5.5 0 00-.5.5v10a.5.5 0 00.5.5z" fill="#dcb67a" opacity="0.9"/>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        <path d="M14 4H9.618l-1-2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1z" fill="#c09553"/>
      </svg>
    )
  }

  // 文件图标
  const color = getFileColor(name)
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
      <path d="M9.5 1.1l3.4 3.4.1.6V14c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V2c0-.6.4-1 1-1h5.1l.4.1zM9 2H4v12h8V6H9V2z" fill={color} opacity="0.85"/>
    </svg>
  )
}

/**
 * 展开/折叠箭头 SVG 组件
 */
function ChevronIcon({ expanded }: { expanded: boolean }): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className="tree-chevron"
      style={{
        flexShrink: 0,
        transition: 'transform 0.1s',
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
      }}
    >
      <path d="M5.7 13.7L5 13l4.6-5L5 3l.7-.7L10.8 8z" fill="currentColor" />
    </svg>
  )
}

/**
 * 单个树节点组件
 * 支持展开/折叠目录、点击打开文件、右键菜单
 */
function TreeNode({ node, depth, activeFile, onOpenFile, onContextMenu }: TreeNodeProps): React.ReactElement {
  /** 目录是否展开（首层默认展开） */
  const [expanded, setExpanded] = useState(depth < 1)

  /**
   * 点击节点
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

  // 缩进：箭头区域 20px + 每层 16px
  const paddingLeft = depth * 16

  return (
    <>
      <div
        className={`tree-node ${activeFile === node.path ? 'active' : ''}`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* 缩进线占位（非目录也要对齐） */}
        <span className="tree-indent" style={{ width: 20 }}>
          {node.isDirectory && <ChevronIcon expanded={expanded} />}
        </span>
        {/* 图标 */}
        <span className="tree-icon">
          <FileIcon name={node.name} isDirectory={node.isDirectory} expanded={expanded} />
        </span>
        {/* 文件名 */}
        <span className="tree-label">{node.name}</span>
      </div>

      {/* 子节点 */}
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
 * 文件树根组件
 */
function FileTree({ nodes, activeFile, onOpenFile, onContextMenu }: FileTreeProps): React.ReactElement {
  if (nodes.length === 0) {
    return (
      <div style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: '12px' }}>
        此目录为空
      </div>
    )
  }

  return (
    <div className="file-tree">
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
