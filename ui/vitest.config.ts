import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      setupFiles: "./setupVitest.ts",
      env: {
        LC_ALL: "de_DE.UTF-8",
      },
    },
  }),
);
