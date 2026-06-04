import type { ChatMessage } from '../../shared/types';

/**
 * OpenAI-compatible chat completion message shape. The renderer only ever
 * sends/receives the slim subset we actually use.
 */
export interface ChatRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  baseURL: string;
  apiKey: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  messages: ChatRequestMessage[];
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

interface OpenAIChatChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
}

/**
 * Streams a chat completion from any OpenAI-compatible /chat/completions
 * endpoint, including DeepSeek, Moonshot, OpenRouter, local Ollama, etc.
 *
 * We deliberately use the native `fetch` API (no SDK) — fewer dependencies,
 * smaller bundle, and the streaming protocol is simple enough to handle
 * directly. We read the response as a ReadableStream and parse SSE frames
 * incrementally.
 */
export async function streamChatCompletion(opts: StreamChatOptions): Promise<void> {
  const { baseURL, apiKey, model, temperature, systemPrompt, messages, signal } = opts;

  if (!apiKey) {
    opts.onError(new Error('Missing API key. Open Settings to configure it.'));
    return;
  }

  // Normalize the base URL — strip trailing slashes and append /chat/completions.
  const base = baseURL.replace(/\/+$/, '');
  const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;

  // Prepend the system prompt if one is configured.
  const finalMessages: ChatRequestMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model,
        temperature,
        stream: true,
        messages: finalMessages,
      }),
      signal,
    });
  } catch (err) {
    opts.onError(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  if (!response.ok || !response.body) {
    // Attempt to read the body for a server-provided error message.
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      /* ignore */
    }
    const msg = detail || `${response.status} ${response.statusText}`;
    opts.onError(new Error(`Request failed (${response.status}): ${msg}`));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by double newlines.
      let sepIndex: number;
      // eslint-disable-next-line no-cond-assign
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        const lines = frame.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') {
            opts.onDone();
            return;
          }
          if (!payload) continue;
          try {
            const json = JSON.parse(payload) as OpenAIChatChunk;
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) opts.onDelta(delta);
          } catch {
            // Some providers send non-JSON keep-alives — silently ignore.
          }
        }
      }
    }
    opts.onDone();
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      // Treat abort as a normal cancellation — the caller decides UX.
      opts.onDone();
      return;
    }
    opts.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
