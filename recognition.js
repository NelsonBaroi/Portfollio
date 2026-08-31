document.addEventListener('DOMContentLoaded', () => {
  const buttons = [...document.querySelectorAll('[data-recognition-filter]')];
  const cards = [...document.querySelectorAll('.recognition-card[data-category]')];
  const years = [...document.querySelectorAll('.recognition-year[data-year]')];
  const count = document.getElementById('recognition-result-count');
  if (!buttons.length || !cards.length) return;

  const applyFilter = category => {
    let visible = 0;
    cards.forEach(card => {
      const show = category === 'all' || card.dataset.category === category;
      card.hidden = !show;
      if (show) visible += 1;
    });
    years.forEach(year => {
      year.hidden = !year.querySelector('.recognition-card:not([hidden])');
    });
    buttons.forEach(button => {
      const active = button.dataset.recognitionFilter === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (count) count.textContent = String(visible);
    const url = new URL(window.location.href);
    if (category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', category);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  };

  buttons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.recognitionFilter)));
  const requested = new URLSearchParams(window.location.search).get('category');
  applyFilter(buttons.some(button => button.dataset.recognitionFilter === requested) ? requested : 'all');
});
