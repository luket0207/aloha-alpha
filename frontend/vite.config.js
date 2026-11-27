import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  ...(mode === 'demo' && { envPrefix: [], publicDir: false }),
  // Compiled files are served from the WordPress theme, not the Vite dev server.
  base: './',
  build: {
    outDir: '../backend/themes/alohaalpha/dist',
    emptyOutDir: true,
    manifest: mode !== 'demo',
  },
}));
