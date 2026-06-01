import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import { resolve } from "path";
import { globSync } from "glob";

const htmlInputs = Object.fromEntries(
	globSync("src/html/**/*.html")
		.filter((file) => !file.includes("/include/"))
		.map((file) => {
			const name = file.replace("src/html/", "").replace(/\.html$/, "");
			return [name, resolve(__dirname, file)];
		}),
);

export default defineConfig({
	root: "./src",
	publicDir: "public",

	plugins: [
		handlebars({
			partialDirectory: resolve(__dirname, "src/html/include"),
		}),
	],

	build: {
		outDir: "../dist",
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			input: htmlInputs,
			output: {
				entryFileNames: "assets/js/[name].js",
				chunkFileNames: "assets/js/[name].js",
				assetFileNames: (assetInfo) => {
					const name = assetInfo.name || "";

					if (/\.css$/.test(name)) return "assets/css/[name][extname]";
					if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) return "assets/images/[name][extname]";

					return "assets/[name][extname]";
				},
			},
		},
	},

	server: {
		open: "/html/guide/coding-list.html",
	},
});
