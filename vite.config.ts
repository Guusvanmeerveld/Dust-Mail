import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tsconfigPaths from "vite-tsconfig-paths";

import alias from "@rollup/plugin-alias";

import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    tsconfigPaths(),
    alias({
      entries: [
        { find: "react", replacement: "preact/compat" },
        { find: "react-dom/test-utils", replacement: "preact/test-utils" },
        { find: "react-dom", replacement: "preact/compat" },
        { find: "react/jsx-runtime", replacement: "preact/jsx-runtime" },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        splashscreen: resolve(__dirname, "splashscreen.html"),
      },
    },
  },
});
