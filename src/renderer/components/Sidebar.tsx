import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useChatStore } from '../store/chat';
import { useT } from '../i18n';
import {
  IconChatBubble,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconLogo,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTrash,
} from './icons';

interface SidebarProps {
  onOpenSettings: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/**
 * The left rail. Houses the brand, search, "new chat" action, and the
 * scrollable history list. History items support inline rename + delete.
 * The whole panel is keyboard-navigable and uses Linear's "quiet but
 * deliberate" hover treatment.
 */
export function Sidebar({ onOpenSettings, collapsed, onToggleCollapsed }: SidebarProps) {
  const t = useT();
  const conversations = useChatStore((s) => s.conversations);
  const order = useChatStore((s) => s.order);
  const activeId = useChatStore((s) => s.activeId);
  const newConversation = useChatStore((s) => s.newConversation);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const renameConversation = useChatStore((s) => s.renameConversation);
  const settings = useChatStore((s) => s.settings);

  const [query, setQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement | null>(null);
  const [groupsOpen, setGroupsOpen] = useState({ today: true, week: true, older: true });

  useEffect(() => {
    if (renamingId) renameRef.current?.focus();
  }, [renamingId]);

  const list = order
    .map((id) => conversations[id])
    .filter(Boolean)
    .filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()));

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const groups = {
    today: list.filter((c) => now - new Date(c.updatedAt).getTime() < day),
    week: list.filter((c) => {
      const t = now - new Date(c.updatedAt).getTime();
      return t >= day && t < 7 * day;
    }),
    older: list.filter((c) => now - new Date(c.updatedAt).getTime() >= 7 * day),
  };

  const handleNew = () => {
    newConversation();
  };

  const commitRename = (id: string) => {
    if (renameValue.trim()) renameConversation(id, renameValue.trim());
    setRenamingId(null);
    setRenameValue('');
  };

  return (
    <aside
      className={clsx(
        'h-full flex-shrink-0 flex flex-col border-r border-ink-200 bg-ink-75 transition-[width] duration-300 ease-linear',
        collapsed ? 'w-[60px]' : 'w-[280px]',
      )}
    >
      {/* Brand row */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <button
          onClick={onToggleCollapsed}
          className="grid place-items-center h-8 w-8 rounded-md text-ink-600 hover:bg-ink-150 transition-colors"
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          <IconLogo />
        </button>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-tight text-ink-900">{t('sidebar.brand')}</span>
            <span className="text-[11px] text-ink-500">v0.1 · {settings.model || 'no model'}</span>
          </div>
        )}
      </div>

      {/* New chat */}
      <div className="px-3 pb-3">
        <button
          onClick={handleNew}
          className={clsx(
            'group w-full inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white text-[13px] font-medium text-ink-900',
            'hover:border-ink-300 hover:shadow-soft-sm transition-all',
            collapsed ? 'h-10 justify-center' : 'h-10 px-3 justify-between',
          )}
          title={t('sidebar.newChat')}
        >
          <span className="inline-flex items-center gap-2">
            <IconPlus />
            {!collapsed && <span>{t('sidebar.newChat')}</span>}
          </span>
          {!collapsed && <span className="hidden group-hover:inline text-ink-400 text-[11px]">⌘N</span>}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('sidebar.search')}
              className="input pl-8"
            />
          </div>
        </div>
      )}

      {/* History list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {(['today', 'week', 'older'] as const).map((key) =>
          groups[key].length === 0 ? null : (
            <div key={key} className="mt-2">
              {!collapsed && (
                <button
                  onClick={() => setGroupsOpen((g) => ({ ...g, [key]: !g[key] }))}
                  className="w-full flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-500 hover:text-ink-700"
                >
                  {groupsOpen[key] ? <IconChevronDown /> : <IconChevronRight />}
                  {key === 'today' ? t('sidebar.today') : key === 'week' ? t('sidebar.thisWeek') : t('sidebar.older')}
                </button>
              )}
              {groupsOpen[key] && (
                <ul className="flex flex-col">
                  {groups[key].map((conv) => {
                    const isActive = conv.id === activeId;
                    return (
                      <li key={conv.id} className="group relative">
                        {renamingId === conv.id ? (
                          <div className="px-2 py-1.5">
                            <input
                              ref={renameRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => commitRename(conv.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename(conv.id);
                                if (e.key === 'Escape') {
                                  setRenamingId(null);
                                  setRenameValue('');
                                }
                              }}
                              className="w-full rounded-md border border-accent-200 bg-white px-2 py-1 text-[13px] focus:outline-none"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => selectConversation(conv.id)}
                            className={clsx(
                              'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
                              isActive
                                ? 'bg-ink-150 text-ink-900'
                                : 'text-ink-700 hover:bg-ink-100',
                              collapsed && 'justify-center',
                            )}
                            title={conv.title}
                          >
                            <IconChatBubble className="flex-shrink-0 opacity-70" />
                            {!collapsed && (
                              <span className="truncate flex-1">{conv.title}</span>
                            )}
                            {!collapsed && (
                              <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                <IconButton
                                  label={t('sidebar.rename')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingId(conv.id);
                                    setRenameValue(conv.title);
                                  }}
                                >
                                  <IconEdit />
                                </IconButton>
                                <IconButton
                                  label={t('sidebar.delete')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`${t('sidebar.deleteConfirm')} "${conv.title}"?`)) deleteConversation(conv.id);
                                  }}
                                >
                                  <IconTrash />
                                </IconButton>
                              </span>
                            )}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ),
        )}
        {!collapsed && list.length === 0 && (
          <div className="px-3 py-8 text-center text-[12px] text-ink-500">
            {t('sidebar.noConversations')}<br />{t('sidebar.startNew')}
          </div>
        )}
      </div>

      {/* Bottom: settings + meta */}
      <div className="border-t border-ink-200 px-2 py-2">
        <button
          onClick={onOpenSettings}
          className={clsx(
            'w-full inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink-700 hover:bg-ink-100 transition-colors',
            collapsed && 'justify-center',
          )}
          title={t('sidebar.settings')}
        >
          <IconSettings />
          {!collapsed && <span>{t('sidebar.settings')}</span>}
        </button>
        {!collapsed && (
          <div className="mt-1 px-2 text-[11px] text-ink-400 leading-relaxed">
            Press <kbd className="px-1 py-0.5 rounded border border-ink-200 bg-white text-[10px] text-ink-600">⌘K</kbd> {t('sidebar.focusSearch')}
          </div>
        )}
      </div>
    </aside>
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  label: string;
}) {
  return (
    <span
      role="button"
      aria-label={label}
      onClick={onClick}
      className="grid place-items-center h-6 w-6 rounded text-ink-500 hover:text-ink-900 hover:bg-ink-200 transition-colors"
    >
      {children}
    </span>
  );
}
