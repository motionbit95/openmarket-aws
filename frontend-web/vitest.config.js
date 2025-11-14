import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["**/*.stories.{js,jsx,ts,tsx}", "node_modules"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,ts,jsx,tsx}"],
      exclude: ["**/*.stories.{js,jsx,ts,tsx}", "node_modules"],
      reporter: ["text", "html"],
    },
    environment: "node",
  },
  resolve: {
    alias: {
      'src': path.join(dirname, 'src'),
    },
  },
});
