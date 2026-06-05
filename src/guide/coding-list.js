import "../assets/scss/style.scss";

const STATE = {
	wait: ["대기", "wait"],
	ing: ["작업중", "ing"],
	done: ["완료", "done"],
	hold: ["보류", "hold"],
	modify: ["수정중", "modify"],
	review: ["검수요청", "review"],
};

const $ = (selector) => document.querySelector(selector);

const els = {
	wrap: $(".coding-wrap"),
	tree: $("[data-tree]"),
	frame: $("[data-view-frame]"),
	title: $("[data-view-title]"),
	path: $("[data-view-path]"),
	link: $("[data-view-link]"),
	total: $("[data-total]"),
	done: $("[data-done]"),
	toggle: $("[data-toggle-sidebar]"),
	searchInput: $("[data-search-input]"),
	searchClear: $("[data-search-clear]"),
};

const STORAGE_KEY = "codingListLastUrl";
const SIDEBAR_STORAGE_KEY = "codingListSidebarHidden";

document.addEventListener("DOMContentLoaded", init);

async function init() {
	try {
		const data = await fetch("coding-list.json").then((res) => res.json());

		renderSummary(data);
		renderTree(data);
		bindEvents();

		const isSidebarHidden = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
		if (isSidebarHidden) {
			els.wrap.classList.add("is-sidebar-hidden");
		}

		const lastUrl = localStorage.getItem(STORAGE_KEY);
		const lastItem = lastUrl ? els.tree.querySelector(`.tree_item[data-url = "${lastUrl}"]`) : null;
		(lastItem || els.tree.querySelector(".tree_itm"))?.click();
	} catch (error) {
		console.error("Failed to load data:", error);
		els.tree.innerHTML = `<p class="tree_error">코딩리스트를 불러오지 못했습니다.</p>`;
	}
}

function renderSummary(data) {
	const pages = data.flatMap((group) => group.children || []);

	els.total.textContent = pages.length;
	els.done.textContent = pages.filter((page) => page.state === "done").length;
}

function renderTree(data) {
	els.tree.innerHTML = data
		.map((group) => {
			const depth = group.title.split("/").length;
			const displayTitle = group.title;

			return `
				<div class="tree_group is-open depth-${depth}">
					<button type="button" class="tree_depth1">
						<i class="icon-folder"></i>
						<span>${displayTitle}</span>
						<span class="tree_count">${group.children?.length || 0}</span>
					</button>

					<div class="tree_list">
						${(group.children || []).map(renderItem).join("")}
					</div>
				</div>
			`;
		})
		.join("");
}

function renderItem(page) {
	const [text, className] = STATE[page.state] || [page.state || "-", "wait"];

	return `
		<button type="button" class="tree_item" data-url="${page.url}" data-name="${page.name}" data-worker="${page.worker}" data-id="${page.id}">
			<i class="icon-file"></i>
			<span class="tree_name">${page.name}</span>
			<span class="tree_meta">
				<span class="tree_id">${page.id || "-"}</span>
				<span class="tree_state ${className}">${text}</span>
			</span>
			<span class="tree_worker">${page.worker}</span>
		</button>
	`;
}

function bindEvents() {
	els.toggle.addEventListener("click", () => {
		const isHidden = els.wrap.classList.toggle("is-sidebar-hidden");
		localStorage.setItem(SIDEBAR_STORAGE_KEY, isHidden);
	});

	els.searchInput.addEventListener("input", (e) => {
		const value = e.target.value.toLowerCase().trim();
		filterTree(value);

		els.searchClear.classList.toggle("is-visible", value.length > 0);
	});

	els.searchClear.addEventListener("click", () => {
		els.searchInput.value = "";
		els.searchInput.focus();
		filterTree("");
		els.searchClear.classList.remove("is-visible");
	});

	els.tree.addEventListener("click", (event) => {
		const depth = event.target.closest(".tree_depth1");
		const item = event.target.closest(".tree_item");

		if (depth) {
			depth.closest(".tree_group")?.classList.toggle("is-open");
			return;
		}

		if (!item) return;

		els.tree.querySelector(".tree_item.is-active")?.classList.remove("is-active");
		item.classList.add("is-active");

		const { url, name } = item.dataset;

		localStorage.setItem(STORAGE_KEY, url);

		els.frame.src = url;
		els.title.textContent = name;
		els.path.textContent = url;
		els.link.href = url;
	});
}

function filterTree(keyword) {
	const groups = els.tree.querySelectorAll(".tree_group");

	groups.forEach((group) => {
		const items = group.querySelectorAll(".tree_item");
		let hasVisibleItem = false;

		items.forEach((item) => {
			const name = item.dataset.name.toLowerCase();
			const worker = item.dataset.worker.toLowerCase();
			const id = item.dataset.id.toLowerCase();
			const isMatch = name.includes(keyword) || worker.includes(keyword) || id.includes(keyword);

			item.style.display = isMatch ? "flex" : "none";
			if (isMatch) hasVisibleItem = true;
		});

		group.style.display = hasVisibleItem ? "block" : "none";
		if (keyword !== "" && hasVisibleItem) {
			group.classList.add("is-open");
		}
	});
}
