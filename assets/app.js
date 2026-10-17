// Альманах менеджера v5: оболочка и маршруты (#/, #/theory, #/theory/3, #/games, #/play/id, #/help, #/help/id).
import {esc, icon, stars, logoMark, toast, progress} from './ui.js';
import {topics, topicById} from '../content/topics.js';
import {games, gameById} from '../content/games.js';
import {help, helpById} from '../content/help.js';
import {renderVis, bindVis} from './vis.js';
import {scene, heroArt} from './art.js';

const view = document.getElementById('view');
const nav = [['#/theory', 'Теория', 'book'], ['#/games', 'Игры', 'game'], ['#/help', 'Что делать, если…', 'help']];
const maxStars = games.length * 3;

function shell() {
  document.getElementById('topbar').innerHTML = `<div class="wrap"><a class="logo" href="#/">${logoMark}<span>Альманах<small>менеджера</small></span></a><nav class="nav" aria-label="Разделы">${nav.map(([h, t, i]) => `<a href="${h}">${icon(i)}${t}</a>`).join('')}</nav><a class="stars-pill" href="#/games" aria-label="Звёзды за игры">${icon('star')}<span id="starCount">0</span>/${maxStars}</a></div>`;
  document.getElementById('tabbar').innerHTML = [['#/', 'Главная', 'home'], ...nav.map(([h, t, i]) => [h, t === 'Что делать, если…' ? 'Если…' : t, i])].map(([h, t, i]) => `<a href="${h}">${icon(i)}<span>${t}</span></a>`).join('');
}
function markNav(path) {
  const section = '#/' + (path.split('/')[1] || '');
  const map = {'#/topic': '#/theory', '#/play': '#/games'};
  const current = map[section] || section;
  document.querySelectorAll('.nav a, .tabbar a').forEach(a => a.getAttribute('href') === current ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  document.getElementById('starCount').textContent = progress.total();
}

const footer = `<footer class="footer"><div class="wrap"><span>Альманах менеджера — тренажёр управленческих навыков по материалам курса.</span><span>Прогресс хранится только в вашем браузере.</span></div></footer>`;

const gameTile = g => `<a class="card tile" data-c="${g.c}" href="#/play/${g.id}"><div class="tile-art">${scene(g.id)}</div><div class="tile-body"><h3>${esc(g.title)}</h3><p>${esc(g.hook)}</p><div class="tile-meta">${stars(progress.stars(g.id))}<span class="tag">${icon('clock')} ${g.minutes} мин</span></div></div></a>`;
const topicTile = t => { const done = progress.quizDone(`t${t.id}.`); return `<a class="card tile" data-c="${t.c}" href="#/theory/${t.id}"><div class="tile-art"><span class="num">${String(t.id).padStart(2, '0')}</span>${icon(t.icon, 'scene-icon')}</div><div class="tile-body"><h3>${esc(t.title)}</h3><p>${esc(t.tagline)}</p><div class="tile-meta"><div class="progress" style="flex:1" aria-label="Проверок пройдено ${done} из ${t.ideas.length}"><i style="width:${done / t.ideas.length * 100}%"></i></div><small class="muted">${done}/${t.ideas.length}</small></div></div></a>`; };
const helpTile = h => { const t = topicById(h.topic); return `<a class="card help-item" data-c="${t.c}" href="#/help/${h.id}"><span class="ic">${icon(t.icon)}</span><span><b>${esc(h.title)}</b><small>${esc(t.title)}</small></span>${icon('arrow', 'arrow')}</a>`; };

const pages = {
  home() {
    const featured = ['project', 'detective', 'meeting'].map(gameById);
    return `<section class="hero"><div class="wrap"><div><span class="eyebrow">${icon('sparkle')} тренажёр для руководителей</span><h1 style="margin-top:14px">Управлять — <em>навык</em>. Его можно натренировать.</h1><p class="lead">Короткие объяснения, игры с последствиями и готовые ответы на типовые рабочие ситуации.</p><div class="hero-actions"><a class="btn" href="#/play/project">${icon('play')} Сыграть первую игру</a><a class="btn ghost" href="#/help">${icon('help')} Что делать, если…</a></div></div><div class="hero-art">${heroArt}</div></div></section>
      <section class="section" style="padding-top:24px"><div class="wrap"><div class="grid c3 pillars">
        <a class="card" data-c="primary" href="#/theory"><span class="pic">${icon('book')}</span><h3>Теория</h3><p>10 тем по 5 минут. Одна мысль, одна схема, один пример.</p><span class="go">Читать ${icon('arrow')}</span></a>
        <a class="card" data-c="coral" href="#/games"><span class="pic">${icon('game')}</span><h3>Игры</h3><p>${games.length} коротких игр. Решаете — и сразу видите последствия.</p><span class="go">Играть ${icon('arrow')}</span></a>
        <a class="card" data-c="mint" href="#/help"><span class="pic">${icon('help')}</span><h3>Что делать, если…</h3><p>${help.length} ситуаций: почему так, что сделать и что сказать.</p><span class="go">Найти ответ ${icon('arrow')}</span></a>
      </div></div></section>
      <section class="section" style="padding-top:0"><div class="wrap"><div class="section-head"><div><h2>С чего начать</h2><p>Три игры, в которых за 5–8 минут видно, как решения управляют результатом.</p></div><a class="link" href="#/games">Все игры →</a></div><div class="grid c3">${featured.map(gameTile).join('')}</div></div></section>
      <section class="section" style="padding-top:0"><div class="wrap"><div class="section-head"><div><h2>Частые вопросы</h2><p>Узнаёте свою ситуацию? Ответ — в один клик.</p></div><a class="link" href="#/help">Все ситуации →</a></div><div class="quick">${['no-time', 'wrong-result', 'asks-permission', 'meeting-no-decision', 'other-dept-slow', 'old-way', 'metric-lies'].map(id => `<a class="chip" href="#/help/${id}">${esc(helpById(id).title)}</a>`).join('')}</div></div></section>
      <section class="section" style="padding-top:0"><div class="wrap"><div class="band"><div><h2>Собрано ${progress.total()} из ${maxStars} звёзд</h2><p>За каждую игру — до трёх звёзд. Переигрывайте, пробуйте другие решения — лучший результат сохранится.</p></div><a class="btn sun" href="#/games">${icon('star')} К играм</a></div></div></section>${footer}`;
  },
  theory() {
    return `<section class="page-hero"><div class="wrap"><span class="eyebrow">${icon('book')} теория</span><h1 style="margin-top:12px">Десять тем. По пять минут.</h1><p>В каждой теме четыре мысли: схема, пример из жизни и вопрос, чтобы проверить себя.</p></div></section><section class="section" style="padding-top:28px"><div class="wrap"><div class="grid c3">${topics.map(topicTile).join('')}</div></div></section>${footer}`;
  },
  topic(id) {
    const t = topicById(id); if (!t) return pages.notFound();
    const next = topicById(t.id % topics.length + 1);
    return `<div data-c="${t.c}"><section class="topic-hero"><div class="wrap"><a class="back" href="#/theory">${icon('back')} Все темы</a><h1>${esc(t.title)}</h1><p>${esc(t.tagline)}</p><div class="topic-meta"><span class="tag">${icon('clock')} ~5 минут</span><span class="tag">${t.ideas.length} идеи</span></div></div>${icon(t.icon, 'deco')}</section>
      <div class="wrap"><nav class="toc" aria-label="Идеи темы">${t.ideas.map((x, i) => `<a class="chip" href="#/theory/${t.id}" data-jump="idea-${i}">${i + 1}. ${esc(x.title)}</a>`).join('')}</nav>
      ${t.ideas.map((x, i) => `<article class="card idea" id="idea-${i}"><div class="idea-num">${i + 1}</div><h2>${esc(x.title)}</h2><p class="say">${esc(x.say)}</p>${renderVis(x.vis)}<div class="example"><span class="who">${esc(x.example.who)}</span><div><b>Из жизни</b>${esc(x.example.text)}</div></div>${quiz(`t${t.id}.${i}`, x.quiz)}</article>`).join('')}
      <section class="section" style="padding-top:20px"><div class="section-head"><h2>Попробовать на практике</h2></div><div class="grid c3">${t.games.map(gameById).map(gameTile).join('')}${t.help.slice(0, Math.max(0, 3 - t.games.length)).map(helpById).map(h => `<a class="card tile" data-c="${t.c}" href="#/help/${h.id}"><div class="tile-art" style="height:110px">${icon('help', 'scene-icon')}</div><div class="tile-body"><span class="eyebrow">Что делать, если…</span><h3>${esc(h.title)}</h3></div></a>`).join('')}</div>
      <p style="margin-top:28px"><a class="btn ghost" href="#/theory/${next.id}">Следующая тема: ${esc(next.title)} ${icon('arrow')}</a></p></section></div></div>${footer}`;
  },
  games() {
    return `<section class="page-hero"><div class="wrap"><span class="eyebrow">${icon('game')} игры</span><h1 style="margin-top:12px">Принимайте решения. Смотрите, что будет.</h1><p>Каждая игра — 5–8 минут, одна управленческая ситуация и до трёх звёзд за результат.</p></div></section><section class="section" style="padding-top:28px"><div class="wrap"><div class="grid c3">${games.map(gameTile).join('')}</div></div></section>${footer}`;
  },
  help(query = '', topic = 'all') {
    return `<section class="page-hero"><div class="wrap"><span class="eyebrow">${icon('help')} ответы</span><h1 style="margin-top:12px">Что делать, если…</h1><p>Выберите ситуацию — получите причины, шаги и фразу, которую можно сказать уже сегодня.</p></div></section>
      <section class="section" style="padding-top:24px"><div class="wrap"><label class="search">${icon('search')}<span class="sr-only">Поиск ситуации</span><input id="helpSearch" type="search" placeholder="Например: сотрудник, совещание, срок…" value="${esc(query)}" autocomplete="off"></label>
      <div class="filters" role="group" aria-label="Темы"><button class="chip" data-topic="all" aria-pressed="${topic === 'all'}">Все</button>${topics.map(t => `<button class="chip" data-topic="${t.id}" aria-pressed="${String(topic) === String(t.id)}">${esc(t.title)}</button>`).join('')}</div>
      <div id="helpList">${helpList(query, topic)}</div></div></section>${footer}`;
  },
  helpItem(id) {
    const h = helpById(id); if (!h) return pages.notFound();
    const t = topicById(h.topic), g = gameById(h.game), [ti, ii] = h.idea, idea = topicById(ti).ideas[ii];
    const related = help.filter(x => x.topic === h.topic && x.id !== h.id).slice(0, 3);
    return `<div data-c="${t.c}"><section class="page-hero"><div class="wrap"><a class="link" href="#/help">${icon('back', 'inline')} Все ситуации</a><h1 style="margin-top:14px">${esc(h.title)}</h1><p><span class="tag">${esc(t.title)}</span></p></div></section>
      <section class="section" style="padding-top:24px"><div class="wrap answer"><div class="answer-main">
        <div class="card block"><h2><span class="ic">${icon('eye')}</span>Почему так бывает</h2><ul class="why-list">${h.why.map(w => `<li>${icon('dot')}<span>${esc(w)}</span></li>`).join('')}</ul></div>
        <div class="card block"><h2><span class="ic">${icon('flag')}</span>Что сделать</h2><ol class="do-list">${h.steps.map(([b, s]) => `<li><div><b>${esc(b)}</b><span>${esc(s)}</span></div></li>`).join('')}</ol></div>
        <div class="phrase"><b>Что можно сказать</b>«${esc(h.phrase)}»<br><button class="btn sun small" data-copy="${esc(h.phrase)}">${icon('copy')} Скопировать</button></div>
      </div><aside class="card side-card"><h3>Дальше</h3>
        <a class="side-link" href="#/play/${g.id}" data-c="${g.c}"><span class="ic">${icon('play')}</span><span><b>${esc(g.title)}</b><small>Потренироваться в игре</small></span></a>
        <a class="side-link" href="#/theory/${t.id}" data-jump="idea-${ii}"><span class="ic">${icon('book')}</span><span><b>${esc(idea.title)}</b><small>Теория: ${esc(t.title)}</small></span></a>
        ${related.length ? `<h3 style="margin-top:8px">Похожие ситуации</h3>${related.map(r => `<a class="side-link" href="#/help/${r.id}"><span class="ic">${icon('help')}</span><span><b>${esc(r.title)}</b></span></a>`).join('')}` : ''}
      </aside></div></section></div>${footer}`;
  },
  notFound() { return `<section class="page-hero"><div class="wrap"><h1>Такой страницы нет</h1><p><a class="link" href="#/">На главную</a></p></div></section>`; }
};

function quiz(key, q) {
  return `<div class="quiz" data-quiz="${key}" data-ok="${q.ok}"><h4>${icon('bulb')} Проверьте себя</h4><p style="font-weight:700;margin-bottom:10px">${esc(q.q)}</p><div class="quiz-opts">${q.opts.map((o, i) => `<button type="button" data-opt="${i}">${esc(o)}</button>`).join('')}</div><p class="quiz-why" hidden>${esc(q.why)}</p></div>`;
}
function helpList(query, topic) {
  const q = query.toLowerCase().trim();
  const list = help.filter(h => (topic === 'all' || String(h.topic) === String(topic)) && (!q || [h.title, ...h.why, ...h.steps.flat(), topicById(h.topic).title].join(' ').toLowerCase().includes(q)));
  return list.length ? `<div class="help-list">${list.map(helpTile).join('')}</div>` : `<div class="card empty">Ничего не нашлось. Попробуйте другое слово или <button class="link" style="border:0;background:none" data-topic="all">сбросьте фильтр</button>.</div>`;
}

let helpState = {query: '', topic: 'all'};
async function route() {
  const hash = location.hash || '#/';
  const [, section = '', arg] = hash.slice(1).split('/');
  if (window.__game) { window.__game.destroy?.(); window.__game = null; }
  let html;
  if (section === '') html = pages.home();
  else if (section === 'theory') html = arg ? pages.topic(arg) : pages.theory();
  else if (section === 'games') html = pages.games();
  else if (section === 'help') html = arg ? pages.helpItem(arg) : pages.help(helpState.query, helpState.topic);
  else if (section === 'play') { await playGame(arg); markNav(hash.slice(1)); return; }
  else html = pages.notFound();
  view.innerHTML = `<div class="view-enter">${html}</div>`;
  markNav(hash.slice(1));
  document.title = titleFor(section, arg);
  const jump = sessionStorage.getItem('jump'); sessionStorage.removeItem('jump');
  const target = jump && document.getElementById(jump);
  if (target) target.scrollIntoView({block: 'start'}); else window.scrollTo(0, 0);
  view.querySelector('h1')?.setAttribute('tabindex', '-1');
}
function titleFor(section, arg) {
  const base = 'Альманах менеджера';
  if (section === 'theory') return arg && topicById(arg) ? `${topicById(arg).title} — ${base}` : `Теория — ${base}`;
  if (section === 'games') return `Игры — ${base}`;
  if (section === 'help') return arg && helpById(arg) ? `${helpById(arg).title} — ${base}` : `Что делать, если… — ${base}`;
  return base;
}

async function playGame(id) {
  const meta = gameById(id);
  if (!meta) { view.innerHTML = pages.notFound(); return; }
  document.title = `${meta.title} — Альманах менеджера`;
  view.innerHTML = '<div class="wrap" style="padding:40px 0">Загрузка…</div>';
  const [{mountGame}, mod] = await Promise.all([import('./games/kit.js'), import(`./games/${id}.js`)]);
  window.scrollTo(0, 0);
  window.__game = mountGame(view, meta, mod, {onFinish: () => markNav('play')});
}

// Events
view.addEventListener('click', e => {
  const jump = e.target.closest('[data-jump]');
  if (jump) {
    const el = document.getElementById(jump.dataset.jump);
    if (el && location.hash === jump.getAttribute('href')) { e.preventDefault(); el.scrollIntoView({behavior: 'smooth', block: 'start'}); return; }
    sessionStorage.setItem('jump', jump.dataset.jump);
  }
  const opt = e.target.closest('.quiz [data-opt]');
  if (opt) {
    const box = opt.closest('.quiz'), ok = Number(box.dataset.ok), pick = Number(opt.dataset.opt);
    box.querySelectorAll('[data-opt]').forEach(b => { b.disabled = true; if (Number(b.dataset.opt) === ok) b.classList.add('ok'); });
    if (pick !== ok) opt.classList.add('no');
    box.querySelector('.quiz-why').hidden = false;
    box.querySelector('.quiz-why').prepend(pick === ok ? 'Верно! ' : 'Не совсем. ');
    progress.quiz(box.dataset.quiz, pick === ok);
    return;
  }
  const topicBtn = e.target.closest('[data-topic]');
  if (topicBtn) {
    helpState.topic = topicBtn.dataset.topic;
    view.querySelectorAll('.filters [data-topic]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.topic === helpState.topic)));
    document.getElementById('helpList').innerHTML = helpList(helpState.query, helpState.topic);
    return;
  }
  const copy = e.target.closest('[data-copy]');
  if (copy) { navigator.clipboard?.writeText(copy.dataset.copy).then(() => toast('Фраза скопирована'), () => toast('Не удалось скопировать')); }
});
view.addEventListener('input', e => {
  if (e.target.id === 'helpSearch') { helpState.query = e.target.value; document.getElementById('helpList').innerHTML = helpList(helpState.query, helpState.topic); }
});
bindVis(view);
window.addEventListener('hashchange', route);
shell(); route();
