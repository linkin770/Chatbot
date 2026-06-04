import { contextBridge, ipcRenderer } from 'electron';

/**
 * The "bridge" exposed to the renderer. We keep it intentionally narrow —
 * just the small set of native capabilities the UI needs. The renderer
 * runs with `contextIsolation: true`, so anything not exposed here is
 * unreachable.
 */
const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  getPlatform: (): Promise<NodeJS.Platform> => ipcRenderer.invoke('app:get-platform'),
  saveDialog: (payload: { defaultPath: string; content: string }) =>
    ipcRenderer.invoke('dialog:save', payload),
  listModels: (payload: { baseURL: string; apiKey: string }): Promise<
    { ok: true; models: string[] } | { ok: false; error: string }
  > => ipcRenderer.invoke('models:list', payload),
};

contextBridge.exposeInMainWorld('chatbot', api);

export type ChatbotAPI = typeof api;
