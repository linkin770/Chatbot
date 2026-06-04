import { useCallback, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { useChatStore } from '../store/chat';
import { streamChatCompletion } from '../lib/api';
import type { ChatMessage, ChatRequestMessage } from '../../shared/types';

/**
 * Single-flight streaming controller. The hook owns an AbortController that
 * lets the caller stop a generation at any time. The store is the source of
 * truth for message content — this hook only orchestrates the side effects.
 */
export function useChatStream(conversationId: string | null) {
  const abortRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const appendMessage = useChatStore((s) => s.appendMessage);
  const appendDelta = useChatStore((s) => s.appendDelta);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const markMessageError = useChatStore((s) => s.markMessageError);

  const send = useCallback(
    async (text: string) => {
      if (!conversationId) return;
      const { settings } = useChatStore.getState();

      // Build the request messages from history.
      const history = useChatStore.getState().conversations[conversationId]?.messages ?? [];
      const requestMessages: ChatRequestMessage[] = history
        .filter((m) => !m.error && (m.role === 'user' || m.role === 'assistant'))
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      // Append the new user message.
      const userMessage: ChatMessage = {
        id: nanoid(10),
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      appendMessage(conversationId, userMessage);

      // Append a placeholder assistant message that we'll stream into.
      const assistantId = nanoid(10);
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        streaming: true,
        model: settings.model,
      };
      appendMessage(conversationId, assistantMessage);

      // Kick off the stream.
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      await streamChatCompletion({
        baseURL: settings.baseURL,
        apiKey: settings.apiKey,
        model: settings.model,
        temperature: settings.temperature,
        systemPrompt: settings.systemPrompt,
        messages: [...requestMessages, { role: 'user', content: text }],
        signal: controller.signal,
        onDelta: (delta) => {
          appendDelta(conversationId, assistantId, delta);
        },
        onDone: () => {
          updateMessage(conversationId, assistantId, { streaming: false });
        },
        onError: (err) => {
          if (err.name === 'AbortError') {
            updateMessage(conversationId, assistantId, { streaming: false });
            return;
          }
          markMessageError(conversationId, assistantId, err.message);
        },
      });

      abortRef.current = null;
      setIsStreaming(false);
    },
    [conversationId, appendMessage, appendDelta, updateMessage, markMessageError],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const regenerate = useCallback(async () => {
    if (!conversationId) return;
    const history = useChatStore.getState().conversations[conversationId]?.messages ?? [];
    // Find the last user message; remove everything after it; resend.
    let lastUserIndex = -1;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;
    const lastUser = history[lastUserIndex];
    // Remove all messages after the last user message (the prior assistant reply, etc.)
    const updatedMessages = history.slice(0, lastUserIndex);
    useChatStore.setState((s) => ({
      conversations: {
        ...s.conversations,
        [conversationId]: {
          ...s.conversations[conversationId],
          messages: updatedMessages,
        },
      },
    }));
    await send(lastUser.content);
  }, [conversationId, send]);

  return { send, stop, regenerate, isStreaming };
}
