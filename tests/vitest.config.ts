import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'zundo',
    globals: true,
    environment: 'happy-dom',
    dir: '.',
    setupFiles: ['./vitest.setup.ts', 'vitest-localstorage-mock'],
    mockReset: false,
    coverage: {
      include: ['**/src/**/*.{ts,tsx}'],
      allowExternal: true,
      reportOnFailure: true,
      reporter: ['text', 'json-summary', 'json', 'html'],
    },
  },
});
