import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // required
    setupFiles: ['vitest-localstorage-mock'],
    mockReset: false,
  }
})
