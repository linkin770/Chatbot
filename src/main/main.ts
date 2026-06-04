import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import path from 'node:path';
import url from 'node:url';

// Get __dirname in ESM compatible way
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In dev, Vite serves the renderer from a local HTTP server. In prod, the
// renderer is bundled to disk and loaded via a file:// URL.
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
// __dirname is .vite/build/ in dev, so go up 2 levels to reach project root
const RENDERER_DIST = path.join(__dirname, '..', '..', 'dist');
const PRELOAD = path.join(__dirname, 'preload.js');

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 880,
    minHeight: 600,
    show: false,
    backgroundColor: '#FFFFFF',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    title: 'Chatbot',
    autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Reveal only once ready to avoid the white flash.
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in the system browser, never inside the app shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------------------------------------------------------------------------
// IPC handlers — a thin set of native bridges the renderer may call. We keep
// the API surface minimal; most logic lives in the renderer.
// ---------------------------------------------------------------------------

ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('app:get-platform', () => process.platform);

ipcMain.handle('dialog:save', async (_e, { defaultPath, content }: { defaultPath: string; content: string }) => {
  const result = await dialog.showSaveDialog({
    title: 'Save conversation',
    defaultPath,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  });
  if (result.canceled || !result.filePath) return { ok: false };
  const fs = await import('node:fs/promises');
  await fs.writeFile(result.filePath, content, 'utf-8');
  return { ok: true, path: result.filePath };
});

/**
 * Fetch the model list from an OpenAI-compatible /models endpoint. Done in
 * the main process because most provider endpoints do not return CORS
 * headers, so the browser would block the request.
 */
ipcMain.handle(
  'models:list',
  async (_e, { baseURL, apiKey }: { baseURL: string; apiKey: string }) => {
    if (!baseURL) {
      return { ok: false, error: 'Missing baseURL' };
    }
    if (!apiKey) {
      return { ok: false, error: 'Missing API key' };
    }
    const base = baseURL.replace(/\/+$/, '');
    const url = base.endsWith('/models') ? base : `${base}/models`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        return { ok: false, error: `${res.status} ${res.statusText}${detail ? `: ${detail.slice(0, 200)}` : ''}` };
      }
      const json = (await res.json()) as { data?: Array<{ id: string }> };
      const models = Array.isArray(json.data)
        ? json.data.map((m) => m.id).filter((id) => typeof id === 'string' && id.length > 0)
        : [];
      return { ok: true, models };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
);
