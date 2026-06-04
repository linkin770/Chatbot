import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useChatStore } from '../store/chat';
import { DEFAULT_SETTINGS, type AppSettings, type SavedModel } from '../../shared/types';
import { IconAlert, IconCheck, IconClose, IconLogo } from './icons';
import { useT } from '../i18n';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-over settings panel. We deliberately keep the panel narrow and
 * light-on-light — it should feel like a continuation of the page, not a
 * different app.
 */
export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const t = useT();
  const settings = useChatStore((s) => s.settings);
  const updateSettings = useChatStore((s) => s.updateSettings);
  const clearAll = useChatStore((s) => s.clearAll);

  const [draft, setDraft] = useState<AppSettings>(settings);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showKeyInModal, setShowKeyInModal] = useState(false);
  const [editingModel, setEditingModel] = useState<SavedModel | 'new' | null>(null);
  const [modalDraft, setModalDraft] = useState<{ baseURL: string; apiKey: string; model: string }>({
    baseURL: '',
    apiKey: '',
    model: '',
  });
  const [fetchedModels, setFetchedModels] = useState<string[] | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pickingModel, setPickingModel] = useState(false);
  const modalPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings, open]);

  useEffect(() => {
    if (!pickingModel) return;
    const onDoc = (e: MouseEvent) => {
      if (modalPickerRef.current && !modalPickerRef.current.contains(e.target as Node)) {
        setPickingModel(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [pickingModel]);

  useEffect(() => {
    if (!open) {
      setEditingModel(null);
      setFetchedModels(null);
      setFetchError(null);
      setPickingModel(false);
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const save = () => {
    updateSettings(draft);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 1600);
  };

  const presets = [
    { label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    { label: 'OpenAI', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    { label: 'Moonshot', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
    { label: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
    { label: 'Ollama (local)', baseURL: 'http://localhost:11434/v1', model: 'llama3.1' },
  ];

  const fetchModels = async () => {
    setFetchError(null);
    if (!modalDraft.baseURL.trim() || !modalDraft.apiKey.trim()) {
      setFetchError(t('settings.fetchModelsMissing'));
      setFetchedModels(null);
      return;
    }
    setFetchingModels(true);
    try {
      const res = await window.chatbot.listModels({
        baseURL: modalDraft.baseURL.trim(),
        apiKey: modalDraft.apiKey.trim(),
      });
      if (res.ok) {
        setFetchedModels(res.models);
        setPickingModel(true);
      } else {
        setFetchedModels(null);
        setFetchError(res.error);
      }
    } catch (err) {
      setFetchedModels(null);
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setFetchingModels(false);
    }
  };

  const openNewModelModal = () => {
    setModalDraft({
      baseURL: settings.baseURL || '',
      apiKey: settings.apiKey || '',
      model: '',
    });
    setFetchedModels(null);
    setFetchError(null);
    setPickingModel(false);
    setShowKeyInModal(false);
    setEditingModel('new');
  };

  const openEditModelModal = (m: SavedModel) => {
    setModalDraft({
      baseURL: m.baseURL,
      // API key for a saved model is not persisted with the model itself;
      // fall back to the current API key so the user can still re-fetch.
      apiKey: settings.apiKey || '',
      model: m.name,
    });
    setFetchedModels(null);
    setFetchError(null);
    setPickingModel(false);
    setShowKeyInModal(false);
    setEditingModel(m);
  };

  const closeModal = () => {
    setEditingModel(null);
    setFetchedModels(null);
    setFetchError(null);
    setPickingModel(false);
  };

  /** Persist whatever's in the modal into the saved-models repository. */
  const commitModal = () => {
    const name = modalDraft.model.trim();
    const baseURL = modalDraft.baseURL.trim();
    if (!name) return;
    const savedModels = settings.savedModels ?? [];
    if (editingModel && editingModel !== 'new') {
      // Edit: replace the existing entry, keep position if possible.
      const idx = savedModels.findIndex(
        (m) => m.name === editingModel.name && m.baseURL === editingModel.baseURL,
      );
      const updated: SavedModel = {
        id: name,
        name,
        baseURL,
        savedAt: new Date().toISOString(),
      };
      const next =
        idx >= 0
          ? savedModels.map((m, i) => (i === idx ? updated : m))
          : [updated, ...savedModels];
      // Also write the api key into the active settings if the user typed a new one.
      const newApiKey = modalDraft.apiKey.trim() || settings.apiKey;
      updateSettings({ savedModels: next.slice(0, 50), model: name, baseURL, apiKey: newApiKey });
    } else {
      // New: insert, de-duplicate by (name, baseURL).
      const filtered = savedModels.filter(
        (m) => !(m.name === name && m.baseURL === baseURL),
      );
      const next: SavedModel = {
        id: name,
        name,
        baseURL,
        savedAt: new Date().toISOString(),
      };
      const newApiKey = modalDraft.apiKey.trim() || settings.apiKey;
      updateSettings({
        savedModels: [next, ...filtered].slice(0, 50),
        model: name,
        baseURL,
        apiKey: newApiKey,
      });
    }
    closeModal();
  };

  const pickAndSaveModel = (name: string) => {
    // Selecting from the dropdown also writes back into the modal input.
    setModalDraft({ ...modalDraft, model: name });
    setPickingModel(false);
  };

  const removeSavedModel = (m: SavedModel) => {
    const next = (settings.savedModels ?? []).filter(
      (x) => !(x.name === m.name && x.baseURL === m.baseURL),
    );
    updateSettings({ savedModels: next });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/20"
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white border-l border-ink-200 shadow-soft-lg flex flex-col">
        <header className="flex items-center justify-between px-6 h-14 border-b border-ink-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <IconLogo />
            <h2 className="text-[14px] font-semibold tracking-tight text-ink-900">{t('settings.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center h-8 w-8 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors"
            title={t('settings.close')}
          >
            <IconClose />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          <section>
            <SectionHeader
              title={t('settings.api')}
              description={t('settings.apiDesc')}
            />

            <div className="space-y-4">
              <Field label={t('settings.baseURL')} hint={t('settings.baseURLHint')}>
                <input
                  className="input"
                  value={draft.baseURL}
                  onChange={(e) => setDraft({ ...draft, baseURL: e.target.value })}
                  placeholder="https://api.deepseek.com/v1"
                  spellCheck={false}
                />
              </Field>

              <Field label={t('settings.apiKey')} hint={t('settings.apiKeyHint')}>
                <div className="relative">
                  <input
                    className="input pr-16 font-mono text-[12.5px]"
                    type={showKey ? 'text' : 'password'}
                    value={draft.apiKey}
                    onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                    placeholder="sk-…"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-500 hover:text-ink-900 px-1.5 py-0.5 rounded"
                  >
                    {showKey ? t('settings.hide') : t('settings.show')}
                  </button>
                </div>
              </Field>

              <Field label={t('settings.model')} hint={t('settings.modelHint')}>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-[13px] text-ink-900 truncate font-mono">
                    {draft.model || <span className="text-ink-400">—</span>}
                  </span>
                  <button
                    type="button"
                    onClick={openNewModelModal}
                    className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-[12px] text-ink-700 hover:border-ink-300 hover:text-ink-900 transition-colors"
                  >
                    <span aria-hidden>＋</span>
                    {t('settings.modelNew')}
                  </button>
                </div>
              </Field>

              <Field label={t('settings.temperature')} hint={`${draft.temperature.toFixed(2)} — ${t('settings.temperatureHint')}`}> 
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={draft.temperature}
                  onChange={(e) => setDraft({ ...draft, temperature: Number(e.target.value) })}
                  className="w-full accent-ink-900"
                />
              </Field>
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-500 mb-2">{t('settings.presets')}</p>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() =>
                      setDraft({ ...draft, baseURL: p.baseURL, model: p.model })
                    }
                    className="chip hover:border-ink-300 hover:text-ink-900 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  key="__custom__"
                  onClick={() => setDraft({ ...draft, baseURL: '', model: '' })}
                  className="chip border-dashed border-ink-300 text-ink-600 hover:border-ink-900 hover:text-ink-900 transition-colors"
                  title={t('settings.presetCustomHint')}
                >
                  {t('settings.presetCustom')}
                </button>
              </div>
            </div>

            {/* Saved-models repository */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-ink-500">
                  {t('settings.savedModels')}
                </p>
                <button
                  type="button"
                  onClick={openNewModelModal}
                  className="text-[11.5px] text-ink-600 hover:text-ink-900 inline-flex items-center gap-1"
                >
                  <span aria-hidden>＋</span>
                  {t('settings.modelNew')}
                </button>
              </div>
              {(settings.savedModels ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-ink-200 px-3 py-3 text-[12px] text-ink-500">
                  {t('settings.savedModelsEmpty')}
                </p>
              ) : (
                <ul className="rounded-lg border border-ink-200 divide-y divide-ink-200 bg-white">
                  {(settings.savedModels ?? []).map((m) => {
                    const active =
                      m.name === draft.model && m.baseURL === draft.baseURL;
                    return (
                      <li
                        key={`${m.baseURL}::${m.name}`}
                        className={clsx(
                          'group flex items-center gap-2 px-3 py-2',
                          active && 'bg-ink-75',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, model: m.name, baseURL: m.baseURL })}
                          className="flex-1 min-w-0 text-left"
                          title={t('settings.useThisModel')}
                        >
                          <div
                            className={clsx(
                              'text-[12.5px] truncate',
                              active ? 'text-ink-900 font-medium' : 'text-ink-800',
                            )}
                          >
                            {m.name}
                          </div>
                          <div className="text-[10.5px] text-ink-400 truncate">
                            {m.baseURL.replace(/^https?:\/\//, '')}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModelModal(m)}
                          className="opacity-60 group-hover:opacity-100 text-ink-500 hover:text-ink-900 text-[11.5px] px-1.5 py-0.5 rounded"
                          title={t('settings.modelEdit')}
                        >
                          {t('settings.modelEdit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSavedModel(m)}
                          className="opacity-60 group-hover:opacity-100 text-ink-500 hover:text-danger text-[14px] leading-none px-1.5 py-0.5 rounded"
                          title={t('settings.removeSaved')}
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section>
            <SectionHeader
              title={t('settings.systemPrompt')}
              description={t('settings.systemPromptDesc')}
            />
            <textarea
              className="input min-h-[88px] py-2 leading-relaxed"
              value={draft.systemPrompt}
              onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
              placeholder={t('settings.systemPromptPlaceholder')}
            />
          </section>

          <section>
            <SectionHeader
              title={t('settings.appearance')}
              description={t('settings.appearanceDesc')}
            />
            <div className="rounded-xl border border-ink-200 bg-ink-75 p-3.5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent-500 to-ink-900" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-ink-900">{t('settings.light')}</p>
                <p className="text-[11.5px] text-ink-500">
                  {t('settings.lightDesc')}
                </p>
              </div>
              <span className="chip">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                {t('settings.active')}
              </span>
            </div>
          </section>

          <section>
            <SectionHeader
              title={t('settings.language')}
              description={t('settings.languageDesc')}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDraft({ ...draft, lang: draft.lang === 'zh' ? 'en' : 'zh' })}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 hover:border-ink-300 hover:shadow-soft-sm transition-all"
              >
                {draft.lang === 'zh' ? 'English' : '中文'}
                <span className="text-[11px] text-ink-400">
                  {draft.lang === 'zh' ? t('settings.switchToEn') : t('settings.switchToZh')}
                </span>
              </button>
              {draft.lang === 'zh' && (
                <span className="chip">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                  {t('settings.active')}
                </span>
              )}
            </div>
          </section>

          <section>
            <SectionHeader
              title={t('settings.data')}
              description={t('settings.dataDesc')}
            />
            <button
              onClick={() => {
                if (confirm(t('settings.clearAllConfirm'))) {
                  clearAll();
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-[12.5px] text-ink-700 hover:border-danger/40 hover:text-danger transition-colors"
            >
              <IconAlert />
              {t('settings.clearAll')}
            </button>
          </section>
        </div>

        <footer className="border-t border-ink-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="text-[11.5px] text-ink-500 flex items-center gap-1.5">
            {savedAt && (
              <>
                <IconCheck className="text-emerald-600" />
                <span>{t('settings.saved')}</span>
              </>
            )}
            {!savedAt && dirty && <span>{t('settings.unsaved')}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDraft(DEFAULT_SETTINGS)}
              className="btn btn-ghost"
            >
              {t('settings.reset')}
            </button>
            <button
              onClick={save}
              disabled={!dirty}
              className={clsx('btn', dirty ? 'btn-primary' : 'opacity-40 cursor-not-allowed bg-ink-100 text-ink-500')}
            >
              {t('settings.saveChanges')}
            </button>
          </div>
        </footer>
      </div>

      {/* Model repository modal — only mounted while a model is being created/edited. */}
      {editingModel && (
        <ModelRepositoryModal
          isNew={editingModel === 'new'}
          modalDraft={modalDraft}
          setModalDraft={setModalDraft}
          fetchedModels={fetchedModels}
          fetchingModels={fetchingModels}
          fetchError={fetchError}
          pickingModel={pickingModel}
          setPickingModel={setPickingModel}
          pickerRef={modalPickerRef}
          showKey={showKeyInModal}
          setShowKey={setShowKeyInModal}
          onFetch={fetchModels}
          onPickModel={pickAndSaveModel}
          onCommit={commitModal}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ModelRepositoryModal                                                       */
/* -------------------------------------------------------------------------- */

interface ModelRepositoryModalProps {
  isNew: boolean;
  modalDraft: { baseURL: string; apiKey: string; model: string };
  setModalDraft: (d: { baseURL: string; apiKey: string; model: string }) => void;
  fetchedModels: string[] | null;
  fetchingModels: boolean;
  fetchError: string | null;
  pickingModel: boolean;
  setPickingModel: (v: boolean) => void;
  pickerRef: React.MutableRefObject<HTMLDivElement | null>;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
  onFetch: () => void;
  onPickModel: (name: string) => void;
  onCommit: () => void;
  onClose: () => void;
}

function ModelRepositoryModal({
  isNew,
  modalDraft,
  setModalDraft,
  fetchedModels,
  fetchingModels,
  fetchError,
  pickingModel,
  setPickingModel,
  pickerRef,
  showKey,
  setShowKey,
  onFetch,
  onPickModel,
  onCommit,
  onClose,
}: ModelRepositoryModalProps) {
  const t = useT();

  return (
    <div className="absolute inset-0 z-10">
      {/* Backdrop covers the settings panel, not the whole window, so the
          user can still see they are inside the settings dialog. */}
      <button
        aria-label="Close model editor"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/10"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white border-l border-ink-200 shadow-soft-lg flex flex-col">
        <header className="flex items-center justify-between px-6 h-14 border-b border-ink-200 flex-shrink-0">
          <h2 className="text-[14px] font-semibold tracking-tight text-ink-900">
            {isNew ? t('settings.modelNew') : t('settings.modelEdit')}
          </h2>
          <button
            onClick={onClose}
            className="grid place-items-center h-8 w-8 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors"
            title={t('settings.close')}
          >
            <IconClose />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <p className="text-[12px] text-ink-500 leading-relaxed">
            {t('settings.modelModalDesc')}
          </p>

          <Field label={t('settings.baseURL')} hint={t('settings.baseURLHint')}>
            <input
              className="input"
              value={modalDraft.baseURL}
              onChange={(e) => setModalDraft({ ...modalDraft, baseURL: e.target.value })}
              placeholder="https://api.siliconflow.cn/v1"
              spellCheck={false}
            />
          </Field>

          <Field label={t('settings.apiKey')} hint={t('settings.apiKeyHint')}>
            <div className="relative">
              <input
                className="input pr-16 font-mono text-[12.5px]"
                type={showKey ? 'text' : 'password'}
                value={modalDraft.apiKey}
                onChange={(e) => setModalDraft({ ...modalDraft, apiKey: e.target.value })}
                placeholder="sk-…"
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-500 hover:text-ink-900 px-1.5 py-0.5 rounded"
              >
                {showKey ? t('settings.hide') : t('settings.show')}
              </button>
            </div>
          </Field>

          <Field label={t('settings.model')} hint={t('settings.modelHint')}>
            <div ref={pickerRef} className="relative">
              <div className="flex gap-1.5">
                <input
                  className="input flex-1"
                  value={modalDraft.model}
                  onChange={(e) => setModalDraft({ ...modalDraft, model: e.target.value })}
                  onFocus={() => {
                    if (fetchedModels && fetchedModels.length > 0) setPickingModel(true);
                  }}
                  placeholder="deepseek-ai/DeepSeek-V4-Pro"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={onFetch}
                  disabled={fetchingModels}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 text-[12px] text-ink-700 hover:border-ink-300 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={t('settings.fetchModels')}
                >
                  {fetchingModels ? (
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-ink-300 border-t-ink-900 animate-spin" />
                  ) : (
                    <span aria-hidden>↻</span>
                  )}
                  {t('settings.fetchModels')}
                </button>
              </div>

              {pickingModel && fetchedModels && fetchedModels.length > 0 && (
                <div className="absolute z-10 left-0 right-12 mt-1 max-h-64 overflow-y-auto rounded-md border border-ink-200 bg-white shadow-soft-lg">
                  {fetchedModels.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onPickModel(m)}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-[12.5px] hover:bg-ink-100',
                        m === modalDraft.model
                          ? 'text-ink-900 font-medium bg-ink-75'
                          : 'text-ink-700',
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {fetchError && (
                <p className="mt-1.5 text-[11.5px] text-danger">{fetchError}</p>
              )}
            </div>
          </Field>
        </div>

        <footer className="flex-shrink-0 border-t border-ink-200 px-6 py-3 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-700 hover:border-ink-300 hover:text-ink-900 transition-colors"
          >
            {t('settings.cancel')}
          </button>
          <button
            onClick={onCommit}
            disabled={!modalDraft.model.trim() || !modalDraft.baseURL.trim()}
            className={clsx(
              'btn btn-primary',
              (!modalDraft.model.trim() || !modalDraft.baseURL.trim()) &&
                'opacity-40 cursor-not-allowed bg-ink-100 text-ink-500',
            )}
          >
            {t('settings.modelSave')}
          </button>
        </footer>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">{title}</h3>
      <p className="text-[12px] text-ink-500 mt-0.5 leading-relaxed">{description}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-ink-800 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-ink-500 mt-1.5 leading-relaxed">{hint}</span>}
    </label>
  );
}
