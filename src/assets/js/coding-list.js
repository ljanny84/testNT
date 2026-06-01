import "../scss/style.scss";

const stateMap = {
	wait: "대기",
	ing: "작업중",
	done: "완료",
	hold: "보류",
	modify: "수정중",
	review: "검수요청",
};

const stateClassMap = {
	wait: "tree__state--wait",
	ing: "tree__state--ing",
	done: "tree__state--done",
	hold: "tree__state--hold",
	modify: "tree__state--modify",
	review: "tree__state--review",
};

const treeEl = document.querySelector("[data-tree]");
const frameEl = document.querySelector("[data-view-frame]");
const titleEl = document.querySelector("[data-view-title]");
const pathEl = document.querySelector("[data-view-path]");
const linkEl = document.querySelector("[data-view-link]");
const totalEl = document.querySelector("[data-total]");
const doneEl = document.querySelector("[data-done]");

async function initCodingList() {
	try {
		const response = await fetch("/data/coding-list.json");

		if (!response.ok) {
			throw new Error("coding-list.json을 불러오지 못했습니다.");
		}

		const data = await response.json();

		renderSummary(data);
		renderTree(data);
		bindEvents();

		const firstItem = document.querySelector(".tree__item");
		if (firstItem) firstItem.click();
	} catch (error) {
		treeEl.innerHTML = `<p class="tree__error">${error.message}</p>`;
	}
}

function renderSummary(data) {
	const pages = data.flatMap((group) => group.children || []);
	const donePages = pages.filter((page) => page.state === "done");

	totalEl.textContent = pages.length;
	doneEl.textContent = donePages.length;
}

function renderTree(data) {
	treeEl.innerHTML = data
		.map((group) => {
			const children = group.children || [];

			return `
      <div class="tree__group is-open">
        <button type="button" class="tree__depth1">
          <span>${group.title}</span>
          <span class="tree__count">${children.length}</span>
        </button>

        <div class="tree__list">
          ${children.map((page) => renderItem(page)).join("")}
        </div>
      </div>
    `;
		})
		.join("");
}

function renderItem(page) {
	const stateText = stateMap[page.state] || page.state || "-";
	const stateClass = stateClassMap[page.state] || "tree__state--wait";

	return `
    <button
      type="button"
      class="tree__item"
      data-url="${page.url}"
      data-name="${page.name}"
      data-id="${page.id || ""}"
    >
      <span class="tree__name">${page.name}</span>
      <span class="tree__meta">
        <span class="tree__id">${page.id || "-"}</span>
        <span class="tree__state ${stateClass}">${stateText}</span>
      </span>
    </button>
  `;
}

function bindEvents() {
	document.querySelectorAll(".tree__depth1").forEach((button) => {
		button.addEventListener("click", () => {
			const group = button.closest(".tree__group");
			if (group) group.classList.toggle("is-open");
		});
	});

	document.querySelectorAll(".tree__item").forEach((item) => {
		item.addEventListener("click", () => {
			const url = item.dataset.url;
			const name = item.dataset.name;

			document.querySelectorAll(".tree__item").forEach((el) => {
				el.classList.remove("is-active");
			});

			item.classList.add("is-active");

			frameEl.src = url;
			titleEl.textContent = name;
			pathEl.textContent = url;
			linkEl.href = url;
		});
	});
}

initCodingList();
