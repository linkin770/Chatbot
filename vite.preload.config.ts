import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: '.vite/build',
    emptyOutDir: false,
    rollupOptions: {
      external: ['electron', /^node:/],
      input: path.resolve(__dirname, 'src/preload/preload.ts'),
      output: {
        dir: path.resolve(__dirname, '.vite/build'),
        entryFileNames: 'preload.js',
        format: 'cjs',
      },
    },
    target: 'node18',
  },
});
