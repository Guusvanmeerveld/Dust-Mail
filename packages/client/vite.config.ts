import preact from "@preact/preset-vite";
import { resolve } from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import alias from "@rollup/plugin-alias";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact(),
		alias({
			entries: [
				{ find: "react", replacement: "preact/compat" },
				{ find: "react-dom/test-utils", replacement: "preact/test-utils" },
				{ find: "react-dom", replacement: "preact/compat" },
				{ find: "react/jsx-runtime", replacement: "preact/jsx-runtime" }
			]
		}),
		tsconfigPaths()
	],
	esbuild: {
		logOverride: { "this-is-undefined-in-esm": "silent" }
	},
	build: {
		sourcemap: true,
		outDir: "dist",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html")
			}
		}
	}
});
