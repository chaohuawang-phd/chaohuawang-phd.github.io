'use strict';
// Only public course metadata appears in this script. Personal study records remain outside the site.
const directory = document.querySelector('[data-directory]');
if (directory) {
  const controls = {
    search: document.getElementById('course-search'),
    week: document.getElementById('filter-week'),
    stage: document.getElementById('filter-stage'),
    topic: document.getElementById('filter-topic'),
  };
  const cards = [...directory.querySelectorAll('[data-unit]')];
  const groups = [...directory.querySelectorAll('[data-week-group]')];
  const counter = document.getElementById('result-count');
  const empty = document.getElementById('no-results');
  function applyFilters() {
    const query = controls.search.value.trim().toLocaleLowerCase();
    const filtered = Boolean(query || controls.week.value || controls.stage.value || controls.topic.value);
    let visible = 0;
    cards.forEach(card => {
      const matches = (!query || card.dataset.search.includes(query)) &&
        (!controls.week.value || card.dataset.week === controls.week.value) &&
        (!controls.stage.value || card.dataset.stage === controls.stage.value) &&
        (!controls.topic.value || JSON.parse(card.dataset.tags).includes(controls.topic.value));
      card.hidden = !matches;
      if (matches) visible++;
    });
    groups.forEach(group => {
      const visibleCards = [...group.querySelectorAll('[data-unit]')].filter(card => !card.hidden);
      group.hidden = !visibleCards.length;
      if (filtered && visibleCards.length) group.open = true;
      if (!filtered) group.open = group.dataset.weekGroup === '1';
    });
    counter.textContent = `显示 ${visible} / ${cards.length} 个课程单元`;
    empty.hidden = visible > 0;
    const state = new URLSearchParams();
    for (const [key, control] of Object.entries(controls)) if (control.value) state.set(key, control.value);
    const suffix = state.toString();
    history.replaceState(null, '', `${location.pathname}${suffix ? '?' + suffix : ''}${location.hash}`);
  }
  const params = new URLSearchParams(location.search);
  for (const [key, control] of Object.entries(controls)) {
    const value = params.get(key);
    if (value != null) control.value = value;
    control.addEventListener(key === 'search' ? 'input' : 'change', applyFilters);
  }
  document.getElementById('reset-filters').addEventListener('click', () => {
    Object.values(controls).forEach(control => control.value = '');
    applyFilters();
  });
  applyFilters();
}
