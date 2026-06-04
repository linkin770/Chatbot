const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get paths relative to this script
const PROJECT_ROOT = __dirname;
const electronPath = path.join(PROJECT_ROOT, 'node_modules/electron/dist/electron');
const mainPath = path.join(PROJECT_ROOT, '.vite/build/main.cjs');
// In dev mode, load renderer from dist/ (pre-built with vite build)
const RENDERER_DIST = path.join(PROJECT_ROOT, 'dist', 'index.html');

// Kill any existing processes on port 5173
function killExisting() {
  try {
    const lsof = execSync('lsof -ti:5173 2>/dev/null || true', { encoding: 'utf-8' }).trim();
    if (lsof) {
      lsof.split('\n').forEach(pid => {
        try { process.kill(parseInt(pid), 'SIGKILL'); } catch {}
      });
    }
  } catch {}
  // Also try to kill any existing electron processes
  try {
    execSync('pkill -f "electron.*Chatbot" 2>/dev/null || true');
  } catch {}
  // Wait a bit for ports to free up
  execSync('sleep 1');
}

// Build main process
function buildMain() {
  return new Promise((resolve, reject) => {
    console.log('Building main process...');
    const proc = spawn('npx', ['vite', 'build', '--config', 'vite.main.config.ts'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: true,
    });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Main build failed with code ${code}`));
      console.log('Main build completed');
      resolve();
    });
  });
}

// Build preload script
function buildPreload() {
  return new Promise((resolve, reject) => {
    console.log('Building preload script...');
    const proc = spawn('npx', ['vite', 'build', '--config', 'vite.preload.config.ts'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: true,
    });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Preload build failed with code ${code}`));
      console.log('Preload build completed');
      resolve();
    });
  });
}

// Build renderer
function buildRenderer() {
  return new Promise((resolve, reject) => {
    console.log('Building renderer...');
    const proc = spawn('npx', ['vite', 'build', '--config', 'vite.renderer.config.ts'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: true,
    });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Renderer build failed with code ${code}`));
      console.log('Renderer build completed');
      resolve();
    });
  });
}

// Start Electron
function startElectron() {
  return new Promise(() => {
    console.log('Starting Electron...');
    console.log('Electron path:', electronPath);
    console.log('Main path:', mainPath);

    const electron = spawn(electronPath, [mainPath, '--no-sandbox', '--disable-gpu'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SANDBOX: '1',
      },
    });

    electron.on('error', (err) => {
      console.error('Failed to start Electron:', err);
      process.exit(1);
    });

    electron.on('close', (code) => {
      console.log('Electron exited with code:', code);
      process.exit(code);
    });
  });
}

// Main
async function main() {
  try {
    killExisting();

    // Clean build directory
    console.log('Cleaning build directory...');
    fs.rmSync(path.join(PROJECT_ROOT, '.vite/build'), { recursive: true, force: true });

    // Build main first
    await buildMain();

    // Build preload
    await buildPreload();

    // Verify both files exist
    if (!fs.existsSync(mainPath)) {
      throw new Error(`Main build output not found at ${mainPath}`);
    }
    const preloadPath = path.join(PROJECT_ROOT, '.vite/build/preload.js');
    if (!fs.existsSync(preloadPath)) {
      throw new Error(`Preload build output not found at ${preloadPath}`);
    }

    // Build renderer
    await buildRenderer();

    // Verify renderer dist exists
    if (!fs.existsSync(RENDERER_DIST)) {
      throw new Error(`Renderer build output not found at ${RENDERER_DIST}`);
    }

    // Start Electron (without VITE_DEV_SERVER_URL, loads from dist/)
    await startElectron();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();