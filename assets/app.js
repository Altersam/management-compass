// Альманах менеджера v7: оболочка и маршруты.
// #/ · #/lectures · #/lectures/3 · #/games · #/play/id/2 · #/faq · #/faq/id
import {esc, md, icon, stars, logoMark, toast, progress, plural} from './ui.js';
import {course, unitById} from '../content/course.js';
import {LEVEL_NAMES, levelKey, levelOpen, UNLOCK} from './games/kit.js';
import {sfx} from './juice.js';
import {games, gameById} from '../content/games.js';
import {faq, faqById} from '../content/faq.js';
import {renderBlock, bindBlocks, initBlocks} from './blocks.js';

const view = document.getElementById('view');
const NAV = [['#/games', 'Игры', 'game'], ['#/lectures', 'Лекции', 'book'], ['#/faq', 'FAQ', 'help']];
const DAILY = 30;
const totalSections = course.reduce((n, u) => n + u.sections.length, 0);
const MAXSTARS = games.length * 9;
let cleanup = null, observer = null;

// ---------- shell ----------
function shell() {
  document.getElementById('topbar').innerHTML = `<div class="wrap"><a class="logo" href="#/">${logoMark}<span>Альманах менеджера</span></a><nav class="nav" aria-label="Разделы">${NAV.map(([h, t, i]) => `<a href="${h}">${icon(i)}${t}</a>`).join('')}</nav><div class="top-stats"><a class="stat-chip streak" href="#/games" title="Серия дней">${icon('fire')}<span id="stStreak">0</span></a><a class="stat-chip" href="#/games" title="Опыт">${icon('bolt')}<span id="stXp">0</span></a><button class="stat-chip sound-btn" id="soundBtn" type="button" aria-pressed="true" title="Звук в играх">${icon('sound')}<span class="sr-only">Звук</span></button></div></div>`;
  document.getElementById('tabbar').innerHTML = [['#/', 'Главная', 'home'], ...NAV].map(([h, t, i]) => `<a href="${h}">${icon(i)}<span>${t}</span></a>`).join('');
}
function markNav(section) {
  const map = {lectures: '#/lectures', games: '#/games', play: '#/games', faq: '#/faq', '': '#/'};
  const cur = map[section] || '';
  document.querySelectorAll('.nav a, .tabbar a').forEach(a => a.getAttribute('href') === cur ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  document.getElementById('stStreak').textContent = progress.streak();
  document.getElementById('stXp').textContent = progress.xp();
}
const footer = `<footer class="footer"><div class="wrap"><span>Альманах менеджера — лекции, игры и ответы по материалам курса для руководителей.</span><span>Прогресс хранится только в вашем браузере.</span></div></footer>`;

// ---------- progress helpers ----------
const levelStars = id => [0, 1, 2].map(l => progress.stars(levelKey(id, l)));
const gameStars = id => levelStars(id).reduce((a, b) => a + b, 0);
const totalStars = () => games.reduce((n, g) => n + gameStars(g.id), 0);
const nextLevel = id => { const st = levelStars(id); for (let l = 0; l < 3; l++) if (st[l] < 3 && levelOpen(id, l)) return l; return 2; };
function nextStep() {
  for (const u of course) for (const id of u.games) { const st = levelStars(id); const l = st.findIndex(x => x < UNLOCK); if (l !== -1) return {href: `#/play/${id}/${l + 1}`, label: `${gameById(id).title}: уровень ${l + 1}`}; }
  return {href: '#/games', label: 'Все игры пройдены — можно добрать звёзды'};
}

// ---------- pages ----------
const pages = {
  home() {
    const n = nextStep(), xpToday = progress.todayXp();
    const read = course.reduce((s, u) => s + progress.readCount(u.id), 0);
    return `<section class="wrap home-hero">
      <div><p class="label">Курс для руководителей · 10 тем</p><h1>Управленческие навыки: от лекции к решению</h1><p class="lead">${games.length} игр‑симуляций с тремя уровнями сложности, лекционные выжимки со схемами и короткие ответы на частые рабочие вопросы.</p>
        <div class="home-actions"><a class="btn" href="${n.href}">${icon('play')} ${totalStars() ? 'Продолжить игру' : 'Начать играть'}</a><a class="btn ghost" href="#/lectures">${icon('book')} Открыть лекции</a></div></div>
      <aside class="card continue"><div class="section-head" style="margin:0"><h2>Ваш прогресс</h2><span class="label">сегодня ${xpToday}/${DAILY} XP</span></div>
        <div class="bar" role="progressbar" aria-label="Дневная цель" aria-valuemin="0" aria-valuemax="${DAILY}" aria-valuenow="${Math.min(xpToday, DAILY)}"><i style="width:${Math.min(100, xpToday / DAILY * 100)}%"></i></div>
        <div class="kpis"><div class="kpi"><span>Серия</span><b>${progress.streak()} дн.</b></div><div class="kpi"><span>Опыт</span><b>${progress.xp()}</b></div><div class="kpi"><span>Звёзды</span><b>${totalStars()}/${MAXSTARS}</b></div></div>
        <a class="next-step" href="${n.href}"><span><span class="label">Следующий шаг</span><b>${esc(n.label)}</b></span>${icon('arrow')}</a>
        <p class="muted" style="font-size:13px">Прочитано разделов лекций: ${read} из ${totalSections}</p></aside></section>
      <section class="wrap section"><div class="grid c3">
        <a class="card pillar" href="#/games"><span class="pic">${icon('game')}</span><h3>Игры</h3><p>${games.length} симуляций — по одной‑две на каждую тему. У каждой три уровня: «Знакомство», «Давление», «Мастер». Звёзды открывают следующий уровень.</p><span class="go">Играть ${icon('arrow')}</span></a>
        <a class="card pillar" href="#/lectures"><span class="pic">${icon('book')}</span><h3>Лекции</h3><p>${totalSections} разделов по 10 темам — выжимка исходных лекций: схемы, таблицы, кликабельные модели, калькуляторы и самопроверка.</p><span class="go">Читать ${icon('arrow')}</span></a>
        <a class="card pillar" href="#/faq"><span class="pic">${icon('help')}</span><h3>FAQ</h3><p>${faq.length} частых вопросов: короткий ответ, причины, шаги, готовая фраза и ссылка на нужный раздел лекции.</p><span class="go">Найти ответ ${icon('arrow')}</span></a>
      </div></section>
      <section class="wrap section"><div class="section-head"><h2>Темы курса</h2><a class="link" href="#/lectures">Все лекции →</a></div><div class="lec-list">${course.map(lecRow).join('')}</div></section>
      <section class="wrap section"><div class="section-head"><h2>Частые вопросы</h2><a class="link" href="#/faq">Весь FAQ →</a></div><div class="filters">${['no-time', 'wrong-result', 'asks-permission', 'meeting-no-decision', 'other-dept-slow', 'old-way', 'metric-lies'].map(id => `<a class="chip" href="#/faq/${id}">${esc(faqById(id).title)}</a>`).join('')}</div></section>${footer}`;
  },

  lectures() {
    return `<section class="wrap page-head"><p class="label">Лекции</p><h1>Десять тем курса</h1><p>Каждая лекция повторяет структуру исходных материалов и сжимает её до главного: тезис раздела, схемы и интерактивные модели, проверка понимания.</p></section>
      <section class="wrap section" style="padding-top:8px"><div class="lec-list">${course.map(lecRow).join('')}</div></section>${footer}`;
  },

  lecture(id) {
    const u = unitById(id); if (!u) return pages.notFound();
    const next = unitById(u.id % course.length + 1);
    return `<div class="wrap lec" data-t="${u.id}">
      <nav class="lec-side" aria-label="Разделы лекции">${u.sections.map((s, i) => `<a href="#/lectures/${u.id}" data-jump="s${i + 1}" class="${progress.isRead(`${u.id}.${i}`) ? 'is-read' : ''}"><span>${progress.isRead(`${u.id}.${i}`) ? '✓' : i + 1}</span>${esc(s.title)}</a>`).join('')}</nav>
      <article>
        <header class="lec-head"><p class="label">Лекция ${u.id} · ${plural(u.sections.length, 'раздел', 'раздела', 'разделов')}</p><h1>${esc(u.full)}</h1><p>${esc(u.lead)}</p>
          <div class="row"><a class="btn small" href="#/games" data-jump="topic-${u.id}">${icon('game')} Игры по теме</a>${relatedFaq(u.id).length ? `<a class="btn small ghost" href="#/faq" data-topicfaq="${u.id}">${icon('help')} Вопросы по теме</a>` : ''}</div></header>
        ${u.sections.map((s, i) => `<section class="lec-sec" id="s${i + 1}" data-read="${u.id}.${i}"><div class="lec-sec-head"><p class="label">Раздел ${i + 1} из ${u.sections.length}</p><h2>${esc(s.title)}</h2></div><p class="thesis">${md(s.thesis)}</p><div class="blocks">${s.blocks.map((b, k) => renderBlock(b, `${u.id}.${i}.${k}`)).join('')}</div><span class="read-mark" aria-hidden="true"></span></section>`).join('')}
        <div class="lec-next">${u.games.map(id => `<a class="btn" href="#/play/${id}/${nextLevel(id) + 1}">${icon('play')} Сыграть: ${esc(gameById(id).title)}</a>`).join('')}<a class="btn ghost" href="#/lectures/${next.id}">Лекция ${next.id}: ${esc(next.title)} ${icon('arrow')}</a></div>
      </article></div>${footer}`;
  },

  games() {
    const xpToday = progress.todayXp();
    return `<section class="wrap page-head"><p class="label">Игры</p><h1>Решения с последствиями</h1><p>У каждой темы курса — своя симуляция. Три уровня: «Знакомство» с подсказками, «Давление» с меньшими ресурсами и «Мастер» без подсказок. ${UNLOCK} звезды открывают следующий уровень.</p></section>
      <section class="wrap"><div class="pr-stats card"><div><span class="label">Дневная цель</span><b>${xpToday} / ${DAILY} XP</b><div class="bar"><i style="width:${Math.min(100, xpToday / DAILY * 100)}%"></i></div></div><div><span class="label">Серия</span><b>${icon('fire')} ${plural(progress.streak(), 'день', 'дня', 'дней')}</b></div><div><span class="label">Звёзды</span><b>${icon('star')} ${totalStars()} / ${MAXSTARS}</b></div><div class="pr-actions"><a class="btn small" href="${nextStep().href}">${icon('play')} Следующая игра</a></div></div></section>
      <section class="wrap gm-list">${course.map(u => `<div class="gm-topic" id="topic-${u.id}" data-t="${u.id}"><div class="gm-topic-head"><p class="label"><span class="dot"></span> Тема ${u.id}</p><h2>${esc(u.title)}</h2><a class="link" href="#/lectures/${u.id}">Лекция</a></div>${u.games.map(gameCard).join('')}</div>`).join('')}</section>${footer}`;
  },

  faq(openId = '') {
    return `<section class="wrap page-head"><p class="label">FAQ</p><h1>Частые управленческие вопросы</h1><p>Короткий ответ, причины, шаги и фраза, которую можно сказать уже сегодня. Каждый ответ связан с разделом лекции и практикой.</p></section>
      <section class="wrap"><div class="faq-tools"><label class="search">${icon('search')}<span class="sr-only">Поиск по вопросам</span><input id="faqSearch" type="search" placeholder="Например: сроки, совещание, сотрудник…" value="${esc(faqState.q)}" autocomplete="off"></label>
        <div class="filters" role="group" aria-label="Темы"><button class="chip" data-topic="all" aria-pressed="${faqState.t === 'all'}">Все темы</button>${course.filter(u => relatedFaq(u.id).length).map(u => `<button class="chip" data-topic="${u.id}" aria-pressed="${String(faqState.t) === String(u.id)}">${esc(u.title)}</button>`).join('')}</div></div>
        <div id="faqList">${faqList(openId)}</div></section>${footer}`;
  },

  notFound() { return `<section class="wrap page-head"><h1>Такой страницы нет</h1><p><a class="link" href="#/">На главную</a></p></section>`; }
};

function lecRow(u) {
  const r = progress.readCount(u.id), st = u.games.reduce((n, id) => n + gameStars(id), 0);
  return `<a class="card lec-row" data-t="${u.id}" href="#/lectures/${u.id}"><span class="lec-num">${String(u.id).padStart(2, '0')}</span><div><h3>${esc(u.full)}</h3><p>${esc(u.lead)}</p></div><div class="lec-meta"><small>${r}/${u.sections.length} разделов · ${st}/${u.games.length * 9} ★</small><div class="bar" style="width:120px"><i style="width:${r / u.sections.length * 100}%"></i></div></div></a>`;
}
function gameCard(id) {
  const g = gameById(id), st = levelStars(id), nl = nextLevel(id);
  const lv = [0, 1, 2].map(l => { const open = levelOpen(id, l); return open ? `<a class="gm-lv ${st[l] ? 'is-done' : ''} ${l === nl ? 'is-next' : ''}" href="#/play/${id}/${l + 1}"><span>Уровень ${l + 1}</span><b>${LEVEL_NAMES[l]}</b>${stars(st[l])}</a>` : `<span class="gm-lv is-locked" aria-disabled="true"><span>Уровень ${l + 1}</span><b>${icon('lock')} ${LEVEL_NAMES[l]}</b><small>${UNLOCK}★ на уровне ${l}</small></span>`; }).join('');
  return `<article class="card gm-card"><div class="gm-main"><span class="gm-ic">${icon(g.icon)}</span><div><h3>${esc(g.title)}</h3><p>${esc(g.hook)}</p><p class="gm-skill">${icon('target')} ${esc(g.skill)} · ${g.minutes} мин</p></div><a class="btn gm-play" href="#/play/${id}/${nl + 1}">${icon('play')} ${gameStars(id) ? 'Играть' : 'Начать'}</a></div><div class="gm-levels">${lv}</div></article>`;
}

const faqState = {q: '', t: 'all'};
const relatedFaq = t => faq.filter(f => f.topic === t);
function faqList(openId = '') {
  const q = faqState.q.toLowerCase().trim();
  const list = faq.filter(f => (faqState.t === 'all' || String(f.topic) === String(faqState.t)) && (!q || [f.title, f.a, ...f.why, ...f.steps.flat(), f.phrase].join(' ').toLowerCase().includes(q)));
  if (!list.length) return `<div class="card empty">Ничего не нашлось. Попробуйте другое слово или <button class="link-btn" data-topic="all">сбросьте фильтр</button>.</div>`;
  return course.map(u => { const items = list.filter(f => f.topic === u.id); return items.length ? `<div class="faq-group" data-t="${u.id}"><h2><span class="dot"></span>${esc(u.title)}</h2>${items.map(f => faqItem(f, f.id === openId)).join('')}</div>` : ''; }).join('');
}
function faqItem(f, open) {
  const u = unitById(f.lec[0]), sec = u.sections[f.lec[1]], g = gameById(f.game);
  return `<details class="faq-item" id="faq-${f.id}" ${open ? 'open' : ''}><summary><span>${esc(f.title)}</span>${icon('plus')}</summary><div class="faq-body">
    <p class="faq-short">${esc(f.a)}</p>
    <div class="faq-cols"><div><p class="label" style="margin-bottom:8px">Почему так бывает</p><ul class="faq-why">${f.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div><div><p class="label" style="margin-bottom:8px">Что сделать</p><ol class="faq-do">${f.steps.map(([b, s]) => `<li><div><b>${esc(b)}</b><span>${esc(s)}</span></div></li>`).join('')}</ol></div></div>
    <div class="phrase"><span class="label">Что можно сказать</span><span>«${esc(f.phrase)}»</span><span><button class="btn small ghost" data-copy="${esc(f.phrase)}">${icon('copy')} Скопировать</button></span></div>
    <div class="faq-links"><a class="chip" href="#/lectures/${u.id}" data-jump="s${f.lec[1] + 1}">${icon('book')} ${esc(sec.title)}</a>${g ? `<a class="chip" href="#/play/${g.id}/1">${icon('game')} Игра «${esc(g.title)}»</a>` : ''}</div></div></details>`;
}

// ---------- game screen ----------
async function openGame(id, lvArg) {
  const meta = gameById(id); if (!meta) { view.innerHTML = pages.notFound(); return; }
  let level = Math.min(2, Math.max(0, (Number(lvArg) || 1) - 1));
  if (!levelOpen(id, level)) { toast(`Уровень ${level + 1} откроется после ${UNLOCK} звёзд на уровне ${level}`); level = nextLevel(id); history.replaceState(null, '', `#/play/${id}/${level + 1}`); }
  document.title = `${meta.title} — Альманах менеджера`;
  const mod = await import(`./games/${id}.js`), {mountGame} = await import('./games/kit.js');
  const u = unitById(meta.topic), f = faq.filter(x => x.game === id).slice(0, 2);
  const more = `<a class="card side-link" href="#/lectures/${u.id}"><span class="pic">${icon('book')}</span><span><b>${esc(u.title)}</b><small>Лекция по теме</small></span></a>${f.map(x => `<a class="card side-link" href="#/faq/${x.id}"><span class="pic">${icon('help')}</span><span><b>${esc(x.title)}</b><small>FAQ</small></span></a>`).join('')}`;
  window.scrollTo(0, 0);
  const inst = mountGame(view, meta, mod, {level, back: '#/games', backLabel: 'Игры', topicTitle: `Тема ${u.id}. ${u.title}`, more, onFinish: () => markNav('play')});
  window.__game = inst; cleanup = () => { inst.destroy(); window.__game = null; };
}

// ---------- router ----------
const ALIAS = {theory: 'lectures', topic: 'lectures', practice: 'games', lesson: 'games', help: 'faq'};
async function route() {
  cleanup?.(); cleanup = null; observer?.disconnect(); observer = null;
  let [, section = '', arg, arg2] = (location.hash || '#/').slice(1).split('/');
  section = ALIAS[section] || section;
  if (section === 'games') arg = '';
  markNav(section);
  if (section === 'play') return openGame(arg, arg2);
  let html;
  if (section === '') html = pages.home();
  else if (section === 'lectures') html = arg ? pages.lecture(arg) : pages.lectures();
  else if (section === 'games') html = pages.games();
  else if (section === 'faq') html = pages.faq(arg);
  else html = pages.notFound();
  view.innerHTML = `<div class="view-enter">${html}</div>`;
  document.title = titleFor(section, arg);
  initBlocks(view);
  if (section === 'lectures' && arg) watchReading();
  let jump = sessionStorage.getItem('jump'); sessionStorage.removeItem('jump');
  if (section === 'faq' && arg) jump = 'faq-' + arg;
  const target = jump && document.getElementById(jump);
  if (target) target.scrollIntoView({block: 'start'}); else window.scrollTo(0, 0);
}
function titleFor(section, arg) {
  const base = 'Альманах менеджера';
  if (section === 'lectures') return arg && unitById(arg) ? `${unitById(arg).title} — ${base}` : `Лекции — ${base}`;
  if (section === 'games') return `Игры — ${base}`;
  if (section === 'faq') return arg && faqById(arg) ? `${faqById(arg).title} — ${base}` : `FAQ — ${base}`;
  return base;
}
// A section counts as read when its end scrolls into view.
function watchReading() {
  const side = [...view.querySelectorAll('.lec-side a')];
  if (!('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(entries => entries.forEach(e => {
    const sec = e.target.closest('.lec-sec'), i = [...view.querySelectorAll('.lec-sec')].indexOf(sec);
    if (e.target.classList.contains('read-mark') && e.isIntersecting) { progress.read(sec.dataset.read); side[i]?.classList.add('is-read'); if (side[i]) side[i].querySelector('span').textContent = '✓'; }
    if (e.target.classList.contains('lec-sec-head') && e.isIntersecting) side.forEach((a, k) => a.classList.toggle('is-active', k === i));
  }), {rootMargin: '0px 0px -40% 0px'});
  view.querySelectorAll('.read-mark, .lec-sec-head').forEach(el => observer.observe(el));
}

// ---------- events ----------
view.addEventListener('click', e => {
  const jump = e.target.closest('[data-jump]');
  if (jump) {
    const el = document.getElementById(jump.dataset.jump);
    if (el && location.hash === jump.getAttribute('href')) { e.preventDefault(); el.scrollIntoView({behavior: 'smooth', block: 'start'}); return; }
    sessionStorage.setItem('jump', jump.dataset.jump);
  }
  const tf = e.target.closest('[data-topicfaq]'); if (tf) { faqState.t = tf.dataset.topicfaq; faqState.q = ''; }
  const topicBtn = e.target.closest('[data-topic]');
  if (topicBtn) { faqState.t = topicBtn.dataset.topic; view.querySelectorAll('.filters [data-topic]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.topic === faqState.t))); document.getElementById('faqList').innerHTML = faqList(); return; }
  const lock = e.target.closest('.gm-lv.is-locked'); if (lock) { sfx.bad(); toast(`Наберите ${UNLOCK} звезды на предыдущем уровне`); return; }
  const copy = e.target.closest('[data-copy]');
  if (copy) navigator.clipboard?.writeText(copy.dataset.copy).then(() => toast('Фраза скопирована'), () => toast('Не удалось скопировать'));
});
view.addEventListener('input', e => { if (e.target.id === 'faqSearch') { faqState.q = e.target.value; document.getElementById('faqList').innerHTML = faqList(); } });
bindBlocks(view);
window.addEventListener('hashchange', route);
shell();
const soundBtn = document.getElementById('soundBtn');
const syncSound = () => { soundBtn.setAttribute('aria-pressed', String(sfx.on())); soundBtn.classList.toggle('is-off', !sfx.on()); };
soundBtn.addEventListener('click', () => { sfx.toggle(); syncSound(); sfx.pick(); }); syncSound();
route();
