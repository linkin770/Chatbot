// Shared types used by both the renderer and preload bridge. Anything that
// crosses the IPC boundary or is referenced from both processes lives here.

export type Role = 'user' | 'assistant' | 'system';

/** Slim message shape sent to OpenAI-compatible /chat/completions endpoints. */
export interface ChatRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  /** Plain text or Markdown content. */
  content: string;
  /** ISO timestamp. */
  createdAt: string;
  /** True while a streamed reply is still in flight. */
  streaming?: boolean;
  /** For assistant messages, the model that produced the reply. */
  model?: string;
  /** Error message captured on failure. */
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type Lang = 'en' | 'zh';

/**
 * A model the user has explicitly saved. We remember the model name plus
 * the API endpoint it belongs to so the picker can group / filter by host.
 */
export interface SavedModel {
  id: string;
  /** Display name shown in the picker — typically the model id. */
  name: string;
  /** Provider baseURL this model was discovered from. */
  baseURL: string;
  /** ISO timestamp. */
  savedAt: string;
}

export interface AppSettings {
  apiKey: string;
  baseURL: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  lang: Lang;
  /** User-saved model list, shown in the home-page picker. */
  savedModels: SavedModel[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  systemPrompt: 'You are a helpful, concise assistant.',
  temperature: 0.7,
  lang: 'zh',
  savedModels: [],
};
