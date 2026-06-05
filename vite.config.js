import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import path, { resolve } from "path";
import { globSync } from "glob";
import { exec } from "child_process";

// HTML 엔트리 추출 (include 제외)
const htmlInputs = Object.fromEntries(
	globSync("src/html/**/*.html")
		.filter((file) => !file.replace(/\\/g, "/").includes("/include/"))
		.map((file) => {
			const name = file.replace(/^src\//, "").replace(/\.html$/, "");
			return [name, resolve(__dirname, file)];
		}),
);

// 가이드 페이지 엔트리 추가
const guideInputs = Object.fromEntries(
	globSync("src/guide/**/*.html").map((file) => {
		const name = file.replace(/^src\//, "").replace(/\.html$/, "");
		return [name, resolve(__dirname, file)];
	}),
);

// 실제 JS 자산 엔트리 추가 (빌드 시 유지하기 위함)
const jsInputs = Object.fromEntries(
	globSync("src/assets/js/**/*.js").map((file) => {
		const name = file.replace(/^src\//, "").replace(/\.js$/, "");
		return [name, resolve(__dirname, file)];
	}),
);

const allInputs = { ...htmlInputs, ...guideInputs, ...jsInputs };

// 코딩리스트 동기화 플러그인
const syncCodingList = () => ({
	name: "sync-coding-list",
	configureServer(server) {
		const handler = (filePath) => {
			const normalizedPath = filePath.replace(/\\/g, "/");
			
			// HTML 파일 변경 시 동기화 실행
			if (
				(normalizedPath.includes("src/html") || normalizedPath.includes("src/guide")) &&
				normalizedPath.endsWith(".html") &&
				!normalizedPath.includes("include")
			) {
				console.log(`[Vite Watcher] File ${path.basename(filePath)} changed. Syncing...`);
				exec("node scripts/sync-coding-list.js", (err, stdout) => {
					if (err) {
						console.error("[Sync Error]", err);
						return;
					}
					if (stdout) console.log(stdout);
					
					// 동기화 완료 후 브라우저 강제 새로고침
					server.ws.send({ type: "full-reload" });
				});
			}

			// coding-list.json 자체가 변경되었을 때도 새로고침
			if (normalizedPath.endsWith("coding-list.json")) {
				server.ws.send({ type: "full-reload" });
			}
		};
		server.watcher.on("add", handler);
		server.watcher.on("unlink", handler);
		server.watcher.on("change", handler);
	},
});

// HTML 엔트리에서 생성되는 불필요한 JS만 제거하는 플러그인
const removeHtmlEntryJs = () => ({
	name: "remove-html-entry-js",
	generateBundle(options, bundle) {
		for (const fileName in bundle) {
			const chunk = bundle[fileName];
			// facadeModuleId가 .html로 끝나는 경우(HTML 빌드용 가상 JS)만 삭제
			// 실제 .js 파일 엔트리에서 생성된 파일은 유지됨
			if (fileName.endsWith(".js") && chunk.facadeModuleId?.endsWith(".html")) {
				delete bundle[fileName];
			}
		}
	},
});

// 빌드 시 @page-info 주석 제거 플러그인
const removePageInfoComments = () => ({
	name: "remove-page-info-comments",
	apply: "build",
	transformIndexHtml(html) {
		return html.replace(/<!--\s*@page-info[\s\S]*?-->/g, "");
	},
});

export default defineConfig({
	root: "./src",
	publicDir: "public",

	plugins: [
		syncCodingList(),
		removeHtmlEntryJs(),
		removePageInfoComments(),
		handlebars({
			partialDirectory: resolve(__dirname, "src/html/include"),
		}),
	],

	build: {
		outDir: "../dist",
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			input: allInputs,
			output: {
				// 구조 유지를 위해 [name].js 사용 (name에 경로가 포함됨)
				entryFileNames: "[name].js",
				chunkFileNames: "assets/js/chunks/[name].js",
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
		open: "/guide/coding-list.html",
	},
});
