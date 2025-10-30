import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@/app': resolve(__dirname, './app'),
      '@/packages': resolve(__dirname, './packages'),
    },
  },
});
