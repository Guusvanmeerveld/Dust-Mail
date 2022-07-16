import preact from "@preact/preset-vite";
import { resolve } from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

import alias from "@rollup/plugin-alias";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		VitePWA({
			includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
			registerType: "autoUpdate",
			manifest: {
				short_name: "dust-mail",
				name: "Dust Mail",
				icons: [
					{
						src: "android-chrome-192x192.png",
						sizes: "192x192",
						type: "image/png"
					},
					{
						src: "android-chrome-512x512.png",
						sizes: "512x512",
						type: "image/png"
					},
					{
						src: "android-chrome-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable"
					}
				],
				start_url: "/",
				theme_color: "#2196F3",
				background_color: "#121212",
				display: "standalone",
				scope: "/",
				protocol_handlers: [
					{
						protocol: "mailto",
						url: "/dashboard/compose?uri=%s"
					}
				]
			}
		}),
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
		chunkSizeWarningLimit: 1000,
		sourcemap: false,
		outDir: "dist",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html")
			}
		}
	}
});
