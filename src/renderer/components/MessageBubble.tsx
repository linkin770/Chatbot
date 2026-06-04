import { memo, useState } from 'react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { formatTime } from '../lib/time';
import { useT } from '../i18n';
import { IconCheck, IconCopy, IconRefresh, IconStop, IconLogo, IconUser } from './icons';
import type { ChatMessage } from '../../shared/types';

interface MessageBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  onRegenerate: () => void;
  onStop: () => void;
}

// Custom equality: streaming messages change every token (content + streaming
// flag flip), so we need to actually compare content. Other fields are stable
// once a message is sent.
function messageBubblePropsEqual(
  prev: MessageBubbleProps,
  next: MessageBubbleProps,
) {
  return (
    prev.message === next.message ||
    (prev.message.id === next.message.id &&
      prev.message.content === next.message.content &&
      prev.message.streaming === next.message.streaming &&
      prev.message.error === next.message.error &&
      prev.isLast === next.isLast &&
      prev.onRegenerate === next.onRegenerate &&
      prev.onStop === next.onStop)
  );
}

export const MessageBubble = memo(function MessageBubble({ message, isLast, onRegenerate, onStop }: MessageBubbleProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  // Render-time check (no effect needed for content shifts).
  return (
    <article
      className={clsx(
        'group w-full flex gap-3 px-4 sm:px-6 py-5',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <Avatar variant="assistant" />
      )}

      <div
        className={clsx(
          'flex flex-col max-w-[78%] min-w-0',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={clsx(
            'rounded-2xl px-4 py-3 text-[14.5px] leading-[1.7] tracking-[-0.003em]',
            'border transition-colors',
            isUser
              ? 'bg-ink-100 border-transparent text-ink-900 rounded-tr-md'
              : 'bg-white border-ink-200 text-ink-900 rounded-tl-md shadow-soft-sm',
            message.error && 'border-danger/30 bg-danger-soft',
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <MarkdownView content={message.content} streaming={!!message.streaming} />
          )}
          {message.error && (
            <div className="mt-2 text-[12px] text-danger flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-danger" />
              {message.error}
            </div>
          )}
        </div>

        {/* Meta + actions */}
        <div
          className={clsx(
            'mt-1.5 flex items-center gap-2 text-[11px] text-ink-500',
            isUser ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {!isUser && message.model && <span>· {message.model}</span>}

          {/* Action row, revealed on hover. Linear keeps these ghostly. */}
          <div
            className={clsx(
              'flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
              isLast && message.streaming && 'opacity-100',
            )}
          >
            <ActionButton onClick={handleCopy} title={t('msg.copy')}>
              {copied ? <IconCheck /> : <IconCopy />}
            </ActionButton>
            {!isUser && isLast && !message.streaming && (
              <ActionButton onClick={onRegenerate} title={t('msg.regenerate')}>
                <IconRefresh />
              </ActionButton>
            )}
            {!isUser && isLast && message.streaming && (
              <ActionButton onClick={onStop} title={t('msg.stop')}>
                <IconStop />
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      {isUser && <Avatar variant="user" />}
    </article>
  );
}, messageBubblePropsEqual);

function Avatar({ variant }: { variant: 'user' | 'assistant' }) {
  return (
    <div
      className={clsx(
        'flex-shrink-0 h-7 w-7 rounded-md grid place-items-center mt-0.5',
        variant === 'assistant'
          ? 'bg-gradient-to-br from-accent-500 to-ink-900 text-white'
          : 'bg-ink-150 text-ink-700 border border-ink-200',
      )}
    >
      {variant === 'assistant' ? <IconLogo /> : <IconUser />}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid place-items-center h-6 w-6 rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-150 transition-colors"
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Markdown renderer — a focused, opinionated wrapper around react-markdown. */
/*  During streaming we skip the expensive parser/highlighter and just render */
/*  plain text. We only re-parse with the full pipeline once streaming ends.  */
/* -------------------------------------------------------------------------- */

function MarkdownView({ content, streaming }: { content: string; streaming: boolean }) {
  // While streaming, render plain text. The full pipeline is rerun on the
  // final content after streaming completes — this avoids parsing markdown +
  // running rehype-highlight on every token (very slow on Kirin 9000C).
  if (streaming) {
    return (
      <div className="prose-chat streaming-caret whitespace-pre-wrap break-words">
        {content}
      </div>
    );
  }
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <CodeBlock>
              <pre>{children}</pre>
            </CodeBlock>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  // The react-markdown v9 signature wraps the code in a <pre><code> pair. We
  // dig in for the language label.
  let language: string | null = null;
  let text = '';
  const child = (children as any)?.props?.children;
  if (child?.props?.className) {
    const m = /language-(\w+)/.exec(child.props.className);
    if (m) language = m[1];
  }
  // Pull raw text for the copy button by walking the rendered tree shallowly.
  try {
    text = extractText(children);
  } catch {
    /* ignore */
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="my-3">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-ink-200 bg-ink-75 rounded-t-[10px]">
        <span className="text-[10.5px] uppercase tracking-[0.08em] text-ink-500 font-medium">
          {language || t('msg.code')}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[10.5px] text-ink-500 hover:text-ink-900 transition-colors"
        >
          {copied ? <IconCheck /> : <IconCopy />}
          {copied ? t('msg.copied') : t('msg.copy')}
        </button>
      </div>
      <div className="rounded-b-[10px] overflow-hidden bg-ink-75">{children}</div>
    </div>
  );
}

function extractText(node: any): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node?.props?.children) return extractText(node.props.children);
  return '';
}

/* -------------------------------------------------------------------------- */
/*  Typing indicator — used while we're waiting for the first streamed delta. */
/* -------------------------------------------------------------------------- */

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1 text-ink-500">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
      <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse-soft" style={{ animationDelay: '180ms' }} />
      <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse-soft" style={{ animationDelay: '360ms' }} />
    </div>
  );
}
