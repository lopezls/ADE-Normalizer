import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Default run: fast, offline, free. Live tests (real API calls) are in tests/live
// and run only with `npm run eval`.
export default defineConfig({
  resolve: { alias: { "@": resolve(import.meta.dirname) } },
  test: { include: ["tests/**/*.test.ts"], exclude: ["tests/live/**", "node_modules/**"] },
});
