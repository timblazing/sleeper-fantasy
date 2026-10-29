import path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: { alias: { "server-only": path.resolve(__dirname, "src/lib/test/server-only-stub.ts") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Tests opt into a RosterAudit key with vi.stubEnv; a real key in the build environment must not leak in.
    env: { ROSTERAUDIT_API_KEY: "" },
  },
});
