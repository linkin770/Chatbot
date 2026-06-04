import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chat';
import { useChatStream } from '../hooks/useChatStream';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { IconLogo, IconSparkle } from './icons';
import { useT } from '../i18n';

interface ChatAreaProps {
  conversationId: string | null;
}

export function ChatArea({ conversationId }: ChatAreaProps) {
  const conversation = useChatStore((s) =>
    conversationId ? s.conversations[conversationId] : null,
  );
  const settings = useChatStore((s) => s.settings);

  const { send, stop, regenerate, isStreaming } = useChatStream(conversationId);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the bottom when messages grow. Only auto-scroll when the
  // user is already near the bottom (avoids fighting manual scroll) and use
  // a single rAF tick to batch the scroll (cheaper on Kirin 9000C).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      const raf = requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [conversation?.messages?.length, conversation?.messages?.at(-1)?.content]);

  if (!conversationId) {
    return (
      <EmptyState
        onStart={() => {
          // The parent decides; this state shouldn't fire if a conversation
          // is always auto-created on mount, but we keep a graceful fallback.
        }}
      />
    );
  }

  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;
  // Find the last assistant message (findLast is ES2023 — not in our lib target).
  let lastAssistant: typeof messages[number] | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistant = messages[i];
      break;
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollbarGutter: 'stable' }}
      >
        {!hasMessages && <Greeting onSend={send} disabled={!settings.apiKey} />}

        <div className="max-w-3xl mx-auto py-6">
          {messages.map((m, idx) => (
            <MessageBubble
              key={m.id}
              message={m}
              isLast={idx === messages.length - 1}
              onRegenerate={regenerate}
              onStop={stop}
            />
          ))}

          {/* Show typing indicator only when the last assistant message is empty + streaming */}
          {isStreaming && lastAssistant && lastAssistant.content === '' && (
            <div className="max-w-3xl mx-auto px-6 -mt-3">
              <TypingIndicator />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Greeting({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const t = useT();
  const suggestions = [
    t('suggest.1'),
    t('suggest.2'),
    t('suggest.3'),
    t('suggest.4'),
  ];
  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-accent-500 to-ink-900 text-white mb-5 shadow-soft">
          <IconLogo />
        </div>
        <h2
          className="text-[34px] leading-[1.1] tracking-[-0.02em] text-ink-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('chat.greeting')}
        </h2>
        <p className="mt-3 text-[14.5px] text-ink-600 max-w-md mx-auto leading-relaxed">
          {t('chat.subtitle')}
        </p>

        {disabled && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-75 px-3 py-2 text-[12.5px] text-ink-700">
            <IconSparkle />
            {t('chat.noApiKey')} <strong className="font-semibold">{t('chat.noApiKey2')}</strong> {t('chat.noApiKey3')}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s)}
              className="group rounded-xl border border-ink-200 bg-white p-3.5 text-[13px] text-ink-800 hover:border-ink-300 hover:shadow-soft-sm transition-all text-left"
            >
              <span className="block text-[10.5px] uppercase tracking-[0.08em] text-ink-400 mb-1.5">
                {t('chat.suggestions')}
              </span>
              <span className="block leading-relaxed">{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStart: _ }: { onStart: () => void }) {
  const t = useT();
  return (
    <div className="flex-1 grid place-items-center text-ink-500 text-sm">
      {t('chat.emptyState')}
    </div>
  );
}
