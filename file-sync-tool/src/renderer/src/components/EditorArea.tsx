/**
 * 编辑器区域组件
 * 包含标签页栏和 Monaco 编辑器
 * 支持多文件编辑、撤回/重做、快捷键保存
 */
import React, { useCallback, useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { OpenTab } from './MainLayout'

/** 组件属性 */
interface EditorAreaProps {
  /** 打开的标签页列表 */
  tabs: OpenTab[]
  /** 当前激活的标签页路径 */
  activeTab: string | null
  /** 选择标签页的回调 */
  onSelectTab: (path: string) => void
  /** 关闭标签页的回调 */
  onCloseTab: (path: string) => void
  /** 内容变更回调 */
  onContentChange: (path: string, content: string) => void
  /** 保存文件的回调 */
  onSaveFile: (path: string) => void
}

/**
 * 根据文件名获取 Monaco 编辑器的语言标识
 * @param fileName - 文件名
 * @returns Monaco 语言标识
 */
function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  // 扩展名到 Monaco 语言的映射
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    xml: 'xml',
    svg: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'cpp',
    sh: 'shell',
    bash: 'shell',
    sql: 'sql',
    vue: 'html',
    toml: 'ini',
    gitignore: 'plaintext',
    txt: 'plaintext'
  }
  return langMap[ext] || 'plaintext'
}

/**
 * 编辑器区域组件
 * 管理 Monaco 编辑器实例，支持 Ctrl+S 保存、Ctrl+Z 撤回
 */
function EditorArea({
  tabs,
  activeTab,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onSaveFile
}: EditorAreaProps): React.ReactElement {
  /** 编辑器实例引用 */
  const editorRef = useRef<unknown>(null)

  /**
   * Monaco 编辑器挂载回调
   * 注册 Ctrl+S 快捷键
   */
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor

      // 注册 Ctrl+S 保存快捷键
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (activeTab) {
          onSaveFile(activeTab)
        }
      })
    },
    [activeTab, onSaveFile]
  )

  /**
   * 编辑器内容变更
   */
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeTab && value !== undefined) {
        onContentChange(activeTab, value)
      }
    },
    [activeTab, onContentChange]
  )

  // 全局键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl+S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (activeTab) {
          onSaveFile(activeTab)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, onSaveFile])

  // 获取当前激活的标签页数据
  const currentTab = tabs.find((t) => t.path === activeTab)

  return (
    <div className="editor-area">
      {/* 标签页栏 */}
      <div className="editor-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.path}
            className={`editor-tab ${tab.path === activeTab ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.path)}
          >
            {/* 文件名 */}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.name}</span>
            {/* 已修改标记 */}
            {tab.modified && <span className="modified-dot" />}
            {/* 关闭按钮 */}
            <button
              className="close-btn"
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(tab.path)
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 编辑器内容区 */}
      <div className="editor-content">
        {currentTab ? (
          <Editor
            key={currentTab.path}
            height="100%"
            language={getLanguageFromFileName(currentTab.name)}
            value={currentTab.content}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              fontFamily: "'Consolas', 'Courier New', monospace",
              minimap: { enabled: true },
              wordWrap: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              // Monaco 编辑器内置撤回/重做支持
              // Ctrl+Z 撤回、Ctrl+Shift+Z / Ctrl+Y 重做
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              padding: { top: 8 }
            }}
          />
        ) : (
          // 无文件打开时显示欢迎页
          <div className="welcome-page">
            <h2>FileSyncTool</h2>
            <p>在左侧文件树中选择文件开始编辑</p>
            <p style={{ fontSize: '12px' }}>
              Ctrl+S 保存 | Ctrl+Z 撤回 | Ctrl+Shift+Z 重做
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditorArea
