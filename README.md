# FileSyncTool

一款基于 Electron 的本地文件同步工具，内置 Git 版本管理，提供类 VS Code 的文件浏览与编辑体验。

## 功能特性

- **工作目录管理** — 首次启动引导选择工作目录，支持随时切换
- **文件浏览器** — 树形目录结构展示，支持新建、重命名、删除文件/文件夹，右键菜单操作
- **代码编辑器** — 集成 Monaco Editor（VS Code 同款内核），支持语法高亮、智能提示、多标签页编辑
- **撤回 / 重做** — 编辑器原生支持 `Ctrl+Z` 撤回、`Ctrl+Shift+Z` 重做
- **Git 版本管理** — 自动初始化仓库，查看变更文件、提交日志，一键提交并推送
- **文件同步** — 可视化配置源路径与目标路径的映射关系，手动或提交后自动同步
- **Windows 打包** — 通过 electron-builder 打包为 NSIS 安装包（.exe）

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 桌面框架 | [Electron](https://www.electronjs.org/) |
| 构建工具 | [electron-vite](https://electron-vite.org/) |
| 前端 | [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| 代码编辑器 | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Git 操作 | [simple-git](https://github.com/steveukx/git-js) |
| 持久化存储 | [electron-store](https://github.com/sindresorhus/electron-store) |
| 打包 | [electron-builder](https://www.electron.build/) |

## 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Git](https://git-scm.com/) 已安装并可通过命令行访问
- Windows 10/11（当前仅面向 Windows 开发）

## 快速开始

### 安装依赖

```bash
cd file-sync-tool
npm install
```

### 开发模式运行

启动开发服务器，支持热更新：

```bash
npm run dev
```

### 生产构建

仅编译源码到 `out/` 目录，不打包安装程序：

```bash
npm run build
```

构建产物位于 `file-sync-tool/out/`，包含 `main/`、`preload/`、`renderer/` 三个子目录。

### 打包为安装程序

在 Windows 环境下执行，生成 NSIS 安装包：

```bash
npm run package
```

安装程序输出到 `file-sync-tool/dist/` 目录。

> 如果只需要免安装的目录结构（用于调试），可以运行 `npm run package:dir`。

## 项目结构

```
file-sync-tool/
├── electron-vite.config.ts           # electron-vite 构建配置
├── package.json                      # 依赖与 electron-builder 打包配置
├── tsconfig.json                     # TypeScript 配置
└── src/
    ├── main/                         # 主进程
    │   ├── index.ts                  #   窗口创建、IPC 注册、生命周期管理
    │   ├── store.ts                  #   持久化存储（工作目录、同步配置）
    │   └── handlers/
    │       ├── fileHandlers.ts       #   文件/目录 CRUD 操作
    │       ├── gitHandlers.ts        #   Git init / commit / push / log / diff
    │       └── syncHandlers.ts       #   文件同步执行引擎
    ├── preload/
    │   └── index.ts                  # contextBridge 安全桥接层
    └── renderer/                     # 渲染进程（React）
        ├── index.html
        └── src/
            ├── main.tsx              #   React 入口
            ├── App.tsx               #   根组件，管理全局状态
            ├── types.d.ts            #   全局类型声明
            ├── styles/
            │   └── global.css        #   VS Code 风格暗色主题
            └── components/
                ├── SetupPage.tsx     #   首次启动目录选择页
                ├── MainLayout.tsx    #   主界面布局
                ├── FileTree.tsx      #   文件树浏览器
                ├── EditorArea.tsx    #   Monaco 编辑器 + 标签页
                ├── BottomPanel.tsx   #   底部面板（变更列表 / 提交日志）
                ├── StatusBar.tsx     #   状态栏（Git 分支、工作目录）
                ├── CommitDialog.tsx  #   Git 提交对话框
                ├── SyncConfigDialog.tsx  # 同步关联可视化配置
                ├── ContextMenu.tsx   #   右键上下文菜单
                └── Notification.tsx  #   操作反馈通知
```

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl + S` | 保存当前文件 |
| `Ctrl + Z` | 撤回 |
| `Ctrl + Shift + Z` | 重做 |
| `Ctrl + Enter` | 在提交对话框中快速提交 |

## 许可证

[MIT](LICENSE)
