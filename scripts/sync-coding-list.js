import fs from "fs";
import path from "path";
import { glob } from "glob";

const JSON_PATH = path.resolve("src/guide/coding-list.json");
const HTML_DIR = path.resolve("src/html");
const BASE_URL_PREFIX = "../html/";

// HTML 파일에서 정보 추출
function extractInfo(content) {
	const info = {
		title: "제목 없음",
		pageInfo: null
	};

	// 타이틀 추출
	const hbsTitleMatch = content.match(/\{\{> head title=["'](.*?)["']\}\}/);
	const titleTagMatch = content.match(/<title>(.*?)<\/title>/);
	if (hbsTitleMatch) info.title = hbsTitleMatch[1];
	else if (titleTagMatch) info.title = titleTagMatch[1];

	// @page-info 주석 추출
	const pageInfoMatch = content.match(/@page-info\s*({[\s\S]*?})\s*-->/);
	if (pageInfoMatch) {
		try {
			info.pageInfo = JSON.parse(pageInfoMatch[1]);
		} catch (e) {
			console.warn("[Sync] JSON 파싱 실패 (주석 형식을 확인하세요)");
		}
	}

	return info;
}

async function sync() {
	try {
		// 1. 기존 데이터 로드 (백업 및 매칭용)
		let oldData = [];
		if (fs.existsSync(JSON_PATH)) {
			oldData = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
		}

		const entryMap = new Map();
		oldData.forEach((group) => {
			group.children?.forEach((child) => {
				entryMap.set(child.url, child);
			});
		});

		// 2. 실제 HTML 파일 목록 가져오기
		const files = await glob("**/*.html", {
			cwd: HTML_DIR,
			ignore: ["include/**", "**/include/**"],
		});

		// 3. 새로운 데이터 구조 생성
		const groupedData = {};

		for (const file of files) {
			const normalizedFile = file.replace(/\\/g, "/");
			const url = BASE_URL_PREFIX + normalizedFile;
			const dirName = path.dirname(normalizedFile);
			
			const fullPath = path.join(HTML_DIR, file);
			const content = fs.readFileSync(fullPath, "utf-8");
			const extracted = extractInfo(content);

			// 그룹명 결정
			let groupTitle = "기타";
			if (normalizedFile === "index.html") {
				groupTitle = "메인";
			} else if (dirName !== ".") {
				groupTitle = dirName.replace(/^pages\//, "").replace(/^pages$/, "기타");
			}

			if (!groupedData[groupTitle]) {
				groupedData[groupTitle] = [];
			}

			// 기존 데이터와 병합 (HTML 내 정보 우선)
			const existingEntry = entryMap.get(url) || {};
			const pageInfo = extracted.pageInfo || {};

			groupedData[groupTitle].push({
				id: pageInfo.id || existingEntry.id || "",
				name: extracted.title,
				url: url,
				state: pageInfo.state || existingEntry.state || "wait",
				progress: pageInfo.progress !== undefined ? pageInfo.progress : (existingEntry.progress || 0),
				worker: pageInfo.worker || existingEntry.worker || "",
				date: pageInfo.date || existingEntry.date || "",
			});
		}

		// 4. 객체를 배열 형태로 변환 및 정렬
		const newData = [];
		const titles = Object.keys(groupedData).sort((a, b) => {
			if (a === "메인") return -1;
			if (b === "메인") return 1;
			if (a === "기타") return 1;
			if (b === "기타") return -1;
			return a.localeCompare(b);
		});

		titles.forEach((title) => {
			newData.push({
				title: title,
				children: groupedData[title],
			});
		});

		// 5. 파일 저장
		fs.writeFileSync(JSON_PATH, JSON.stringify(newData, null, "\t"), "utf-8");
		console.log("[Sync] 코딩리스트 동기화 완료 (타이틀 및 구조 최신화)");

	} catch (error) {
		console.error("[Sync] 오류 발생:", error);
	}
}

sync();
