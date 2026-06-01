const UI = {
  init() {
    this.tab();
    this.accordion();
  },

  tab() {
    const tabs = document.querySelectorAll('[data-tab]');

    tabs.forEach((tab) => {
      const buttons = tab.querySelectorAll('[data-tab-btn]');
      const panels = tab.querySelectorAll('[data-tab-panel]');

      buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
          buttons.forEach((btn) => btn.classList.remove('is-active'));
          panels.forEach((panel) => panel.classList.remove('is-active'));

          button.classList.add('is-active');
          panels[index].classList.add('is-active');
        });
      });
    });
  },

  accordion() {
    const accordions = document.querySelectorAll('[data-accordion]');

    accordions.forEach((accordion) => {
      const buttons = accordion.querySelectorAll('[data-accordion-btn]');

      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          const item = button.closest('[data-accordion-item]');
          if (item) item.classList.toggle('is-open');
        });
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
