// Ambient declaration of the `chatbot` object exposed on `window` by the
// preload script. Keeps the renderer strictly typed without importing from
// the preload (which runs in the main world).

export {};

declare global {
  interface ChatbotAPI {
    getVersion(): Promise<string>;
    getPlatform(): Promise<NodeJS.Platform | string>;
    saveDialog(payload: { defaultPath: string; content: string }): Promise<{ ok: boolean; path?: string }>;
    listModels(payload: { baseURL: string; apiKey: string }): Promise<
      { ok: true; models: string[] } | { ok: false; error: string }
    >;
  }

  interface Window {
    chatbot: ChatbotAPI;
  }
}
