export default function accordion() {
	const accordions = document.querySelectorAll("[data-accordion]");

	accordions.forEach((accordion) => {
		const buttons = accordion.querySelectorAll("[data-accordion-btn]");

		buttons.forEach((button) => {
			button.addEventListener("click", () => {
				button.closest("[data-accordion-item]")?.classList.toggle("is-open");
			});
		});
	});
}
