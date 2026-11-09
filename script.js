/* PIMS Baku — script.js · one cup image, recolored with CSS filters */
(() => {
  'use strict';

  const WA_NUMBER = '994517353636';

  // Single source of truth for every drink: copy, theme colours and the cup filter.
  // Base cup is magenta-crimson (~347°), so hue-rotate angles are relative to that.
  const DRINKS = [
    { key: 'matcha',    label: 'Matcha',        price: '6.90 ₼', desc: 'Yapon matchası, süd köpüyü və bir az şirinlik. Sakit, amma enerjili.',
      accent: '#4E9A2B', deep: '#357018', on: '#FFFFFF', bg: ['#EAF5D3', '#A8D67A'], filter: 'hue-rotate(118deg) saturate(1) brightness(1.55)' },
    { key: 'berry',     label: 'Berry',         price: '5.90 ₼', desc: 'Çiyələk, moruq və qara çay — buzlu, şirəli və tam partlayıcı.',
      accent: '#D6284F', deep: '#A81A3C', on: '#FFFFFF', bg: ['#FFE6EB', '#F59BB3'], filter: 'hue-rotate(0deg) saturate(1.1) brightness(1)' },
    { key: 'lychee',    label: 'Lychee Mango',  price: '5.90 ₼', desc: 'Liçi və şirin manqo — yüngül, təravətli və günəşli.',
      accent: '#F2B01E', deep: '#8A5A00', on: '#3B2800', bg: ['#FFF6CC', '#FFD35C'], filter: 'hue-rotate(80deg) saturate(1.1) brightness(1.75)' },
    { key: 'passion',   label: 'Water Passion', price: '5.90 ₼', desc: 'Passion fruit, bol buz və sərin su — susuzluğun əlacı.',
      accent: '#E2523B', deep: '#B03420', on: '#FFFFFF', bg: ['#FFE9DF', '#FF9C86'], filter: 'hue-rotate(28deg) saturate(1.1) brightness(1.15)' },
    { key: 'peach',     label: 'Peach Orange',  price: '5.90 ₼', desc: 'Şirəli şaftalı və portağal — isti, şirin və parlaq.',
      accent: '#F28A24', deep: '#A85200', on: '#2E1800', bg: ['#FFEBD6', '#FFB36B'], filter: 'hue-rotate(52deg) saturate(1.15) brightness(1.25)' },
    { key: 'blueberry', label: 'Blueberry Ice', price: '5.90 ₼', desc: 'Qaragilə, bol buz və bir damcı lime — dərin və sərin.',
      accent: '#3F62D8', deep: '#2A45A8', on: '#FFFFFF', bg: ['#E6EEFF', '#8FA8F2'], filter: 'hue-rotate(248deg) saturate(1.2) brightness(1)' },
    { key: 'taro',      label: 'Taro Cloud',    price: '6.90 ₼', desc: 'Yumşaq taro, süd və vanil — buludlu və qəşəng.',
      accent: '#8A5CD6', deep: '#62399F', on: '#FFFFFF', bg: ['#F1E6FF', '#BE9CF0'], filter: 'hue-rotate(292deg) saturate(1.3) brightness(1.05)' },
    { key: 'lagoon',    label: 'Blue Lagoon',   price: '5.90 ₼', desc: 'Sərin okean notları, nanə və buz — yayın ən mavi içkisi.',
      accent: '#1FAFC0', deep: '#0C7683', on: '#05262B', bg: ['#DDF6F8', '#7ED4DD'], filter: 'hue-rotate(203deg) saturate(1.1) brightness(1.5)' }
  ];

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const body = document.body;
  const cup = $('#dynamic-cup');
  const stage = $('#stage');
  const tabsEl = $('.tabs');
  const nameEl = $('#drinkName');
  const descEl = $('#drinkDesc');
  const priceEl = $('#drinkPrice');
  const metaTheme = $('meta[name="theme-color"]');
  const bgs = [$('#bgA'), $('#bgB')];

  const form = $('#orderForm');
  const nameInput = $('#name');
  const drinkSelect = $('#drink');
  const branchSelect = $('#branch');
  const previewEl = $('#previewText');
  const errorEl = $('#formError');
  const clockEl = $('#clock');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 1; // Berry — the original image colour
  let bgCur = 1;

  /* ---------- Build tabs + native drink options from DRINKS ---------- */
  tabsEl.innerHTML = DRINKS.map((d, i) =>
    `<button class="tab" role="tab" type="button" data-i="${i}" style="--dot:${d.accent}"><i class="tab__dot" aria-hidden="true"></i>${d.label}</button>`
  ).join('');
  const tabs = $$('.tab', tabsEl);

  drinkSelect.innerHTML = DRINKS.map(d => `<option value="${d.label}" data-dot="${d.accent}">${d.label}</option>`).join('');

  /* ---------- Custom dropdown (replaces the native popup UI) ---------- */
  function makeDropdown(sel) {
    const wrap = document.createElement('div');
    wrap.className = 'dd';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('dd__native');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = sel.id + 'Btn';
    btn.className = 'dd__btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<i class="dd__dot" hidden></i><span class="dd__label"></span><svg class="dd__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

    const list = document.createElement('ul');
    list.className = 'dd__list';
    list.id = sel.id + 'List';
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;
    btn.setAttribute('aria-controls', list.id);
    const label = $(`label[for="${sel.id}"]`);
    if (label) { label.htmlFor = btn.id; list.setAttribute('aria-labelledby', label.id || (label.id = sel.id + 'Lbl')); }

    const opts = [...sel.options].map((o, i) => {
      const li = document.createElement('li');
      li.className = 'dd__opt';
      li.setAttribute('role', 'option');
      li.innerHTML = (o.dataset.dot ? `<i class="dd__dot" style="--dot:${o.dataset.dot}"></i>` : '') + `<span>${o.text}</span>`;
      li.addEventListener('click', () => choose(i));
      li.addEventListener('pointermove', () => setActive(i));
      list.appendChild(li);
      return li;
    });
    wrap.append(btn, list);

    let active = 0;
    const isOpen = () => wrap.classList.contains('is-open');

    function render() {
      const o = sel.options[sel.selectedIndex];
      $('.dd__label', btn).textContent = o.text;
      const dot = $('.dd__dot', btn);
      dot.hidden = !o.dataset.dot;
      if (o.dataset.dot) dot.style.setProperty('--dot', o.dataset.dot);
      opts.forEach((li, i) => li.setAttribute('aria-selected', String(i === sel.selectedIndex)));
    }
    function setActive(i) {
      active = i;
      opts.forEach((li, n) => li.classList.toggle('is-active', n === i));
      opts[i].scrollIntoView({ block: 'nearest' });
    }
    function open() {
      const r = btn.getBoundingClientRect();
      const need = Math.min(list.scrollHeight, 288) + 16;
      wrap.classList.toggle('is-up', innerHeight - r.bottom < need && r.top > innerHeight - r.bottom);
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      setActive(sel.selectedIndex);
    }
    function close(focus) {
      wrap.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (focus) btn.focus();
    }
    function choose(i) {
      sel.selectedIndex = i;
      render();
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    }

    btn.addEventListener('click', () => (isOpen() ? close() : open()));
    btn.addEventListener('keydown', e => {
      const k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen()) return open();
        setActive((active + (k === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length);
      } else if (k === 'Home' || k === 'End') {
        if (isOpen()) { e.preventDefault(); setActive(k === 'Home' ? 0 : opts.length - 1); }
      } else if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        isOpen() ? choose(active) : open();
      } else if (k === 'Escape' && isOpen()) { e.stopPropagation(); close(true); }
      else if (k === 'Tab' && isOpen()) close();
    });
    document.addEventListener('pointerdown', e => { if (isOpen() && !wrap.contains(e.target)) close(); });

    render();
    return { sync: render };
  }

  const ddBranch = makeDropdown(branchSelect);
  const ddDrink = makeDropdown(drinkSelect);

  /* ---------- Background crossfade (2 layers, opacity only) ---------- */
  function setBg(colors) {
    const next = bgs[1 - bgCur], old = bgs[bgCur];
    next.style.transition = 'none';
    next.style.opacity = 0;
    next.style.background = `linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    next.style.zIndex = -1;
    old.style.zIndex = -2;
    void next.offsetWidth;
    next.style.transition = '';
    next.style.opacity = 1;
    bgCur = 1 - bgCur;
  }

  /* ---------- Select a drink (click, swipe, dropdown) ---------- */
  function select(i) {
    index = (i + DRINKS.length) % DRINKS.length;
    const d = DRINKS[index];

    cup.style.filter = d.filter; // CSS transition on .fluid-cup-image animates it
    if (!reduceMotion) {
      cup.classList.add('is-swap');
      requestAnimationFrame(() => requestAnimationFrame(() => cup.classList.remove('is-swap')));
    }

    body.style.setProperty('--accent', d.accent);
    body.style.setProperty('--accent-d', d.deep);
    body.style.setProperty('--on', d.on);
    body.dataset.theme = d.key;
    setBg(d.bg);
    if (metaTheme) metaTheme.setAttribute('content', d.bg[0]);

    nameEl.textContent = d.label;
    descEl.textContent = d.desc;
    priceEl.textContent = d.price;
    drinkSelect.value = d.label;
    ddDrink.sync();
    tabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === index));
      if (n === index) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    updatePreview();
  }

  tabs.forEach(t => t.addEventListener('click', () => select(+t.dataset.i)));
  $('#prev').addEventListener('click', () => select(index - 1));
  $('#next').addEventListener('click', () => select(index + 1));

  let startX = null, startY = 0;
  stage.addEventListener('pointerdown', e => { startX = e.clientX; startY = e.clientY; });
  stage.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) select(index + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener('pointercancel', () => { startX = null; });
  document.addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement.tagName) && document.activeElement.closest('.order')) return;
    if (e.key === 'ArrowRight') select(index + 1);
    if (e.key === 'ArrowLeft') select(index - 1);
  });

  drinkSelect.addEventListener('change', () => {
    const i = DRINKS.findIndex(d => d.label === drinkSelect.value);
    if (i > -1 && i !== index) select(i);
  });

  /* ---------- Pickup time (interactive) ---------- */
  const etaRange = $('#etaRange');
  const etaClock = $('#etaClock');
  const etaWhen = $('#etaWhen');
  const etaChips = $$('.eta__chip');
  let eta = 20;

  const pad = n => String(n).padStart(2, '0');
  const hhmm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const whenText = m => (m < 60 ? `${m} dəq sonra` : m % 60 ? `${Math.floor(m / 60)} saat ${m % 60} dəq sonra` : `${m / 60} saat sonra`);
  const etaTime = () => hhmm(new Date(Date.now() + eta * 60000));
  function isClosed() {
    const d = new Date(Date.now() + eta * 60000), t = d.getHours() * 60 + d.getMinutes();
    return t < 600 || t > 1350; // 10:00 – 22:30
  }

  function setEta(m, bump) {
    eta = m;
    etaRange.value = m;
    etaRange.style.setProperty('--p', ((m - 5) / 115 * 100) + '%');
    etaChips.forEach(c => c.setAttribute('aria-pressed', String(+c.dataset.min === m)));
    renderEta(bump);
    updatePreview();
  }
  function renderEta(bump) {
    etaClock.textContent = etaTime();
    etaWhen.textContent = whenText(eta) + (isClosed() ? ' · ⚠️ filial açıq deyil (10:00 - 22:30)' : '');
    if (bump && !reduceMotion) {
      etaClock.classList.remove('is-bump');
      void etaClock.offsetWidth;
      etaClock.classList.add('is-bump');
    }
  }
  etaRange.addEventListener('input', () => setEta(+etaRange.value, true));
  etaChips.forEach(c => c.addEventListener('click', () => setEta(+c.dataset.min, true)));
  setInterval(() => { renderEta(false); updatePreview(); clockTick(); }, 15000);

  /* ---------- Message / WhatsApp ---------- */
  const getData = () => ({
    name: nameInput.value.trim(),
    drink: drinkSelect.value,
    branch: branchSelect.value,
    size: (form.querySelector('input[name="size"]:checked') || {}).value || 'Kiçik'
  });
  const buildMessage = d =>
    `Salam PIMS! Mən yoldayam. Adım: ${d.name}. Filial: ${d.branch}. Sifarişim: ${d.size} ${d.drink}. Gəliş vaxtı: ${whenText(eta)} (${etaTime()}).`;

  function updatePreview() {
    const d = getData();
    previewEl.textContent = buildMessage({ ...d, name: d.name || '…' });
  }
  function clockTick() { clockEl.textContent = hhmm(new Date()); }
  clockTick();

  form.addEventListener('input', () => {
    nameInput.classList.remove('is-invalid');
    errorEl.textContent = '';
    updatePreview();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = getData();
    if (!d.name) {
      errorEl.textContent = 'Zəhmət olmasa adını yaz 🙈';
      nameInput.classList.add('is-invalid');
      nameInput.focus();
      return;
    }
    // Zero delay: open WhatsApp immediately (time is recalculated at the moment of sending)
    window.location.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildMessage(d))}`;
  });

  /* ---------- Init ---------- */
  select(index);
  setEta(eta, false);

  /* ---------- GSAP: subtle stagger fade-in on load ---------- */
  const fades = $$('[data-fade]');
  if (window.gsap && !reduceMotion) {
    gsap.to(fades, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08, delay: 0.1, clearProps: 'transform' });
  } else {
    document.documentElement.classList.remove('js');
  }
})();