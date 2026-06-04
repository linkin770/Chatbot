# Chatbot

> 一个 Linear 风格、连接任何 OpenAI 兼容接口的桌面端 Chatbot。
> **完全由 AI 编写，任君采撷。**

---

## 关于本项目

本项目（连同本仓库的每一行代码、每一处设计、每一个 bug）是**完全由 AI（助手大模型）从零生成**的。
没有手写设计稿，没有第三方组件库的搬运，不依赖任何 LLM 之外的「人类工程」。

- **生成的代码**：Electron 主进程、Preload、React 组件、Tailwind 样式、TypeScript 类型、Vite 构建脚本、Electron Forge 打包配置、MiSans 字体集成、i18n 中英翻译、模型仓库持久化、性能优化……全部由模型写出。
- **生成的文档**：本 README、目录里的所有注释、提交风格、调试输出，均出自 AI 之手。
- **人做的事**：提出需求、点几次「继续」。

如果你打算在生产环境使用，请先理解：

- **MIT 协议，免费使用**，但作者不为任何故障负责。
- 代码质量由模型当时的幻觉概率决定，欢迎自行审计、修改、分发。
- 你看到的所有「打磨过」的细节（例如 `font-family` 自动切换、Markdown 流式降级）都来自一次次的「这里再优化一点」对话——不是事先规划好的架构。

> 任君采撷。改、卖、嵌入产品、拿去交作业、或者烧掉它祭天，都行。

---

## 主要功能

| 功能 | 说明 |
| --- | --- |
| 多模型接入 | 任何 OpenAI 兼容的 `/chat/completions` 端点：DeepSeek、OpenAI、Moonshot、SiliconFlow、OpenRouter、Ollama … |
| 模型仓库 | 把你常用的 (URL + API Key + 模型名) 三元组存进本地仓库，主页一键切换 |
| 一键拉取模型 | 在弹窗里填好接口地址和 Key，点「获取模型」即可下拉选择，避免逐个手敲 |
| 中英文界面 | 右上角一键切换，切换后自动应用 MiSans 字体 |
| 流式响应 | Markdown 实时渲染、代码高亮、复制/重新生成/中断按钮 |
| 性能友好 | 面向 ARM / 麒麟 9000C 等弱 CPU 优化：流式期间跳过 markdown 解析、关闭 backdrop blur、移除高开销字体特性 |
| 离线优先 | 全部数据存于本机：对话、设置、模型仓库。不会上传到任何服务器 |

---

## 截图与界面（文字版）

```
┌──────────────┬─────────────────────────────────────────────┐
│  Chatbot     │   [model 名称 ▾]                            │
│  v0.1 · …    │                                             │
│              │   你好！今天能帮你什么？                      │
│  + New chat  │   ┌──────────────────────────────────────┐  │
│              │   │ 输入你的消息…                  ↑ send │  │
│  今日        │   └──────────────────────────────────────┘  │
│   • 对话 A    │   模型：来自仓库 / 自定义 / 预设               │
│  本周        │                                             │
│   • 对话 B    │                                             │
│  更早        │                                             │
│              │                                             │
│  ⚙ 设置      │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

设置面板中：

- **API** — 接口地址、API Key、模型；底部是「已保存的模型」仓库列表（可新建 / 编辑 / 删除 / 设为当前）。
- **System Prompt** — 自定义系统提示。
- **Language** — English / 中文 切换。
- **快捷预设** — DeepSeek、OpenAI、Moonshot、OpenRouter、Ollama；外加一个「自定义…」入口清空输入栏。

---

## 技术栈

- **Electron 32** — 桌面运行时
- **React 18 + TypeScript** — UI
- **Vite 5 + Electron Forge 7** — 构建 / 打包
- **TailwindCSS 3** — 样式
- **Zustand 4** — 全局状态（对话 / 设置 / 仓库）
- **react-markdown + remark-gfm + rehype-highlight + highlight.js** — Markdown 渲染
- **MiSans** — 中文字体（已放在 `Chatbot/fonts/`，按 `html[data-lang='zh']` 自动启用）

---

## 快速开始

```bash
# 1. 安装依赖
cd Chatbot
npm install

# 2. 开发模式（启 Electron，自动 build main / preload / renderer）
npm run dev

# 3. 打包当前平台安装包
npm run make
```

> 首次启动后，点右上角「设置」→ 在「API」区填入接口地址、API Key、新建或选择一个模型，即可开始对话。
> 配置和对话会持久化到 Electron 的 `userData` 目录。

---

## 目录结构

```
Chatbot/
├── src/
│   ├── main/            # Electron 主进程（IPC、/models 拉取、文件保存）
│   ├── preload/         # 暴露 window.chatbot API 给渲染进程
│   ├── renderer/        # React + Tailwind 应用
│   │   ├── components/  # Sidebar / ChatArea / MessageBubble / InputBar / SettingsPanel …
│   │   ├── hooks/       # useChatStream (流式 fetch)
│   │   ├── store/       # Zustand store
│   │   ├── styles/      # global.css（@font-face、tailwind）
│   │   ├── i18n.ts      # 中英翻译字典 + useT hook
│   │   └── App.tsx
│   └── shared/          # 跨进程共享类型
├── fonts/               # MiSans 字体源文件
├── public/fonts/        # Vite 静态资源（最终随 dist 一起打包）
└── vite.*.config.ts     # 主 / preload / renderer 三份 Vite 配置
```

---

## 模型仓库数据结构

保存在 `settings.savedModels`（持久化到 store）：

```ts
interface SavedModel {
  id: string;          // 与 name 同值
  name: string;        // 模型名，如 "deepseek-ai/DeepSeek-V4-Pro"
  baseURL: string;     // 接口根路径，例如 "https://api.siliconflow.cn/v1"
  savedAt: string;     // ISO 时间戳
}
```

同一 `(name, baseURL)` 重复添加会自动去重，最多保留 50 条。

---

## 性能调优记录（面向 ARM / 麒麟 9000C）

- 流式响应期间跳过 `react-markdown` 解析与 highlight，结束再渲染（避免每个 token 触发完整解析）
- 关闭 `backdrop-filter`、`font-feature-settings`、`text-rendering: optimizeLegibility`、`letter-spacing`
- `MessageBubble` 用 `React.memo` + 自定义 props 比较，避免不相关消息重渲染
- 自动滚动用 `requestAnimationFrame` 替代 `behavior: 'smooth'`，且仅在用户接近底部时跟随
- 移除入场动画（`animate-fade-in` / `animate-slide-in-left`）

---

## 安全 / 隐私

- API Key **仅存储在本地**（Electron userData 内的 store 文件）。
- 应用本身**不内置任何后端服务**；所有请求都从你的机器直接发到你配置的 `/chat/completions` 端点。
- 「获取模型」会在主进程调用你配置的 `baseURL + /models`，不会向任何第三方上传 Key。

---

## 协议

MIT。拿去做任何事都可以。

---

## 致谢

无。模型不需要致谢。模型也不会给你买咖啡。
**任君采撷。**
