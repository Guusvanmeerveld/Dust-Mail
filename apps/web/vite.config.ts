import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

import { visualizer } from "rollup-plugin-visualizer";

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
		react(),
		tsconfigPaths(),
		visualizer({ template: "sunburst" })
	],
	esbuild: {
		logOverride: { "this-is-undefined-in-esm": "silent" }
	},
	build: {
		chunkSizeWarningLimit: 1000,
		target: ["es2021", "chrome97", "safari13"],
		minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
		sourcemap: !!process.env.TAURI_DEBUG,
		outDir: "dist",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html")
			}
		}
	}
});
