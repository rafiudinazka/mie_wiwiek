import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/__tests__/**/*.test.js'],
    setupFiles: [],
    alias: [
      { find: /^svelte$/, replacement: 'svelte' },
    ],
  },
  resolve: {
    conditions: ['browser'],
  },
});
