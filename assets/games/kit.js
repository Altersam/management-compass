// Simulation kit: brief → board (HUD + hint + board + event modal) → debrief.
// A game module exports: intro, scenarios?, create(scenario), hud(state), board(state), act(state, action), result(state).
// Actions come from elements with data-act (and optional data-arg). Rules live in pure functions so they can be tested.
import {esc, icon, stars, progress} from '../ui.js';

export function mountGame(root, meta, mod, {back = '#/practice', backLabel = 'Практика', topicTitle = '', more = '', onFinish} = {}) {
  let scenario = 0, state = null, phase = 'intro';
  const scenarios = mod.scenarios || [{name: meta.title}];

  const top = () => `<div class="g-top"><div class="wrap g-top-in"><a class="g-back" href="${back}">${icon('back')}<span>${esc(backLabel)}</span></a><div class="g-title"><span class="label">Испытание</span><b>${esc(meta.title)}</b></div>${phase === 'play' ? `<button class="btn ghost small" data-kit="restart" title="Начать заново">${icon('replay')}<span class="hide-s">Заново</span></button>` : '<span></span>'}</div></div>`;

  function intro() {
    const i = mod.intro, best = progress.stars(meta.id);
    return `${top()}<section class="wrap g-intro"><div class="g-brief card"><div class="g-brief-head"><span class="g-badge">${icon(meta.icon)}</span><div><p class="label">${esc(topicTitle)} · ${meta.minutes} мин</p><h1>${esc(meta.title)}</h1></div></div>
      <p class="g-story">${esc(i.story)}</p>
      <dl class="g-spec"><div><dt>${icon('target')} Цель</dt><dd>${esc(i.goal)}</dd></div><div><dt>${icon('flag')} Правила</dt><dd><ol>${i.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol></dd></div><div><dt>${icon('bulb')} Навык</dt><dd>${esc(meta.skill)}</dd></div></dl>
      ${scenarios.length > 1 ? `<div class="g-cases"><span class="label">Случай</span><div role="radiogroup" aria-label="Случай">${scenarios.map((s, n) => `<button class="chip" role="radio" data-kit="case" data-arg="${n}" aria-checked="${n === scenario}" aria-pressed="${n === scenario}">${esc(s.name)}</button>`).join('')}</div></div>` : ''}
      <div class="g-actions"><button class="btn" data-kit="start">${icon('play')} Начать</button>${best ? `<span class="g-best">Лучший результат ${stars(best)}</span>` : ''}</div></div></section>`;
  }

  function play() {
    const hud = mod.hud(state);
    const modal = state.modal ? `<div class="g-modal-back"><div class="g-modal card" role="dialog" aria-modal="true" aria-labelledby="gModalTitle"><p class="label">${icon('bolt')} ${esc(state.modal.kicker || 'Событие')}</p><h2 id="gModalTitle">${esc(state.modal.title)}</h2>${state.modal.text ? `<p>${esc(state.modal.text)}</p>` : ''}<div class="g-modal-opts">${state.modal.options.map(o => `<button class="g-opt" data-act="${esc(o.act || 'choose')}" data-arg="${esc(o.id)}"><b>${esc(o.label)}</b>${o.detail ? `<span>${esc(o.detail)}</span>` : ''}</button>`).join('')}</div></div></div>` : '';
    return `${top()}<div class="wrap g-hud">${hud.map(([label, value, tone, max]) => `<div class="g-stat ${tone || ''}"><span>${esc(label)}</span><b>${value}</b>${max !== undefined ? `<i class="g-bar"><i style="width:${Math.max(0, Math.min(100, max))}%"></i></i>` : ''}</div>`).join('')}</div>
      ${state.hint ? `<div class="wrap"><p class="g-hint">${icon('bulb')}<span>${esc(state.hint)}</span></p></div>` : ''}
      ${state.flash ? `<div class="wrap"><p class="g-flash ${state.flash.tone || ''}">${esc(state.flash.text)}</p></div>` : ''}
      <div class="wrap g-board">${mod.board(state)}</div>${modal}`;
  }

  function result() {
    const r = mod.result(state);
    const best = progress.saveGame(meta.id, r.stars).stars;
    return `${top()}<section class="wrap g-result"><div class="card g-result-card"><p class="label">Разбор</p><div class="g-result-stars">${[0, 1, 2].map(i => `<span class="g-big-star ${i < r.stars ? 'on' : ''}">${icon('star')}</span>`).join('')}</div><h1>${esc(r.title)}</h1><p class="g-summary">${esc(r.summary)}</p>
      ${r.stats ? `<div class="g-result-stats">${r.stats.map(([l, v]) => `<div><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
      <ul class="g-lines">${r.lines.map(([ok, text]) => `<li class="${ok ? 'ok' : 'no'}">${icon(ok ? 'check' : 'x')}<span>${esc(text)}</span></li>`).join('')}</ul>
      <div class="g-lesson">${icon('bulb')}<div><b>Вывод</b>${esc(r.lesson)}</div></div>
      <div class="g-actions"><a class="btn" href="${back}">Продолжить ${icon('arrow')}</a><button class="btn ghost" data-kit="again">${icon('replay')} Ещё раз</button>${scenarios.length > 1 ? `<button class="btn ghost" data-kit="next-case">Другой случай</button>` : ''}</div>
      ${best > r.stars ? `<p class="muted" style="margin-top:12px">Лучший результат: ${best} из 3</p>` : ''}</div>${more ? `<div class="g-more">${more}</div>` : ''}</section>`;
  }

  function render() {
    root.innerHTML = `<div class="game view-enter" data-game="${meta.id}" data-phase="${phase}">${phase === 'intro' ? intro() : phase === 'play' ? play() : result()}</div>`;
    if (phase === 'play' && state.modal) root.querySelector('.g-opt')?.focus();
    if (phase === 'result') onFinish?.();
  }

  function start() { state = mod.create(scenario); phase = 'play'; render(); window.scrollTo(0, 0); }

  function dispatch(action) {
    const next = mod.act(state, action);
    if (!next || next === state) return;
    state = next;
    if (state.done) { phase = 'result'; render(); window.scrollTo(0, 0); return; }
    const y = window.scrollY; render(); window.scrollTo(0, y);
  }

  function onClick(e) {
    const kit = e.target.closest('[data-kit]');
    if (kit) {
      const k = kit.dataset.kit;
      if (k === 'start' || k === 'again' || k === 'restart') start();
      else if (k === 'case') { scenario = Number(kit.dataset.arg); render(); }
      else if (k === 'next-case') { scenario = (scenario + 1) % scenarios.length; start(); }
      return;
    }
    const a = e.target.closest('[data-act]');
    if (a && phase === 'play' && !a.disabled && a.getAttribute('aria-disabled') !== 'true') dispatch({type: a.dataset.act, arg: a.dataset.arg});
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
