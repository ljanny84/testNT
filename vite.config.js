import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import { resolve } from "path";

export default defineConfig({
	root: "./src/html",

	build: {
		outDir: "../../dist",
		emptyOutDir: true,
	},

	server: {
		open: "/index.html",
	},

	plugins: [
		handlebars({
			partialDirectory: resolve(__dirname, "src/html/include"),
		}),
	],
});
