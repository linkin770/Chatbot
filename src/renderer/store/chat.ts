import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { AppSettings, ChatMessage, Conversation } from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/types';

interface ChatState {
  conversations: Record<string, Conversation>;
  /** Conversation id ordering — newest first. */
  order: string[];
  activeId: string | null;
  settings: AppSettings;
  // Hydration flag — useful to avoid showing stale UI before persist loaded.
  hydrated: boolean;

  // Conversation actions
  newConversation: () => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  clearAll: () => void;

  // Message actions
  appendMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  appendDelta: (conversationId: string, messageId: string, delta: string) => void;
  markMessageError: (conversationId: string, messageId: string, error: string) => void;

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void;
  setHydrated: () => void;
}

const createConversation = (): Conversation => {
  const now = new Date().toISOString();
  return {
    id: nanoid(10),
    title: 'New conversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
};

const sortByUpdated = (order: string[], convs: Record<string, Conversation>) =>
  [...order].sort((a, b) => {
    const ta = convs[a]?.updatedAt ?? '';
    const tb = convs[b]?.updatedAt ?? '';
    return tb.localeCompare(ta);
  });

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},
      order: [],
      activeId: null,
      settings: DEFAULT_SETTINGS,
      hydrated: false,

      newConversation: () => {
        const conv = createConversation();
        set((s) => ({
          conversations: { ...s.conversations, [conv.id]: conv },
          order: [conv.id, ...s.order],
          activeId: conv.id,
        }));
        return conv.id;
      },

      selectConversation: (id) => set({ activeId: id }),

      deleteConversation: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.conversations;
          const order = s.order.filter((x) => x !== id);
          const activeId = s.activeId === id ? order[0] ?? null : s.activeId;
          return { conversations: rest, order, activeId };
        }),

      renameConversation: (id, title) =>
        set((s) => {
          const conv = s.conversations[id];
          if (!conv) return s;
          return {
            conversations: {
              ...s.conversations,
              [id]: { ...conv, title: title.trim() || conv.title, updatedAt: new Date().toISOString() },
            },
          };
        }),

      clearAll: () => set({ conversations: {}, order: [], activeId: null }),

      appendMessage: (conversationId, message) =>
        set((s) => {
          const conv = s.conversations[conversationId];
          if (!conv) return s;
          const next: Conversation = {
            ...conv,
            messages: [...conv.messages, message],
            updatedAt: new Date().toISOString(),
          };
          // Auto-title from the first user message.
          let title = conv.title;
          if (conv.title === 'New conversation' && message.role === 'user') {
            title = message.content.slice(0, 40) + (message.content.length > 40 ? '…' : '');
            next.title = title;
          }
          return {
            conversations: { ...s.conversations, [conversationId]: next },
            order: sortByUpdated([conversationId, ...s.order.filter((x) => x !== conversationId)], {
              ...s.conversations,
              [conversationId]: next,
            }),
          };
        }),

      updateMessage: (conversationId, messageId, patch) =>
        set((s) => {
          const conv = s.conversations[conversationId];
          if (!conv) return s;
          return {
            conversations: {
              ...s.conversations,
              [conversationId]: {
                ...conv,
                messages: conv.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      appendDelta: (conversationId, messageId, delta) =>
        set((s) => {
          const conv = s.conversations[conversationId];
          if (!conv) return s;
          return {
            conversations: {
              ...s.conversations,
              [conversationId]: {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === messageId ? { ...m, content: m.content + delta } : m,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      markMessageError: (conversationId, messageId, error) =>
        get().updateMessage(conversationId, messageId, { error, streaming: false }),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'chatbot-state-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        conversations: s.conversations,
        order: s.order,
        activeId: s.activeId,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
