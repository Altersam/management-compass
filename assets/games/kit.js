// Game kit: intro → board (HUD + hint + board + event modal) → result.
// A game module exports: intro, scenarios?, create(scenario), hud(state), board(state), act(state, action), result(state).
// Actions come from elements with data-act (and optional data-arg). Rules live in pure functions so they can be tested.
import {esc, icon, stars, progress} from '../ui.js';
import {topicById} from '../../content/topics.js';
import {help} from '../../content/help.js';
import {scene} from '../art.js';

export function mountGame(root, meta, mod, {onFinish} = {}) {
  let scenario = 0, state = null, phase = 'intro', lastStars = 0;
  const scenarios = mod.scenarios || [{name: meta.title}];
  const topic = topicById(meta.topic);

  const top = () => `<div class="wrap g-top"><a class="g-back" href="#/games">${icon('back')}<span>Игры</span></a><div class="g-title"><span class="g-badge">${icon(meta.icon)}</span><b>${esc(meta.title)}</b></div>${phase === 'play' ? `<button class="btn ghost small" data-kit="restart" title="Начать заново">${icon('replay')}<span class="hide-s">Заново</span></button>` : ''}</div>`;

  function intro() {
    const i = mod.intro;
    return `${top()}<section class="wrap g-intro"><div class="g-intro-card card"><div class="g-intro-art">${i.art || scene(meta.id)}</div><div class="g-intro-text"><span class="eyebrow">${icon('clock')} ${meta.minutes} минут · ${esc(topic.title)}</span><h1>${esc(meta.title)}</h1><p class="g-story">${esc(i.story)}</p><div class="g-goal">${icon('target')}<div><b>Цель</b>${esc(i.goal)}</div></div><ul class="g-rules">${i.rules.map(r => `<li>${icon('check')}<span>${esc(r)}</span></li>`).join('')}</ul>
      ${scenarios.length > 1 ? `<div class="g-cases" role="radiogroup" aria-label="Случай">${scenarios.map((s, n) => `<button class="chip" role="radio" data-kit="case" data-arg="${n}" aria-checked="${n === scenario}" aria-pressed="${n === scenario}">${esc(s.name)}</button>`).join('')}</div>` : ''}
      <div class="g-actions"><button class="btn" data-kit="start">${icon('play')} Начать</button>${progress.stars(meta.id) ? `<span class="g-best">Лучший результат ${stars(progress.stars(meta.id))}</span>` : ''}</div></div></div></section>`;
  }

  function play() {
    const hud = mod.hud(state);
    const modal = state.modal ? `<div class="g-modal-back"><div class="g-modal card" role="dialog" aria-modal="true" aria-labelledby="gModalTitle"><span class="eyebrow">${icon('bolt')} ${esc(state.modal.kicker || 'Событие')}</span><h2 id="gModalTitle">${esc(state.modal.title)}</h2>${state.modal.text ? `<p>${esc(state.modal.text)}</p>` : ''}<div class="g-modal-opts">${state.modal.options.map(o => `<button class="g-opt" data-act="${esc(o.act || 'choose')}" data-arg="${esc(o.id)}"><b>${esc(o.label)}</b>${o.detail ? `<span>${esc(o.detail)}</span>` : ''}</button>`).join('')}</div></div></div>` : '';
    return `${top()}<div class="wrap g-hud">${hud.map(([label, value, tone, max]) => `<div class="g-stat ${tone || ''}"><span>${esc(label)}</span><b>${value}</b>${max !== undefined ? `<i class="g-bar"><i style="width:${Math.max(0, Math.min(100, max))}%"></i></i>` : ''}</div>`).join('')}</div>
      ${state.hint ? `<div class="wrap"><p class="g-hint">${icon('bulb')}<span>${esc(state.hint)}</span></p></div>` : ''}
      ${state.flash ? `<div class="wrap"><p class="g-flash ${state.flash.tone || ''}">${esc(state.flash.text)}</p></div>` : ''}
      <div class="wrap g-board">${mod.board(state)}</div>${modal}`;
  }

  function result() {
    const r = mod.result(state);
    lastStars = r.stars;
    const best = progress.saveGame(meta.id, r.stars).stars;
    const tips = help.filter(h => h.game === meta.id).slice(0, 2);
    return `${top()}<section class="wrap g-result"><div class="card g-result-card" data-c="${meta.c}"><div class="g-result-stars">${[0, 1, 2].map(i => `<span class="g-big-star ${i < r.stars ? 'on' : ''}" style="animation-delay:${.2 + i * .25}s">${icon('star')}</span>`).join('')}</div><h1>${esc(r.title)}</h1><p class="g-summary">${esc(r.summary)}</p>
      ${r.stats ? `<div class="g-result-stats">${r.stats.map(([l, v]) => `<div><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
      <ul class="g-lines">${r.lines.map(([ok, text]) => `<li class="${ok ? 'ok' : 'no'}">${icon(ok ? 'check' : 'x')}<span>${esc(text)}</span></li>`).join('')}</ul>
      <div class="g-lesson">${icon('bulb')}<div><b>Главное</b>${esc(r.lesson)}</div></div>
      <div class="g-actions"><button class="btn" data-kit="again">${icon('replay')} Ещё раз</button>${scenarios.length > 1 ? `<button class="btn ghost" data-kit="next-case">Другой случай</button>` : ''}<a class="btn ghost" href="#/games">Все игры</a></div>
      ${best > r.stars ? `<p class="muted" style="margin-top:12px">Ваш лучший результат: ${best} ★</p>` : ''}</div>
      <div class="g-more"><a class="card side-link" href="#/theory/${topic.id}" data-c="${topic.c}"><span class="ic">${icon('book')}</span><span><b>${esc(topic.title)}</b><small>Теория к этой игре</small></span></a>${tips.map(h => `<a class="card side-link" href="#/help/${h.id}" data-c="${topic.c}"><span class="ic">${icon('help')}</span><span><b>${esc(h.title)}</b><small>Что делать, если…</small></span></a>`).join('')}</div></section>`;
  }

  function render() {
    root.innerHTML = `<div class="game view-enter" data-c="${meta.c}" data-game="${meta.id}" data-phase="${phase}">${phase === 'intro' ? intro() : phase === 'play' ? play() : result()}</div>`;
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
