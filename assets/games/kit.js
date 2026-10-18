// Simulation kit: brief → board (HUD + hint + board + event modal) → debrief.
// A game module exports: intro, levels, scenarios?, create(scenario, level), hud(state), board(state), act(state, action), result(state).
// Actions come from elements with data-act (and optional data-arg). Rules live in pure functions so they can be tested.
import {esc, icon, stars, progress} from '../ui.js';
import {sfx, ripple, burst, floatText, animateFrom} from '../juice.js';

export const LEVEL_NAMES = ['Знакомство', 'Давление', 'Мастер'];
export const UNLOCK = 2;
export const levelKey = (id, l) => `${id}:${l}`;
export const levelOpen = (id, l) => l === 0 || progress.stars(levelKey(id, l - 1)) >= UNLOCK;

export function mountGame(root, meta, mod, {level = 0, back = '#/games', backLabel = 'Игры', topicTitle = '', more = '', onFinish} = {}) {
  let state = null, phase = 'intro', snap = null, lastGain = 0, lastStars = 0;
  const scenarios = mod.scenarios || [{name: meta.title}];
  const scenario = level < scenarios.length ? level : 0;
  const lvText = (mod.levels || [])[level] || '';

  const top = () => `<div class="g-top"><div class="wrap g-top-in"><a class="g-back" href="${back}">${icon('back')}<span>${esc(backLabel)}</span></a><div class="g-title"><span class="label">Уровень ${level + 1} · ${LEVEL_NAMES[level]}</span><b>${esc(meta.title)}</b></div>${phase === 'play' ? `<button class="btn ghost small" data-kit="restart" title="Начать заново">${icon('replay')}<span class="hide-s">Заново</span></button>` : '<span></span>'}</div></div>`;

  function intro() {
    const i = mod.intro, best = progress.stars(levelKey(meta.id, level));
    return `${top()}<section class="wrap g-intro"><div class="g-brief card"><div class="g-brief-head"><span class="g-badge">${icon(meta.icon)}</span><div><p class="label">${esc(topicTitle)} · ${meta.minutes} мин</p><h1>${esc(meta.title)}</h1></div></div>
      <p class="g-story">${esc(i.story)}</p>
      <dl class="g-spec"><div><dt>${icon('target')} Цель</dt><dd>${esc(i.goal)}</dd></div><div><dt>${icon('flag')} Правила</dt><dd><ol>${i.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol></dd></div><div><dt>${icon('bulb')} Навык</dt><dd>${esc(meta.skill)}</dd></div><div><dt>${icon('chart')} Уровень ${level + 1}</dt><dd>${esc(LEVEL_NAMES[level])}: ${esc(lvText)}. Случай: «${esc(scenarios[scenario].name)}».</dd></div></dl>
      <div class="g-actions"><button class="btn" data-kit="start">${icon('play')} Начать</button>${best ? `<span class="g-best">Лучший результат ${stars(best)}</span>` : ''}</div></div></section>`;
  }

  function play() {
    const hud = mod.hud(state);
    const modal = state.modal ? `<div class="g-modal-back"><div class="g-modal card" role="dialog" aria-modal="true" aria-labelledby="gModalTitle"><p class="label">${icon('bolt')} ${esc(state.modal.kicker || 'Событие')}</p><h2 id="gModalTitle">${esc(state.modal.title)}</h2>${state.modal.text ? `<p>${esc(state.modal.text)}</p>` : ''}<div class="g-modal-opts">${state.modal.options.map(o => `<button class="g-opt" data-act="${esc(o.act || 'choose')}" data-arg="${esc(o.id)}"><b>${esc(o.label)}</b>${o.detail ? `<span>${esc(o.detail)}</span>` : ''}</button>`).join('')}</div></div></div>` : '';
    return `${top()}<div class="wrap g-hud">${hud.map(([label, value, tone, max]) => `<div class="g-stat ${tone || ''}"><span>${esc(label)}</span><b>${value}</b>${max !== undefined ? `<i class="g-bar"><i style="width:${Math.max(0, Math.min(100, max))}%"></i></i>` : ''}</div>`).join('')}</div>
      ${state.hint && level < 2 ? `<div class="wrap"><p class="g-hint">${icon('bulb')}<span>${esc(state.hint)}</span></p></div>` : ''}
      ${state.flash ? `<div class="wrap"><p class="g-flash ${state.flash.tone || ''}">${esc(state.flash.text)}</p></div>` : ''}
      <div class="wrap g-board">${mod.board(state)}</div>${modal}`;
  }

  function result() {
    const r = mod.result(state);
    const saved = progress.saveGame(levelKey(meta.id, level), r.stars), best = saved.stars; lastGain = saved.gain; lastStars = r.stars;
    const next = level < 2 ? (r.stars >= UNLOCK || best >= UNLOCK ? `<a class="btn" href="#/play/${meta.id}/${level + 2}">Уровень ${level + 2} ${icon('arrow')}</a>` : '') : '';
    const nextNote = level < 2 && best < UNLOCK ? `<p class="muted">Чтобы открыть уровень ${level + 2}, наберите хотя бы ${UNLOCK} звезды.</p>` : level === 2 && r.stars === 3 ? '<p class="muted">Все уровни игры пройдены на максимум.</p>' : '';
    return `${top()}<section class="wrap g-result"><div class="card g-result-card"><p class="label">Разбор · уровень ${level + 1}</p><div class="g-result-stars">${[0, 1, 2].map(i => `<span class="g-big-star ${i < r.stars ? 'on' : ''}">${icon('star')}</span>`).join('')}</div><h1>${esc(r.title)}</h1><p class="g-summary">${esc(r.summary)}</p>
      ${r.stats ? `<div class="g-result-stats">${r.stats.map(([l, v]) => `<div><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
      <ul class="g-lines">${r.lines.map(([ok, text]) => `<li class="${ok ? 'ok' : 'no'}">${icon(ok ? 'check' : 'x')}<span>${esc(text)}</span></li>`).join('')}</ul>
      <div class="g-lesson">${icon('bulb')}<div><b>Вывод</b>${esc(r.lesson)}</div></div>
      <div class="g-actions">${next}<button class="btn ${next ? 'ghost' : ''}" data-kit="again">${icon('replay')} Ещё раз</button><a class="btn ghost" href="${back}">К списку игр</a></div>${nextNote}
      ${best > r.stars ? `<p class="muted" style="margin-top:12px">Лучший результат: ${best} из 3</p>` : ''}</div>${more ? `<div class="g-more">${more}</div>` : ''}</section>`;
  }

  function render() {
    root.innerHTML = `<div class="game view-enter" data-game="${meta.id}" data-phase="${phase}">${phase === 'intro' ? intro() : phase === 'play' ? play() : result()}</div>`;
    if (phase === 'play' && state.modal) root.querySelector('.g-opt')?.focus();
    snap = phase === 'play' ? animateFrom(root, snap) : null;
    if (phase === 'result') { onFinish?.(); celebrate(); }
  }
  // Stars light up one by one with a chime; three stars end with a soft burst.
  function celebrate() {
    const el = root.querySelectorAll('.g-big-star');
    el.forEach((s, i) => { if (i < lastStars) { s.classList.remove('on'); setTimeout(() => { s.classList.add('on', 'pop'); sfx.star(i); const b = s.getBoundingClientRect(); if (i === lastStars - 1) { floatText(b.right + 8, b.top, `+${lastGain} XP`); if (lastStars === 3) { burst(b.left - 30, b.top + b.height / 2, {n: 18, color: '#c98a00'}); setTimeout(sfx.win, 250); } } }, 350 + i * 380); } });
  }

  function start() { state = mod.create(scenario, level); phase = 'play'; snap = null; sfx.step(); render(); window.scrollTo(0, 0); }

  function dispatch(action) {
    const next = mod.act(state, action);
    if (!next || next === state) return;
    const hadModal = !!state.modal, prevKey = progressKey(state);
    state = next;
    if (state.done) { phase = 'result'; sfx.step(); render(); window.scrollTo(0, 0); return; }
    const y = window.scrollY; render(); window.scrollTo(0, y);
    // Sound follows the meaning of the move: good news chimes, bad news thuds, new events ring.
    const f = state.flash;
    if (state.modal && !hadModal) sfx.event();
    else if (f?.tone === 'good') { sfx.good(); const el = root.querySelector('.g-flash'); if (el) { const b = el.getBoundingClientRect(); burst(b.left + 24, b.top + b.height / 2, {n: 10, color: 'var(--good)'}); } }
    else if (f?.tone === 'bad') { sfx.bad(); root.querySelector('.g-board')?.classList.add('fx-shake'); }
    else if (progressKey(state) !== prevKey) sfx.place();
  }
  const progressKey = s => JSON.stringify([s.day, s.round, s.wave, s.step, s.phase, s.sprint]);

  function onClick(e) {
    const kit = e.target.closest('[data-kit]');
    if (kit) {
      const k = kit.dataset.kit;
      if (k === 'start' || k === 'again' || k === 'restart') { if (e.clientX || e.clientY) ripple(e.clientX, e.clientY); start(); }
      return;
    }
    const a = e.target.closest('[data-act]');
    if (a && phase === 'play' && !a.disabled && a.getAttribute('aria-disabled') !== 'true') {
      if (e.clientX || e.clientY) ripple(e.clientX, e.clientY);
      sfx[a.getAttribute('aria-pressed') === 'false' || a.dataset.act === 'pick' || a.dataset.act === 'select' ? 'pick' : 'tap']();
      dispatch({type: a.dataset.act, arg: a.dataset.arg});
    }
  }
  function onKey(e) { if (e.key === 'Escape' && state?.modal?.dismiss) dispatch({type: state.modal.dismiss}); }

  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  render();
  return {destroy() { root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); }, get state() { return state; }, dispatch};
}

// Small helpers shared by games.
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const clone = s => JSON.parse(JSON.stringify(s));
export const avatar = (letter, color, size = 40) => `<span class="g-ava" style="--ac:${color};--as:${size}px">${esc(letter)}</span>`;
export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
export const starsBy = (score, a, b) => score >= b ? 3 : score >= a ? 2 : 1;
