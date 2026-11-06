(function () {
  'use strict';

  /* ============ СОСТОЯНИЕ ============ */
  const state = {
    search: '',
    category: 'Все'
  };

  /* ============ DOM ============ */
  const grid     = document.getElementById('grid');
  const catsEl   = document.getElementById('cats');
  const searchEl = document.getElementById('search');
  const player   = document.getElementById('player');
  const frame    = document.getElementById('frame');
  const loading  = document.getElementById('loading');
  const pname    = document.getElementById('pname');
  const toastEl  = document.getElementById('toast');

  let currentGame = null;
  let loadTimer   = null;

  /* ============ УТИЛИТЫ ============ */
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  function iconHTML(i) {
    return /^(https?:|data:image|\/)/.test(i) ? `<img src="${i}" alt="">` : i;
  }

  /* ============ КАТЕГОРИИ ============ */
  function renderCats() {
    const cats = ['Все', ...new Set(GAMES.map(g => g.category))];
    catsEl.innerHTML = cats.map(c =>
      `<button class="cat ${c === state.category ? 'active' : ''}" data-c="${c}">${c}</button>`
    ).join('');
    catsEl.querySelectorAll('.cat').forEach(b => {
      b.onclick = () => {
        state.category = b.dataset.c;
        renderCats();
        renderGrid();
      };
    });
  }

  /* ============ ФИЛЬТР ============ */
  function getFiltered() {
    let list = GAMES.slice();

    if (state.category !== 'Все') {
      list = list.filter(g => g.category === state.category);
    }

    if (state.search) {
      const q = state.search.toLowerCase().trim();
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.desc.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      );
    }
    return list;
  }

  /* ============ СЕТКА ============ */
  function renderGrid() {
    const list = getFiltered();

    if (!list.length) {
      grid.innerHTML = `<div class="empty"><div class="big">🔍</div>Ничего не найдено</div>`;
      return;
    }

    grid.innerHTML = list.map(g => {
      const idx = GAMES.indexOf(g);
      return `
        <div class="card" data-i="${idx}">
          <div class="icon">${iconHTML(g.icon)}</div>
          <h3>${g.name}</h3>
          <p>${g.desc}</p>
          <div class="meta">
            <span class="tag">${g.category}</span>
            <span class="rate">★ ${(g.rate || 5).toFixed(1)}</span>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.card').forEach(c => {
      c.onclick = () => launch(+c.dataset.i);
    });
  }

  /* ============ ЗАПУСК ============ */
  function launch(i) {
    const g = GAMES[i];
    if (!g) return;

    currentGame = g;

    pname.textContent = `${g.icon && !/^(https?:|data:)/.test(g.icon) ? g.icon + ' ' : ''}${g.name}`;

    loading.innerHTML = `<div><div class="spinner"></div>Загрузка игры...</div>`;
    loading.classList.remove('hide');
    clearTimeout(loadTimer);
    frame.onload = null;
    frame.removeAttribute('src');
    frame.srcdoc = '';

    player.classList.add('open');
    document.body.style.overflow = 'hidden';

    frame.onload = () => {
      clearTimeout(loadTimer);
      loading.classList.add('hide');
    };

    loadTimer = setTimeout(() => {
      if (!loading.classList.contains('hide')) {
        loading.innerHTML = `<div class="err">
          <h3>⚠️ Игра долго не загружается</h3>
          Нажмите <b>«↗ Новая вкладка»</b> сверху — откроется напрямую.
          Проверьте имя файла: <code>${g.file}</code>.
        </div>`;
      }
    }, 8000);

    requestAnimationFrame(() => { frame.src = g.file; });
  }

  function closePlayer() {
    player.classList.remove('open');
    clearTimeout(loadTimer);
    frame.srcdoc = '';
    frame.removeAttribute('src');
    document.body.style.overflow = '';
    currentGame = null;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  /* ============ КНОПКИ ПЛЕЕРА ============ */
  document.getElementById('closeBtn').onclick = closePlayer;

  document.getElementById('reloadBtn').onclick = () => {
    if (!currentGame) return;
    loading.innerHTML = `<div><div class="spinner"></div>Загрузка игры...</div>`;
    loading.classList.remove('hide');
    clearTimeout(loadTimer);
    frame.src = 'about:blank';
    requestAnimationFrame(() => { frame.src = currentGame.file; });
  };

  document.getElementById('extBtn').onclick = () => {
    if (currentGame) window.open(currentGame.file, '_blank', 'noopener');
  };

  document.getElementById('fsBtn').onclick = () => {
    const el = document.getElementById('wrap');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => toast('Полный экран недоступен'));
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && player.classList.contains('open') && !document.fullscreenElement) {
      closePlayer();
    }
  });

  searchEl.oninput = e => {
    state.search = e.target.value;
    renderGrid();
  };

  /* ============ СТАРТ ============ */
  renderCats();
  renderGrid();
})();
