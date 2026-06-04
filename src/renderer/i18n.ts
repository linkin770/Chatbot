import { useChatStore } from './store/chat';
import type { Lang } from '../shared/types';

/** All UI text strings in both languages. */
const translations: Record<string, { en: string; zh: string }> = {
  // Sidebar
  'sidebar.brand': { en: 'Chatbot', zh: 'Chatbot' },
  'sidebar.newChat': { en: 'New chat', zh: '新建对话' },
  'sidebar.search': { en: 'Search chats', zh: '搜索对话' },
  'sidebar.today': { en: 'Today', zh: '今天' },
  'sidebar.thisWeek': { en: 'This week', zh: '本周' },
  'sidebar.older': { en: 'Older', zh: '更早' },
  'sidebar.settings': { en: 'Settings', zh: '设置' },
  'sidebar.noConversations': { en: 'No conversations yet.', zh: '暂无对话记录。' },
  'sidebar.startNew': { en: 'Start a new chat above.', zh: '点击上方新建对话。' },
  'sidebar.focusSearch': { en: 'to focus search', zh: '聚焦搜索' },
  'sidebar.rename': { en: 'Rename', zh: '重命名' },
  'sidebar.delete': { en: 'Delete', zh: '删除' },
  'sidebar.expand': { en: 'Expand sidebar', zh: '展开侧边栏' },
  'sidebar.collapse': { en: 'Collapse sidebar', zh: '收起侧边栏' },
  'sidebar.deleteConfirm': { en: 'Delete', zh: '确定删除' },

  // Chat area
  'chat.greeting': { en: 'Good to see you.', zh: '你好，欢迎使用。' },
  'chat.subtitle': { en: 'Ask anything. Chatbot streams responses token-by-token, remembers your session, and stays out of your way.', zh: '随意提问。Chatbot 逐字输出回复，记住你的会话，不打扰你。' },
  'chat.noApiKey': { en: 'Configure your API key in', zh: '请在' },
  'chat.noApiKey2': { en: 'Settings', zh: '设置' },
  'chat.noApiKey3': { en: 'to start chatting.', zh: '中配置 API Key 以开始对话。' },
  'chat.emptyState': { en: 'Select a conversation or start a new one.', zh: '选择一个对话或新建一个。' },
  'chat.typing': { en: 'Typing...', zh: '正在输入…' },
  'chat.suggestions': { en: 'Try', zh: '试试' },

  // Message bubble
  'msg.copy': { en: 'Copy', zh: '复制' },
  'msg.copied': { en: 'Copied', zh: '已复制' },
  'msg.regenerate': { en: 'Regenerate', zh: '重新生成' },
  'msg.stop': { en: 'Stop', zh: '停止' },
  'msg.code': { en: 'code', zh: '代码' },

  // Input bar
  'input.placeholder': { en: 'Type a message… (Enter to send, Shift+Enter for new line)', zh: '输入消息…（Enter 发送，Shift+Enter 换行）' },
  'input.send': { en: 'Send', zh: '发送' },
  'input.attach': { en: 'Attach file', zh: '附件' },
  'input.startNewChat': { en: 'Start a new chat to begin…', zh: '新建一个对话开始吧…' },

  // Settings
  'settings.title': { en: 'Settings', zh: '设置' },
  'settings.close': { en: 'Close (Esc)', zh: '关闭 (Esc)' },
  'settings.api': { en: 'API', zh: 'API' },
  'settings.apiDesc': { en: 'Chatbot talks to any OpenAI-compatible /chat/completions endpoint.', zh: 'Chatbot 连接任何兼容 OpenAI 格式的 /chat/completions 接口。' },
  'settings.baseURL': { en: 'Base URL', zh: '接口地址' },
  'settings.baseURLHint': { en: 'Endpoint root. /chat/completions is appended automatically.', zh: '接口根路径。系统会自动追加 /chat/completions。' },
  'settings.apiKey': { en: 'API key', zh: 'API 密钥' },
  'settings.apiKeyHint': { en: 'Stored locally in your browser profile. Never sent to our servers.', zh: '仅存储在本地浏览器配置中，不会上传到任何服务器。' },
  'settings.model': { en: 'Model', zh: '模型' },
  'settings.modelHint': { en: 'Any model your provider exposes.', zh: '你的服务商提供的任意模型名称。' },
  'settings.saveAsCustom': { en: 'Save', zh: '保存为自定义' },
  'settings.removeCustom': { en: 'Remove', zh: '移除' },
  'settings.customModels': { en: 'Custom models', zh: '自定义模型' },
  'settings.fetchModels': { en: 'Fetch models', zh: '获取模型' },
  'settings.fetchModelsMissing': { en: 'Please fill in Base URL and API key first.', zh: '请先填写接口地址和 API 密钥。' },
  'settings.savedModels': { en: 'Saved models', zh: '已保存的模型' },
  'settings.savedModelsEmpty': { en: 'No saved models yet. Click + New to add one.', zh: '暂无已保存的模型，点击「+ 新建」添加。' },
  'settings.modelNew': { en: 'New model', zh: '新建模型' },
  'settings.modelEdit': { en: 'Edit', zh: '编辑' },
  'settings.modelSave': { en: 'Save model', zh: '保存模型' },
  'settings.modelModalDesc': { en: 'The new model will be saved into the model repository. Fill in the API endpoint, key, and the model name. You can click Fetch models after the key is filled in to pick from the list.', zh: '新模型会保存到模型仓库。填写接口地址、密钥、模型名称；密钥填好后可点「获取模型」从列表中选择。' },
  'settings.useThisModel': { en: 'Use this model', zh: '使用此模型' },
  'settings.cancel': { en: 'Cancel', zh: '取消' },
  'settings.removeSaved': { en: 'Remove from saved', zh: '从已保存中移除' },
  'input.modelPicker': { en: 'Model', zh: '模型' },
  'input.noModel': { en: 'No model', zh: '未选择模型' },
  'input.noSavedModels': { en: 'No saved models yet. Use Settings → Fetch models to add some.', zh: '暂无已保存的模型。打开「设置」→「获取模型」来添加。' },
  'settings.temperature': { en: 'Temperature', zh: '温度' },
  'settings.temperatureHint': { en: 'higher is more creative.', zh: '值越高回复越有创造性。' },
  'settings.presets': { en: 'Presets', zh: '预设' },
  'settings.presetCustom': { en: 'Custom…', zh: '自定义…' },
  'settings.presetCustomHint': { en: 'Clear the fields to enter your own URL / API key / model.', zh: '清空下方输入栏，自行填写 URL / API Key / 模型。' },
  'settings.systemPrompt': { en: 'System prompt', zh: '系统提示词' },
  'settings.systemPromptDesc': { en: 'Prepended to every conversation as a system message.', zh: '每条对话都会以系统消息的形式附加此前缀。' },
  'settings.systemPromptPlaceholder': { en: 'You are a helpful, concise assistant.', zh: '你是一个乐于助人、简洁明了的助手。' },
  'settings.appearance': { en: 'Appearance', zh: '外观' },
  'settings.appearanceDesc': { en: 'Chatbot ships with a single, carefully-tuned light theme.', zh: 'Chatbot 仅提供精心调校的浅色主题。' },
  'settings.light': { en: 'Light', zh: '浅色' },
  'settings.lightDesc': { en: 'Paper-white surfaces, hairline borders, one accent.', zh: '纸白底色、发丝边框、单一强调色。' },
  'settings.active': { en: 'Active', zh: '当前' },
  'settings.data': { en: 'Data', zh: '数据' },
  'settings.dataDesc': { en: "Conversations are stored in this device's local storage. Nothing is uploaded.", zh: '对话记录存储在本地设备中，不会上传任何数据。' },
  'settings.clearAll': { en: 'Clear all conversations', zh: '清空所有对话' },
  'settings.clearAllConfirm': { en: 'Delete all conversations? This cannot be undone.', zh: '确定删除所有对话？此操作不可撤销。' },
  'settings.saved': { en: 'Saved', zh: '已保存' },
  'settings.unsaved': { en: 'Unsaved changes', zh: '未保存的更改' },
  'settings.reset': { en: 'Reset', zh: '重置' },
  'settings.saveChanges': { en: 'Save changes', zh: '保存更改' },
  'settings.show': { en: 'Show', zh: '显示' },
  'settings.hide': { en: 'Hide', zh: '隐藏' },

  // Language
  'settings.language': { en: 'Language', zh: '语言' },
  'settings.languageDesc': { en: 'Switch UI language between English and Chinese.', zh: '在英文和中文之间切换界面语言。' },
  'settings.langEn': { en: 'English', zh: '英文' },
  'settings.langZh': { en: '中文', zh: '中文' },
  'settings.switchToZh': { en: '切换为中文', zh: 'Switch to English' },
  'settings.switchToEn': { en: 'Switch to English', zh: '切换为英文' },

  // Toast
  'toast.copied': { en: 'Copied to clipboard', zh: '已复制到剪贴板' },
  'toast.error': { en: 'Something went wrong', zh: '出错了' },
  'toast.apiError': { en: 'API request failed. Check your settings.', zh: 'API 请求失败，请检查设置。' },

  // Suggestion texts
  'suggest.1': { en: 'Summarize the last quarter of project status updates into a one-pager.', zh: '把上一季度的项目状态更新总结成一页纸。' },
  'suggest.2': { en: 'Write a SQL query that finds duplicate customer records by email.', zh: '写一条 SQL 查询，按邮箱查找重复客户记录。' },
  'suggest.3': { en: 'Explain how a transformer attends to tokens in plain language.', zh: '用通俗的语言解释 Transformer 如何关注 token。' },
  'suggest.4': { en: 'Draft a friendly follow-up email after a sales call.', zh: '写一封销售电话后的友好跟进邮件。' },

  // Common
  'common.newConversation': { en: 'New conversation', zh: '新对话' },
  'common.loading': { en: 'Loading...', zh: '加载中…' },
};

export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

/** Hook: returns a translation function bound to the current language. */
export function useT() {
  const lang = useChatStore((s) => s.settings.lang) || 'en';
  return (key: string) => t(key, lang);
}