import "../scss/style.scss";

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
	tree: $("[data-tree]"),
	frame: $("[data-view-frame]"),
	title: $("[data-view-title]"),
	path: $("[data-view-path]"),
	link: $("[data-view-link]"),
	total: $("[data-total]"),
	done: $("[data-done]"),
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
	try {
		const data = await fetch("/data/coding-list.json").then((res) => res.json());

		renderSummary(data);
		renderTree(data);
		bindEvents();

		els.tree.querySelector(".tree_item")?.click();
	} catch (error) {
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
		.map(
			(group) => `
		<div class="tree_group is-open">
			<button type="button" class="tree_depth1">
				<span>${group.title}</span>
				<span class="tree_count">${group.children?.length || 0}</span>
			</button>

			<div class="tree_list">
				${(group.children || []).map(renderItem).join("")}
			</div>
		</div>
	`,
		)
		.join("");
}

function renderItem(page) {
	const [text, className] = STATE[page.state] || [page.state || "-", "wait"];

	return `
		<button type="button" class="tree_item" data-url="${page.url}" data-name="${page.name}">
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

		els.frame.src = url;
		els.title.textContent = name;
		els.path.textContent = url;
		els.link.href = url;
	});
}
