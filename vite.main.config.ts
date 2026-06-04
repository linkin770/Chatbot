import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: '.vite/build',
    emptyOutDir: false,
    rollupOptions: {
      external: ['electron', /^node:/],
      input: path.resolve(__dirname, 'src/main/main.ts'),
      output: {
        dir: path.resolve(__dirname, '.vite/build'),
        entryFileNames: 'main.cjs',
        format: 'cjs',
      },
    },
    target: 'node18',
  },
});
