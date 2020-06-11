export function initUiPanel(el) {
  let collapsed = false;

  el.addEventListener('click', (e) => {
    if (e.target.matches('h2')) {
      collapsed = !collapsed;
      update();
    }
  });

  update();

  function update() {
    el.classList.toggle('collapsed', collapsed);
  }
}
