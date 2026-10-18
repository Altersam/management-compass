// Альманах менеджера v6: оболочка и маршруты.
// #/ · #/lectures · #/lectures/3 · #/practice · #/lesson/3.2 · #/lesson/1.x · #/lesson/review · #/lesson/final · #/play/id · #/faq · #/faq/id
import {esc, md, icon, stars, logoMark, toast, progress, shuffle, plural} from './ui.js';
import {course, unitById, LEVELS} from '../content/course.js';
import {games, gameById} from '../content/games.js';
import {faq, faqById} from '../content/faq.js';
import {renderBlock, bindBlocks, initBlocks} from './blocks.js';

const view = document.getElementById('view');
const NAV = [['#/lectures', 'Лекции', 'book'], ['#/practice', 'Практика', 'path'], ['#/faq', 'FAQ', 'help']];
const DAILY = 30;
const totalSections = course.reduce((n, u) => n + u.sections.length, 0);
const totalEx = course.reduce((n, u) => n + u.lessons.reduce((m, l) => m + l.ex.length, 0), 0);
let cleanup = null, observer = null;

// ---------- shell ----------
function shell() {
  document.getElementById('topbar').innerHTML = `<div class="wrap"><a class="logo" href="#/">${logoMark}<span>Альманах менеджера</span></a><nav class="nav" aria-label="Разделы">${NAV.map(([h, t, i]) => `<a href="${h}">${icon(i)}${t}</a>`).join('')}</nav><div class="top-stats"><a class="stat-chip streak" href="#/practice" title="Серия дней">${icon('fire')}<span id="stStreak">0</span></a><a class="stat-chip" href="#/practice" title="Опыт">${icon('bolt')}<span id="stXp">0</span></a></div></div>`;
  document.getElementById('tabbar').innerHTML = [['#/', 'Главная', 'home'], ...NAV].map(([h, t, i]) => `<a href="${h}">${icon(i)}<span>${t}</span></a>`).join('');
}
function markNav(section) {
  const map = {lectures: '#/lectures', practice: '#/practice', lesson: '#/practice', play: '#/practice', faq: '#/faq', '': '#/'};
  const cur = map[section] || '';
  document.querySelectorAll('.nav a, .tabbar a').forEach(a => a.getAttribute('href') === cur ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  document.getElementById('stStreak').textContent = progress.streak();
  document.getElementById('stXp').textContent = progress.xp();
}
const footer = `<footer class="footer"><div class="wrap"><span>Альманах менеджера — лекции, практика и ответы по материалам курса для руководителей.</span><span>Прогресс хранится только в вашем браузере.</span></div></footer>`;

// ---------- progress helpers ----------
const free = () => !!progress.all().free;
const lessonDone = (u, l) => !!progress.lesson(`${u}.${l}`);
const unitLessons = u => [1, 2, 3].filter(l => lessonDone(u, l)).length;
const unitOpen = u => free() || u === 1 || unitLessons(u - 1) === 3;
const lessonOpen = (u, l) => unitOpen(u) && (free() || l === 1 || lessonDone(u, l - 1));
const bossOpen = u => free() || unitLessons(u) === 3;
const bossDone = u => unitById(u).boss.every(b => b === 'exam' ? lessonDone(u, 'x') : progress.stars(b) > 0);
const lessonsTotal = () => course.reduce((n, u) => n + unitLessons(u.id), 0);
function nextStep() {
  for (const u of course) {
    for (const l of [1, 2, 3]) if (!lessonDone(u.id, l)) return lessonOpen(u.id, l) ? {href: `#/lesson/${u.id}.${l}`, label: `${u.title}: ${LEVELS[l - 1]}`, u} : null;
    if (!bossDone(u.id)) { const b = u.boss.find(b => b === 'exam' ? !lessonDone(u.id, 'x') : !progress.stars(b)); return {href: b === 'exam' ? `#/lesson/${u.id}.x` : `#/play/${b}`, label: `${u.title}: испытание`, u}; }
  }
  return {href: '#/lesson/final', label: 'Итоговый экзамен', u: null};
}

// ---------- pages ----------
const pages = {
  home() {
    const n = nextStep() || {href: '#/practice', label: 'Практика'}, xpToday = progress.todayXp();
    const read = course.reduce((s, u) => s + progress.readCount(u.id), 0);
    return `<section class="wrap home-hero">
      <div><p class="label">Курс для руководителей · 10 тем</p><h1>Управленческие навыки: от лекции к решению</h1><p class="lead">Лекционные выжимки со схемами и тренажёрами, ежедневная практика с растущей сложностью и короткие ответы на частые рабочие вопросы.</p>
        <div class="home-actions"><a class="btn" href="${n.href}">${icon('play')} ${lessonsTotal() ? 'Продолжить практику' : 'Начать практику'}</a><a class="btn ghost" href="#/lectures">${icon('book')} Открыть лекции</a></div></div>
      <aside class="card continue"><div class="section-head" style="margin:0"><h2>Ваш прогресс</h2><span class="label">сегодня ${xpToday}/${DAILY} XP</span></div>
        <div class="bar" role="progressbar" aria-label="Дневная цель" aria-valuemin="0" aria-valuemax="${DAILY}" aria-valuenow="${Math.min(xpToday, DAILY)}"><i style="width:${Math.min(100, xpToday / DAILY * 100)}%"></i></div>
        <div class="kpis"><div class="kpi"><span>Серия</span><b>${progress.streak()} дн.</b></div><div class="kpi"><span>Опыт</span><b>${progress.xp()}</b></div><div class="kpi"><span>Уроки</span><b>${lessonsTotal()}/30</b></div></div>
        <a class="next-step" href="${n.href}"><span><span class="label">Следующий шаг</span><b>${esc(n.label)}</b></span>${icon('arrow')}</a>
        <p class="muted" style="font-size:13px">Прочитано разделов лекций: ${read} из ${totalSections}</p></aside></section>
      <section class="wrap section"><div class="grid c3">
        <a class="card pillar" href="#/lectures"><span class="pic">${icon('book')}</span><h3>Лекции</h3><p>${totalSections} разделов по 10 темам — выжимка исходных лекций: схемы, таблицы, кликабельные модели, калькуляторы и самопроверка.</p><span class="go">Читать ${icon('arrow')}</span></a>
        <a class="card pillar" href="#/practice"><span class="pic">${icon('path')}</span><h3>Практика</h3><p>${totalEx} заданий восьми типов: от «верно/неверно» до кейсов. 30 уроков, 3 жизни, серия дней и испытания‑симуляции.</p><span class="go">Тренироваться ${icon('arrow')}</span></a>
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
          <div class="row"><a class="btn small" href="#/lesson/${u.id}.1">${icon('path')} Практика по теме</a>${relatedFaq(u.id).length ? `<a class="btn small ghost" href="#/faq" data-topicfaq="${u.id}">${icon('help')} Вопросы по теме</a>` : ''}</div></header>
        ${u.sections.map((s, i) => `<section class="lec-sec" id="s${i + 1}" data-read="${u.id}.${i}"><div class="lec-sec-head"><p class="label">Раздел ${i + 1} из ${u.sections.length}</p><h2>${esc(s.title)}</h2></div><p class="thesis">${md(s.thesis)}</p><div class="blocks">${s.blocks.map((b, k) => renderBlock(b, `${u.id}.${i}.${k}`)).join('')}</div><span class="read-mark" aria-hidden="true"></span></section>`).join('')}
        <div class="lec-next"><a class="btn" href="#/lesson/${u.id}.1">${icon('path')} Закрепить в практике</a><a class="btn ghost" href="#/lectures/${next.id}">Лекция ${next.id}: ${esc(next.title)} ${icon('arrow')}</a></div>
      </article></div>${footer}`;
  },

  practice() {
    const xpToday = progress.todayXp(), anyDone = lessonsTotal() > 0, allDone = course.every(u => unitLessons(u.id) === 3);
    return `<section class="wrap page-head"><p class="label">Практика</p><h1>Путь руководителя</h1><p>Каждая тема — три урока растущей сложности и испытание. Ошибка стоит жизни, а задание возвращается в конец урока.</p></section>
      <section class="wrap"><div class="pr-stats card"><div><span class="label">Дневная цель</span><b>${xpToday} / ${DAILY} XP</b><div class="bar"><i style="width:${Math.min(100, xpToday / DAILY * 100)}%"></i></div></div><div><span class="label">Серия</span><b>${icon('fire')} ${plural(progress.streak(), 'день', 'дня', 'дней')}</b></div><div><span class="label">Опыт</span><b>${icon('bolt')} ${progress.xp()}</b></div><div class="pr-actions"><a class="btn ${anyDone ? 'secondary' : 'ghost'} small" href="#/lesson/review" ${anyDone ? '' : 'aria-disabled="true" tabindex="-1"'}>${icon('replay')} Повторение</a></div></div></section>
      <section class="wrap path">${course.map(unitBlock).join('')}
        <div class="unit card unit-final"><div class="unit-head"><div><p class="label">Финал</p><h2>Итоговый экзамен</h2><p class="muted">15 заданий из всех тем за 5 минут.</p></div>${node(allDone || free() ? (lessonDone('final', '') ? 'done' : 'open') : 'locked', '#/lesson/final', 'Экзамен', 'Все темы', 'crown')}</div></div>
        <p class="muted" style="margin-top:20px;font-size:14px">${free() ? 'Все уровни открыты.' : 'Уровни открываются по порядку.'} <button class="link-btn" data-free="${free() ? 0 : 1}">${free() ? 'Вернуть последовательное открытие' : 'Открыть все уровни'}</button></p></section>${footer}`;
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
  const r = progress.readCount(u.id), l = unitLessons(u.id);
  return `<a class="card lec-row" data-t="${u.id}" href="#/lectures/${u.id}"><span class="lec-num">${String(u.id).padStart(2, '0')}</span><div><h3>${esc(u.full)}</h3><p>${esc(u.lead)}</p></div><div class="lec-meta"><small>${r}/${u.sections.length} разделов · ${l}/3 урока</small><div class="bar" style="width:120px"><i style="width:${r / u.sections.length * 100}%"></i></div></div></a>`;
}
function node(state, href, title, sub, ic) {
  const body = `<span class="node-dot">${icon(state === 'locked' ? 'lock' : state === 'done' ? 'check' : ic)}</span><span class="node-text"><b>${esc(title)}</b><small>${sub}</small></span>`;
  return state === 'locked' ? `<span class="node is-locked" aria-disabled="true">${body}</span>` : `<a class="node is-${state}" href="${href}">${body}${state === 'open' ? `<span class="node-go">Начать</span>` : ''}</a>`;
}
function unitBlock(u) {
  const open = unitOpen(u.id), done = unitLessons(u.id);
  const nodes = [1, 2, 3].map(l => {
    const st = lessonDone(u.id, l) ? 'done' : lessonOpen(u.id, l) ? 'open' : 'locked', rec = progress.lesson(`${u.id}.${l}`);
    return node(st, `#/lesson/${u.id}.${l}`, `${l}. ${LEVELS[l - 1]}`, `${plural(u.lessons[l - 1].ex.length, 'задание', 'задания', 'заданий')}${rec ? ` · ошибок: ${rec.best}` : ''}`, ['sparkle', 'layers', 'users'][l - 1]);
  });
  const bosses = u.boss.map(b => {
    if (b === 'exam') return node(lessonDone(u.id, 'x') ? 'done' : bossOpen(u.id) ? 'open' : 'locked', `#/lesson/${u.id}.x`, 'Испытание: экзамен на время', '10 заданий за 2,5 минуты', 'clock');
    const g = gameById(b), s = progress.stars(b);
    return node(s ? 'done' : bossOpen(u.id) ? 'open' : 'locked', `#/play/${b}`, `Испытание: ${g.title}`, s ? stars(s) : `симуляция · ${g.minutes} мин`, 'game');
  });
  return `<div class="unit card ${open ? '' : 'is-locked'}" data-t="${u.id}" id="unit-${u.id}"><div class="unit-head"><div><p class="label"><span class="dot"></span> Тема ${u.id}</p><h2>${esc(u.title)}</h2></div><div class="unit-prog"><small>${done}/3</small><div class="bar"><i style="width:${done / 3 * 100}%"></i></div><a class="link" href="#/lectures/${u.id}">Лекция</a></div></div><div class="nodes">${nodes.join('')}${bosses.join('')}</div></div>`;
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
    <div class="faq-links"><a class="chip" href="#/lectures/${u.id}" data-jump="s${f.lec[1] + 1}">${icon('book')} ${esc(sec.title)}</a>${g ? `<a class="chip" href="#/play/${g.id}">${icon('game')} Испытание «${esc(g.title)}»</a>` : ''}</div></div></details>`;
}

// ---------- lesson & game screens ----------
function lessonSpec(key) {
  const pick = (pool, n) => shuffle(pool).slice(0, n);
  if (key === 'review') {
    const pool = course.flatMap(u => u.lessons.flatMap((l, i) => lessonDone(u.id, i + 1) ? l.ex : []));
    return {title: 'Повторение', kicker: 'Повторение', exercises: pick(pool.length ? pool : course[0].lessons[0].ex, 10)};
  }
  if (key === 'final') return {title: 'Итоговый экзамен', kicker: 'Итоговый экзамен', exercises: pick(course.flatMap(u => u.lessons.flatMap(l => l.ex)), 15), seconds: 300, saveKey: 'final.'};
  const [uid, l] = key.split('.'), u = unitById(uid); if (!u) return null;
  if (l === 'x') return {title: `${u.title}: экзамен`, kicker: `Тема ${u.id} · испытание`, exercises: pick(u.lessons.flatMap(x => x.ex), 10), seconds: 150, u};
  const lesson = u.lessons[Number(l) - 1]; if (!lesson) return null;
  return {title: `${u.title}: ${lesson.title}`, kicker: `Тема ${u.id} · урок ${l}`, exercises: shuffle(lesson.ex), u};
}
async function openLesson(key) {
  const spec = lessonSpec(key); if (!spec) { view.innerHTML = pages.notFound(); return; }
  const {mountLesson} = await import('./practice.js');
  document.body.classList.add('focus'); document.title = `${spec.title} — Альманах менеджера`;
  const back = spec.u ? `#/practice` : '#/practice';
  const inst = mountLesson(view, {...spec, back, onFinish: r => { if (r.passed) { progress.saveLesson(spec.saveKey || key, r); markNav('lesson'); } }});
  cleanup = () => { inst.destroy(); document.body.classList.remove('focus'); };
}
async function openGame(id) {
  const meta = gameById(id); if (!meta) { view.innerHTML = pages.notFound(); return; }
  document.title = `${meta.title} — Альманах менеджера`;
  const [{mountGame}, mod] = await Promise.all([import('./games/kit.js'), import(`./games/${id}.js`)]);
  const u = unitById(meta.topic), f = faq.filter(x => x.game === id).slice(0, 2);
  const more = `<a class="card side-link" href="#/lectures/${u.id}"><span class="pic">${icon('book')}</span><span><b>${esc(u.title)}</b><small>Лекция по теме</small></span></a>${f.map(x => `<a class="card side-link" href="#/faq/${x.id}"><span class="pic">${icon('help')}</span><span><b>${esc(x.title)}</b><small>FAQ</small></span></a>`).join('')}`;
  window.scrollTo(0, 0);
  const inst = mountGame(view, meta, mod, {back: `#/practice`, backLabel: 'Практика', topicTitle: `Тема ${u.id}. ${u.title}`, more, onFinish: () => markNav('play')});
  window.__game = inst; cleanup = () => { inst.destroy(); window.__game = null; };
}

// ---------- router ----------
const ALIAS = {theory: 'lectures', topic: 'lectures', games: 'practice', help: 'faq'};
async function route() {
  cleanup?.(); cleanup = null; observer?.disconnect(); observer = null;
  let [, section = '', arg] = (location.hash || '#/').slice(1).split('/');
  section = ALIAS[section] || section;
  if (section === 'practice' && arg) arg = '';
  markNav(section);
  if (section === 'lesson') return openLesson(arg);
  if (section === 'play') return openGame(arg);
  let html;
  if (section === '') html = pages.home();
  else if (section === 'lectures') html = arg ? pages.lecture(arg) : pages.lectures();
  else if (section === 'practice') html = pages.practice();
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
  if (section === 'practice') return `Практика — ${base}`;
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
  const fr = e.target.closest('[data-free]');
  if (fr) { const d = progress.all(); d.free = fr.dataset.free === '1' ? 1 : 0; try { localStorage.setItem('almanac:v6', JSON.stringify(d)); } catch {} route(); return; }
  const dis = e.target.closest('a[aria-disabled="true"]'); if (dis) { e.preventDefault(); toast('Сначала пройдите хотя бы один урок'); return; }
  const copy = e.target.closest('[data-copy]');
  if (copy) navigator.clipboard?.writeText(copy.dataset.copy).then(() => toast('Фраза скопирована'), () => toast('Не удалось скопировать'));
});
view.addEventListener('input', e => { if (e.target.id === 'faqSearch') { faqState.q = e.target.value; document.getElementById('faqList').innerHTML = faqList(); } });
bindBlocks(view);
window.addEventListener('hashchange', route);
shell(); route();
