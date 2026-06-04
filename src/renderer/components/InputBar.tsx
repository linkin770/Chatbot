import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import clsx from 'clsx';
import { useChatStore } from '../store/chat';
import { useChatStream } from '../hooks/useChatStream';
import { useT } from '../i18n';
import { IconArrowUp, IconChevronDown, IconPaperclip, IconStop } from './icons';

interface InputBarProps {
  conversationId: string | null;
}

/**
 * The composer at the bottom of the chat. Linear-style: rounded, paper-white,
 * inset shadow that lifts on focus, no harsh borders.
 */
export function InputBar({ conversationId }: InputBarProps) {
  const t = useT();
  const settings = useChatStore((s) => s.settings);
  const updateSettings = useChatStore((s) => s.updateSettings);
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const { send, stop, isStreaming } = useChatStream(conversationId);

  // Auto-grow the textarea up to a sensible max height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  // Close the model picker when clicking outside.
  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [pickerOpen]);

  const submit = () => {
    const text = value.trim();
    if (!text || isStreaming) return;
    if (!settings.apiKey) {
      // Surface a hint by pulsing the API key requirement.
      alert(t('chat.noApiKey') + t('chat.noApiKey2') + t('chat.noApiKey3'));
      return;
    }
    setValue('');
    void send(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const hasText = value.trim().length > 0;
  const disabled = !conversationId;

  const savedModels = settings.savedModels ?? [];
  const currentName = settings.model || t('input.noModel');
  const hasNoModel = !settings.model;

  const selectSavedModel = (name: string, baseURL: string) => {
    updateSettings({ model: name, baseURL });
    setPickerOpen(false);
  };

  const removeSavedModel = (name: string, baseURL: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = savedModels.filter((m) => !(m.name === name && m.baseURL === baseURL));
    updateSettings({ savedModels: next });
  };

  return (
    <div className="flex-shrink-0 px-4 sm:px-6 pb-5 pt-2">
      <div
        className={clsx(
          'relative max-w-3xl mx-auto rounded-2xl border border-ink-200 bg-white shadow-soft-sm',
          hasText && 'shadow-soft',
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          placeholder={disabled ? t('input.startNewChat') : t('input.placeholder')}
          className={clsx(
            'block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[14.5px] leading-[1.6] text-ink-900',
            'placeholder:text-ink-500 focus:outline-none',
          )}
        />

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <ToolbarButton label={t('input.attach')} disabled>
              <IconPaperclip />
            </ToolbarButton>
            <span className="hidden sm:inline text-[11px] text-ink-400 ml-1">
              {t('input.placeholder')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div ref={pickerRef} className="relative">
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] transition-colors',
                  hasNoModel
                    ? 'text-amber-700 bg-amber-50 border border-amber-200 hover:border-amber-300'
                    : 'text-ink-700 border border-transparent hover:bg-ink-100',
                )}
                title={t('input.modelPicker')}
              >
                <span className="font-mono truncate max-w-[140px]">{currentName}</span>
                <IconChevronDown />
              </button>

              {pickerOpen && (
                <div className="absolute z-20 right-0 bottom-full mb-1.5 w-72 max-h-72 overflow-y-auto rounded-md border border-ink-200 bg-white shadow-soft-lg">
                  <p className="px-3 pt-2 pb-1 text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
                    {t('settings.savedModels')}
                  </p>
                  {savedModels.length === 0 ? (
                    <p className="px-3 pb-3 text-[12px] text-ink-500">
                      {t('input.noSavedModels')}
                    </p>
                  ) : (
                    savedModels.map((m) => {
                      const active =
                        m.name === settings.model && m.baseURL === settings.baseURL;
                      return (
                        <div
                          key={`${m.baseURL}::${m.name}`}
                          className={clsx(
                            'group flex items-center gap-1 px-1.5 py-0.5 mx-1.5 rounded hover:bg-ink-100',
                            active && 'bg-ink-75',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => selectSavedModel(m.name, m.baseURL)}
                            className="flex-1 text-left py-1 min-w-0"
                          >
                            <div className={clsx('text-[12.5px] truncate', active ? 'text-ink-900 font-medium' : 'text-ink-800')}>
                              {m.name}
                            </div>
                            <div className="text-[10.5px] text-ink-400 truncate">
                              {m.baseURL.replace(/^https?:\/\//, '')}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => removeSavedModel(m.name, m.baseURL, e)}
                            className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-danger text-[14px] leading-none px-1.5"
                            title={t('settings.removeSaved')}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {isStreaming ? (
              <button
                onClick={stop}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 text-white px-3 py-1.5 text-[13px] font-medium hover:bg-ink-800 transition-colors"
                title={t('msg.stop')}
              >
                <IconStop />
                <span>{t('msg.stop')}</span>
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!hasText || disabled}
                className={clsx(
                  'inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all',
                  hasText
                    ? 'bg-ink-900 text-white hover:bg-ink-800 shadow-soft-sm'
                    : 'bg-ink-100 text-ink-400 cursor-not-allowed',
                )}
                title="Send (Enter)"
              >
                <IconArrowUp />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-ink-400">
        Responses are generated by your configured model. Verify important info.
      </p>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500',
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-ink-100 hover:text-ink-900',
        'transition-colors',
      )}
    >
      {children}
    </button>
  );
}
