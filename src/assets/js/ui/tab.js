export default function tab() {
	const tabs = document.querySelectorAll("[data-tab]");

	tabs.forEach((tab) => {
		const buttons = tab.querySelectorAll("[data-tab-btn]");
		const panels = tab.querySelectorAll("[data-tab-panel]");

		buttons.forEach((button, index) => {
			button.addEventListener("click", () => {
				buttons.forEach((btn) => btn.classList.remove("is-active"));
				panels.forEach((panel) => panel.classList.remove("is-active"));

				button.classList.add("is-active");
				panels[index]?.classList.add("is-active");
			});
		});
	});
}
