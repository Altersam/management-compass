// Lecture blocks: one renderer per block type plus delegated interactions.
// Types: text, key, stat, compare, steps, cycle, ladder, cards, matrix, table, tabs, scale, check, sort, quiz, calc.
import {esc, md, icon, shuffle, progress} from './ui.js';

const title = (t, ic) => t ? `<div class="b-title">${ic ? icon(ic) : ''}${esc(t)}</div>` : '';
const note = n => n ? `<p class="b-note">${md(n)}</p>` : '';
let uid = 0;

const R = {
  text: b => `<div class="b-text">${b.html ? b.html : (Array.isArray(b.text) ? b.text : [b.text]).map(p => `<p>${md(p)}</p>`).join('')}</div>`,
  key: b => `<div class="b b-key">${title(b.title || 'Главное')}<p>${md(b.text)}</p></div>`,
  stat: b => `<div class="b">${title(b.title)}<div class="b-stats">${b.items.map(([v, l]) => `<div class="b-stat"><b>${esc(v)}</b><span>${md(l)}</span></div>`).join('')}</div>${note(b.note)}</div>`,
  compare: b => `<div class="b">${title(b.title, 'layers')}<div class="b-compare" style="--n:${b.cols.length}">${b.cols.map(c => `<div class="b-col ${c.tone || 'neutral'}"><h4>${c.tone === 'bad' ? icon('x') : c.tone === 'good' ? icon('check') : ''}${esc(c.h)}</h4><ul>${c.items.map(i => `<li>${icon(c.tone === 'bad' ? 'x' : c.tone === 'good' ? 'check' : 'dot')}<span>${md(i)}</span></li>`).join('')}</ul></div>`).join('')}</div>${note(b.note)}</div>`,
  steps: b => { const id = 'st' + (++uid); return `<div class="b b-stepper" data-block="steps">${title(b.title, 'flow')}<div class="b-steps" role="group" aria-label="${esc(b.title || 'Шаги')}">${b.items.map(([n], i) => `<button type="button" class="b-step" data-i="${i}" aria-pressed="${i === 0}" aria-controls="${id}"><span class="n">${String(i + 1).padStart(2, '0')}</span><b>${esc(n)}</b></button>`).join('')}</div><div class="b-detail" id="${id}" aria-live="polite">${detail(b.items[0])}</div><script type="application/json">${json(b.items)}</script>${note(b.note)}</div>`; },
  cycle: b => { const id = 'cy' + (++uid), n = b.items.length; return `<div class="b" data-block="steps">${title(b.title, 'replay')}<div class="b-cycle"><span class="ring"></span>${b.center ? `<span class="center">${esc(b.center)}</span>` : ''}${b.items.map(([name], i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return `<button type="button" class="b-step" data-i="${i}" aria-pressed="${i === 0}" aria-controls="${id}" style="left:${50 + 37 * Math.cos(a)}%;top:${50 + 37 * Math.sin(a)}%">${esc(name)}</button>`; }).join('')}</div><div class="b-detail" id="${id}" aria-live="polite">${detail(b.items[0])}</div><script type="application/json">${json(b.items)}</script>${note(b.note)}</div>`; },
  ladder: b => `<div class="b">${title(b.title, 'chart')}<div class="b-ladder">${b.items.map(([n, t], i) => `<div class="b-rung" style="--i:${i}"><span class="n">${i + 1}</span><div><b>${esc(n)}</b><span>${md(t)}</span></div></div>`).join('')}</div>${note(b.note)}</div>`,
  cards: b => `<div class="b">${title(b.title, 'grid')}<div class="b-cards" ${b.cols ? `style="grid-template-columns:repeat(auto-fill,minmax(${b.cols}px,1fr))"` : ''}>${b.items.map(([f, back]) => back ? `<button type="button" class="b-card" aria-expanded="false"><b>${esc(f)}</b><span class="back" hidden>${md(back)}</span><span class="hint">${icon('touch')} раскрыть</span></button>` : `<div class="b-card"><b>${md(f)}</b></div>`).join('')}</div>${note(b.note)}</div>`,
  matrix: b => `<div class="b">${title(b.title, 'grid')}<div class="b-matrix"><span></span><span class="ax">${esc(b.x[0])}</span><span class="ax">${esc(b.x[1])}</span>${[0, 1].map(r => `<span class="ax ay">${esc(b.y[r])}</span>${[0, 1].map(c => { const [t, d] = b.cells[r * 2 + c]; return `<div class="b-q q${r * 2 + c}"><b>${esc(t)}</b><span>${md(d)}</span></div>`; }).join('')}`).join('')}</div>${note(b.note)}</div>`,
  table: b => `<div class="b">${title(b.title, 'grid')}<div class="b-scroll"><table class="b-table"><thead><tr>${b.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${md(c)}</th>` : `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${note(b.note)}</div>`,
  tabs: b => { const id = 'tb' + (++uid); return `<div class="b b-tabs" data-block="tabs">${title(b.title, 'layers')}<div class="b-tablist" role="tablist">${b.items.map(([t], i) => `<button type="button" role="tab" id="${id}t${i}" aria-controls="${id}p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(t)}</button>`).join('')}</div>${b.items.map(([, body], i) => `<div class="b-tabpanel" role="tabpanel" id="${id}p${i}" aria-labelledby="${id}t${i}" ${i ? 'hidden' : ''}>${(Array.isArray(body) ? body : [body]).map(p => `<p>${md(p)}</p>`).join('')}</div>`).join('')}${note(b.note)}</div>`; },
  scale: b => `<div class="b b-slider" data-block="scale">${title(b.title, 'scale')}<div class="row"><span class="label">${esc(b.from)}</span><span class="label">${esc(b.to)}</span></div><input type="range" min="0" max="${b.items.length - 1}" value="0" step="1" aria-label="${esc(b.title)}"><div class="b-detail" aria-live="polite">${detail(b.items[0])}</div><script type="application/json">${json(b.items)}</script>${note(b.note)}</div>`,
  check: b => `<div class="b b-check" data-block="check">${title(b.title, 'check')}<ul>${b.items.map(i => `<li><label><input type="checkbox"><span>${md(i)}</span></label></li>`).join('')}</ul><p class="res" aria-live="polite">Отмечено: 0 из ${b.items.length}</p><script type="application/json">${json(b.result || [])}</script></div>`,
  sort: b => { const items = shuffle(b.items.map(([t, bin], i) => [t, bin, i])); return `<div class="b b-sort" data-block="sort">${title(b.title || 'Разложите по группам', 'touch')}<p class="b-help muted">Выберите карточку, затем группу.</p><div class="pool">${items.map(([t, bin, i]) => `<button type="button" class="item" data-bin="${bin}" data-i="${i}" aria-pressed="false">${esc(t)}</button>`).join('')}</div><div class="bins" style="--n:${b.bins.length}">${b.bins.map((n, i) => `<button type="button" class="bin" data-bin="${i}"><b>${esc(n)}</b></button>`).join('')}</div><p class="res muted" aria-live="polite"></p>${note(b.note)}</div>`; },
  quiz: (b, key) => `<div class="b b-quiz" data-block="quiz" data-ok="${b.ok}" data-key="${esc(key)}">${title(b.case ? 'Ситуация' : 'Проверьте себя', b.case ? 'users' : 'bulb')}${b.case ? `<p class="b-case">${md(b.case)}</p>` : ''}<p class="q">${md(b.q)}</p><div class="opts">${b.opts.map((o, i) => `<button type="button" class="opt" data-opt="${i}">${md(o)}</button>`).join('')}</div><p class="feedback" hidden>${md(b.why)}</p></div>`,
  calc: b => `<div class="b b-calc" data-block="calc" data-kind="${esc(b.kind)}">${title(b.title, 'coin')}<div class="b-calc-in">${b.inputs.map(([id, label, min, max, step, val]) => `<label><span>${esc(label)}</span><input type="range" data-id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output>${val}</output></label>`).join('')}</div><div class="b-calc-out" aria-live="polite"></div>${note(b.note)}</div>`
};
const detail = ([n, d]) => `<b>${esc(n)}</b>${md(d || '')}`;
const json = v => JSON.stringify(v).replace(/</g, '\\u003c');

export function renderBlock(b, key = '') { const f = R[b.type]; if (!f) throw new Error('Unknown block ' + b.type); return f(b, key); }

// Calculators referenced by lecture content.
const CALC = {
  // Topic 9: project effectiveness → bonus. result = fact/plan; bonus fund × result; closed if < 50%.
  kpi(v) {
    const r = Math.min(1.2, v.fact / v.plan), pct = Math.round(r * 100), pay = Math.round(v.fund * Math.min(r, 1) / 1000) * 1000;
    const tone = pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad';
    return `<div class="b-stats"><div class="b-stat"><b>${pct}%</b><span>результативность</span></div><div class="b-stat"><b>${pay.toLocaleString('ru-RU')} ₽</b><span>премиальный фонд к выплате</span></div></div><p class="tag ${tone}" style="margin-top:10px">${pct >= 80 ? 'Проект в норме' : pct >= 50 ? 'Зона внимания: разобрать отклонения' : 'Ниже 50%: если так два квартала подряд — проект закрывают'}</p>`;
  },
  // Topic 1: the cost of switching. Each switch costs minutes of refocusing.
  focus(v) {
    const lost = v.switches * v.cost, left = Math.max(0, 480 - lost);
    return `<div class="b-stats"><div class="b-stat"><b>${Math.round(lost / 6) / 10} ч</b><span>уходит на «вход» в задачу после отвлечений</span></div><div class="b-stat"><b>${Math.round(left / 6) / 10} ч</b><span>остаётся на работу из 8‑часового дня</span></div></div><div class="bar" style="margin-top:12px"><i style="width:${left / 480 * 100}%"></i></div>`;
  },
  // Topic 8: throughput is limited by the slowest stage.
  flow(v) {
    const st = [['Приём', v.a], ['Проверка', v.b], ['Исполнение', v.c]], min = Math.min(...st.map(s => s[1]));
    return `<div class="b-flowcalc">${st.map(([n, c]) => `<div class="${c === min ? 'is-min' : ''}"><span>${n}</span><b>${c}</b><small>в день</small></div>`).join(icon('arrow'))}</div><p class="b-note">Выход процесса — <b>${min} заявок в день</b>: ровно столько пропускает узкое место. Ускорять остальные этапы бесполезно — заявки будут копиться перед ним.</p>`;
  }
};

function setStep(box, i) {
  const items = JSON.parse(box.querySelector('script[type="application/json"]').textContent);
  box.querySelectorAll('.b-step').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i)));
  box.querySelector('.b-detail').innerHTML = detail(items[i]);
}
function runCalc(box) {
  const v = {}; box.querySelectorAll('input[data-id]').forEach(i => { v[i.dataset.id] = Number(i.value); i.nextElementSibling.textContent = Number(i.value).toLocaleString('ru-RU'); });
  box.querySelector('.b-calc-out').innerHTML = CALC[box.dataset.kind]?.(v) || '';
}
export function initBlocks(root) { root.querySelectorAll('[data-block="calc"]').forEach(runCalc); }

export function bindBlocks(root, {onQuiz} = {}) {
  root.addEventListener('click', e => {
    const step = e.target.closest('[data-block="steps"] .b-step');
    if (step) return setStep(step.closest('[data-block]'), Number(step.dataset.i));
    const card = e.target.closest('button.b-card');
    if (card) { const open = card.getAttribute('aria-expanded') !== 'true'; card.setAttribute('aria-expanded', String(open)); card.querySelector('.back').hidden = !open; card.querySelector('.hint').hidden = open; return; }
    const tab = e.target.closest('[role="tab"]');
    if (tab) { const box = tab.closest('.b-tabs'); box.querySelectorAll('[role="tab"]').forEach(t => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; box.querySelector('#' + t.getAttribute('aria-controls')).hidden = !on; }); return; }
    const opt = e.target.closest('[data-block="quiz"] .opt');
    if (opt && !opt.disabled) {
      const box = opt.closest('[data-block]'), ok = Number(box.dataset.ok), pick = Number(opt.dataset.opt);
      box.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (Number(b.dataset.opt) === ok) b.classList.add('ok'); });
      if (pick !== ok) opt.classList.add('no');
      const fb = box.querySelector('.feedback'); fb.hidden = false; fb.classList.add(pick === ok ? 'ok' : 'no');
      fb.insertAdjacentHTML('afterbegin', `<b>${pick === ok ? 'Верно.' : 'Не совсем.'}</b> `);
      progress.quiz(box.dataset.key, pick === ok); onQuiz?.(box.dataset.key, pick === ok);
      return;
    }
    const item = e.target.closest('[data-block="sort"] .pool .item');
    if (item) { const box = item.closest('[data-block]'); box.querySelectorAll('.pool .item').forEach(b => b.setAttribute('aria-pressed', String(b === item && b.getAttribute('aria-pressed') !== 'true'))); return; }
    const bin = e.target.closest('[data-block="sort"] .bin');
    if (bin) {
      const box = bin.closest('[data-block]'), sel = box.querySelector('.pool .item[aria-pressed="true"]'), res = box.querySelector('.res');
      if (!sel) { res.textContent = 'Сначала выберите карточку.'; return; }
      if (sel.dataset.bin === bin.dataset.bin) { sel.setAttribute('aria-pressed', 'false'); sel.classList.add('ok'); sel.disabled = true; bin.append(sel); res.textContent = 'Верно.'; }
      else { sel.classList.add('no'); res.textContent = `Не сюда. Подумайте ещё.`; setTimeout(() => sel.classList.remove('no'), 700); }
      if (!box.querySelector('.pool .item')) res.textContent = 'Всё разложено верно.';
    }
  });
  root.addEventListener('input', e => {
    const range = e.target.closest('[data-block="scale"] input');
    if (range) { const box = range.closest('[data-block]'); box.querySelector('.b-detail').innerHTML = detail(JSON.parse(box.querySelector('script').textContent)[Number(range.value)]); return; }
    const cin = e.target.closest('[data-block="calc"] input');
    if (cin) return runCalc(cin.closest('[data-block]'));
  });
  root.addEventListener('change', e => {
    const cb = e.target.closest('[data-block="check"] input');
    if (!cb) return;
    const box = cb.closest('[data-block]'), all = box.querySelectorAll('input'), n = [...all].filter(i => i.checked).length;
    const rules = JSON.parse(box.querySelector('script').textContent); const hit = rules.filter(([min]) => n >= min).pop();
    box.querySelector('.res').innerHTML = `Отмечено: ${n} из ${all.length}${hit && hit[1] ? ` — ${md(hit[1])}` : ''}`;
  });
  root.addEventListener('keydown', e => {
    const tab = e.target.closest('[role="tab"]'); if (!tab || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const tabs = [...tab.parentElement.children], i = tabs.indexOf(tab), next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus(); next.click();
  });
}
