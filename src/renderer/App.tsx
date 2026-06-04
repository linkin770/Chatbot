import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputBar } from './components/InputBar';
import { SettingsPanel } from './components/SettingsPanel';
import { ToastHost, useToastStore } from './components/Toast';
import { useChatStore } from './store/chat';
import { useT } from './i18n';

/**
 * Application shell. Three columns: sidebar, chat area (header + scroll
 * region), input bar. The settings panel is an overlay.
 */
export default function App() {
  const t = useT();
  const hydrated = useChatStore((s) => s.hydrated);
  const activeId = useChatStore((s) => s.activeId);
  const newConversation = useChatStore((s) => s.newConversation);
  const order = useChatStore((s) => s.order);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const lang = useChatStore((s) => s.settings.lang);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pushToast = useToastStore((s) => s.push);

  // Apply language attribute for font switching
  useEffect(() => {
    document.documentElement.setAttribute('data-lang', lang || 'en');
  }, [lang]);

  // Auto-create a starter conversation if the user opens a fresh install.
  useEffect(() => {
    if (hydrated && !activeId && order.length === 0) {
      newConversation();
    }
  }, [hydrated, activeId, order.length, newConversation]);

  // Global keyboard shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newConversation();
        pushToast(t('common.newConversation'), 'success');
      }
      if (isMeta && e.key.toLowerCase() === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }
      if (isMeta && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarCollapsed((v) => !v);
      }
      if (isMeta && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        // Re-select the first conversation
        if (order.length > 0) selectConversation(order[0]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [newConversation, pushToast, order, selectConversation]);

  if (!hydrated) {
    return (
      <div className="h-full w-full grid place-items-center text-ink-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-500 to-ink-900" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex bg-white text-ink-900">
      <Sidebar
        onOpenSettings={() => setSettingsOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatArea conversationId={activeId} />
        <InputBar conversationId={activeId} />
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ToastHost />
    </div>
  );
}
