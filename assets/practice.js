// Practice engine: a lesson is a queue of mixed exercises with 3 hearts.
// A wrong answer costs a heart and the exercise returns at the end of the queue.
// Exercise types: tf, choice, case, multi, fill, order, match, classify.
import {esc, md, icon, shuffle, plural} from './ui.js';

export const TYPES = {
  tf: 'Верно или нет?', choice: 'Выберите ответ', case: 'Ситуация', multi: 'Выберите все верные', fill: 'Вставьте пропуск',
  order: 'Расставьте по порядку', match: 'Соедините пары', classify: 'Разложите по группам'
};

// Pure answer check, used by the UI and tests.
export function check(ex, a) {
  switch (ex.t) {
    case 'tf': return a === ex.ok;
    case 'choice': case 'case': case 'fill': return a === ex.ok;
    case 'multi': return Array.isArray(a) && a.length === ex.ok.length && ex.ok.every(i => a.includes(i));
    case 'order': return Array.isArray(a) && a.length === ex.items.length && a.every((v, i) => v === i);
    case 'match': case 'classify': return a === true; // solved step by step; true once every item is placed
    default: return false;
  }
}
// Correct answer in words, shown after a mistake.
function solution(ex) {
  if (ex.t === 'tf') return ex.ok ? 'Верно' : 'Неверно';
  if (['choice', 'case', 'fill'].includes(ex.t)) return ex.opts[ex.ok];
  if (ex.t === 'multi') return ex.ok.map(i => ex.opts[i]).join('; ');
  if (ex.t === 'order') return ex.items.map((x, i) => `${i + 1}) ${x}`).join('  ');
  return '';
}

export function mountLesson(root, {title, kicker, back = '#/practice', exercises, seconds = 0, onFinish}) {
  const total = exercises.length;
  let queue, hearts, solved, missed, cur, ans, phase, view, started, timer, left;

  function reset() {
    queue = exercises.map((ex, i) => i); hearts = 3; solved = 0; missed = new Set(); phase = 'answer'; started = Date.now(); left = seconds;
    clearInterval(timer); if (seconds) timer = setInterval(tick, 1000);
    next(true);
  }
  function tick() { left--; const el = root.querySelector('.ls-timer b'); if (el) el.textContent = fmt(left); if (left <= 0) { clearInterval(timer); finish(false, 'time'); } }
  const fmt = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

  function next(first) {
    if (!first) queue.shift();
    if (!queue.length) return finish(true);
    cur = exercises[queue[0]]; phase = 'answer'; ans = initial(cur); view = prepare(cur); render();
  }
  function initial(ex) { return ex.t === 'multi' || ex.t === 'order' ? [] : ex.t === 'match' ? {left: null, done: [], wrong: null} : ex.t === 'classify' ? {i: 0, wrong: null} : null; }
  // Display order is shuffled once per appearance; answers are stored as original indices.
  function prepare(ex) {
    if (['choice', 'case', 'fill', 'multi'].includes(ex.t)) return {opts: shuffle(ex.opts.map((o, i) => i))};
    if (ex.t === 'order') return {pool: shuffle(ex.items.map((x, i) => i))};
    if (ex.t === 'match') return {L: shuffle(ex.pairs.map((p, i) => i)), R: shuffle(ex.pairs.map((p, i) => i))};
    if (ex.t === 'classify') return {items: shuffle(ex.items.map((x, i) => i))};
    return {};
  }
  const ready = () => ans !== null && !(Array.isArray(ans) && !ans.length) && !(cur.t === 'order' && ans.length < cur.items.length) && cur.t !== 'match' && cur.t !== 'classify';

  function body() {
    const ex = cur, locked = phase !== 'answer';
    const opt = (i, text, on) => `<button type="button" class="ls-opt ${phase !== 'answer' && (cur.t === 'multi' ? cur.ok.includes(i) : cur.ok === i) ? 'ok' : ''} ${phase === 'wrong' && on && !(cur.t === 'multi' ? cur.ok.includes(i) : cur.ok === i) ? 'no' : ''}" data-pick="${i}" aria-pressed="${on}" ${locked ? 'disabled' : ''}>${md(text)}</button>`;
    if (ex.t === 'tf') return `<p class="ls-q">${md(ex.q)}</p><div class="ls-opts two">${[[true, 'Верно'], [false, 'Неверно']].map(([v, t]) => `<button type="button" class="ls-opt ${phase !== 'answer' && v === ex.ok ? 'ok' : ''} ${phase === 'wrong' && ans === v ? 'no' : ''}" data-tf="${v}" aria-pressed="${ans === v}" ${locked ? 'disabled' : ''}>${icon(v ? 'check' : 'x')} ${t}</button>`).join('')}</div>`;
    if (ex.t === 'choice' || ex.t === 'case') return `${ex.s ? `<div class="ls-case">${icon('users')}<p>${md(ex.s)}</p></div>` : ''}<p class="ls-q">${md(ex.q)}</p><div class="ls-opts">${view.opts.map(i => opt(i, ex.opts[i], ans === i)).join('')}</div>`;
    if (ex.t === 'multi') return `<p class="ls-q">${md(ex.q)}</p><p class="ls-sub">${plural(ex.ok.length, 'верный ответ', 'верных ответа', 'верных ответов')}</p><div class="ls-opts">${view.opts.map(i => opt(i, ex.opts[i], ans.includes(i))).join('')}</div>`;
    if (ex.t === 'fill') { const [a, b] = ex.q.split('___'); return `<p class="ls-q ls-fill">${md(a)}<span class="ls-blank ${ans !== null ? 'is-set' : ''}">${ans !== null ? md(ex.opts[ans]) : '&nbsp;'}</span>${md(b || '')}</p><div class="ls-chips">${view.opts.map(i => `<button type="button" class="ls-chip ${phase !== 'answer' && i === ex.ok ? 'ok' : ''} ${phase === 'wrong' && ans === i ? 'no' : ''}" data-pick="${i}" aria-pressed="${ans === i}" ${locked ? 'disabled' : ''}>${md(ex.opts[i])}</button>`).join('')}</div>`; }
    if (ex.t === 'order') return `<p class="ls-q">${md(ex.q)}</p><ol class="ls-seq">${ex.items.map((x, k) => ans[k] !== undefined ? `<li><button type="button" class="ls-chip is-set ${phase === 'wrong' ? (ans[k] === k ? 'ok' : 'no') : phase === 'right' ? 'ok' : ''}" data-unorder="${k}" ${locked ? 'disabled' : ''}>${md(ex.items[ans[k]])}</button></li>` : `<li class="ls-slot"><span>${k + 1}</span></li>`).join('')}</ol><div class="ls-chips">${view.pool.filter(i => !ans.includes(i)).map(i => `<button type="button" class="ls-chip" data-order="${i}" ${locked ? 'disabled' : ''}>${md(ex.items[i])}</button>`).join('')}</div>`;
    if (ex.t === 'match') { const col = (side, idx) => idx.map(i => { const done = ans.done.includes(i), sel = side === 'L' && ans.left === i, bad = ans.wrong && ans.wrong[side === 'L' ? 0 : 1] === i; return `<button type="button" class="ls-chip ${done ? 'ok' : ''} ${bad ? 'no' : ''}" data-m${side.toLowerCase()}="${i}" aria-pressed="${sel}" ${done || locked ? 'disabled' : ''}>${md(ex.pairs[i][side === 'L' ? 0 : 1])}</button>`; }).join(''); return `<p class="ls-q">${md(ex.q)}</p><div class="ls-match"><div>${col('L', view.L)}</div><div>${col('R', view.R)}</div></div>`; }
    if (ex.t === 'classify') {
      const doneAll = ans.i >= view.items.length, it = doneAll ? null : ex.items[view.items[ans.i]];
      return `<p class="ls-q">${md(ex.q)}</p><div class="ls-sortcard ${ans.wrong !== null ? 'shake' : ''}">${doneAll ? `${icon('check')} Всё разложено` : md(it[0])}<small>${Math.min(ans.i + 1, view.items.length)} из ${view.items.length}</small></div><div class="ls-bins" style="--n:${ex.bins.length}">${ex.bins.map((b, k) => `<button type="button" class="ls-bin" data-bin="${k}" ${doneAll || locked ? 'disabled' : ''}><b>${md(b)}</b><span>${view.items.slice(0, ans.i).filter(i => ex.items[i][1] === k).map(i => `<i>${esc(ex.items[i][0])}</i>`).join('')}</span></button>`).join('')}</div>`;
    }
    return '';
  }

  function foot() {
    if (phase === 'answer') return `<div class="ls-foot"><div class="wrap ls-foot-in"><span class="ls-tip">${cur.t === 'match' || cur.t === 'classify' ? 'Ответ проверяется сразу' : 'Enter — проверить'}</span><button class="btn" data-ls="check" ${ready() ? '' : 'disabled'}>Проверить</button></div></div>`;
    const ok = phase === 'right';
    return `<div class="ls-foot ${ok ? 'is-ok' : 'is-no'}" role="status"><div class="wrap ls-foot-in"><div class="ls-verdict">${icon(ok ? 'check' : 'x')}<div><b>${ok ? 'Верно' : 'Не совсем'}</b>${!ok && solution(cur) ? `<p><span class="muted">Правильно:</span> ${md(solution(cur))}</p>` : ''}${cur.why ? `<p>${md(cur.why)}</p>` : ''}</div></div><button class="btn ${ok ? '' : 'dark'}" data-ls="next" autofocus>Дальше</button></div></div>`;
  }

  function render() {
    const pct = solved / total * 100;
    root.innerHTML = `<div class="ls" data-type="${cur.t}"><div class="ls-top"><div class="wrap ls-top-in"><a class="ls-close" href="${back}" aria-label="Выйти из урока">${icon('x')}</a><div class="bar ls-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${solved}" aria-label="Пройдено"><i style="width:${pct}%"></i></div>${seconds ? `<span class="ls-timer">${icon('clock')}<b>${fmt(left)}</b></span>` : ''}<span class="ls-hearts" aria-label="Жизни: ${hearts}">${[0, 1, 2].map(i => icon('heart', i < hearts ? 'on' : '')).join('')}</span></div></div>
      <div class="wrap ls-main"><p class="label">${esc(kicker || title)} · ${esc(TYPES[cur.t])}</p>${body()}</div>${foot()}</div>`;
    if (phase !== 'answer') root.querySelector('[data-ls="next"]')?.focus();
  }

  function verdict(ok) {
    if (ok) solved++; else { hearts--; missed.add(queue[0]); queue.push(queue[0]); }
    phase = ok ? 'right' : 'wrong'; render();
  }
  function afterVerdict() { if (hearts <= 0) return finish(false, 'hearts'); next(); }

  function finish(passed, why) {
    clearInterval(timer);
    const mistakes = missed.size, perfect = passed && mistakes === 0, xp = passed ? 10 + (perfect ? 5 : 0) + (seconds ? 10 : 0) : 0;
    const secs = Math.round((Date.now() - started) / 1000);
    root.innerHTML = `<div class="ls ls-end"><div class="wrap ls-main"><div class="ls-result ${passed ? 'ok' : 'no'}"><span class="ls-big">${icon(passed ? (perfect ? 'crown' : 'check') : why === 'time' ? 'clock' : 'heart')}</span><h1>${passed ? (perfect ? 'Без единой ошибки' : 'Урок пройден') : why === 'time' ? 'Время вышло' : 'Жизни закончились'}</h1><p class="muted">${passed ? esc(title) : 'Ничего страшного: ошибки показывают, что повторить. Попробуйте ещё раз — задания перемешаются.'}</p>
      ${passed ? `<div class="kpis"><div class="kpi"><span>Опыт</span><b>+${xp}</b></div><div class="kpi"><span>Точность</span><b>${Math.round(total / (total + mistakes) * 100)}%</b></div><div class="kpi"><span>Время</span><b>${fmt(secs)}</b></div></div>` : ''}
      ${mistakes ? `<details class="ls-review"><summary>Где были ошибки (${mistakes})</summary><ul>${[...missed].map(i => exercises[i]).map(ex => `<li><b>${md(ex.s ? ex.q : ex.q.replace('___', '…'))}</b><span>${md(solution(ex) || ex.why || '')}</span></li>`).join('')}</ul></details>` : ''}
      <div class="ls-actions">${passed ? `<a class="btn" href="${back}">Продолжить ${icon('arrow')}</a><button class="btn ghost" data-ls="again">Пройти ещё раз</button>` : `<button class="btn" data-ls="again">${icon('replay')} Ещё раз</button><a class="btn ghost" href="${back}">К пути</a>`}</div></div></div></div>`;
    root.querySelector('.ls-actions .btn')?.focus();
    onFinish?.({passed, mistakes, xp});
  }

  function onClick(e) {
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    const d = t.dataset;
    if (d.ls === 'check' && ready()) return verdict(check(cur, ans));
    if (d.ls === 'next') return afterVerdict();
    if (d.ls === 'again') return reset();
    if (phase !== 'answer') return;
    if (d.tf !== undefined) { ans = d.tf === 'true'; return render(); }
    if (d.pick !== undefined) { const i = Number(d.pick); if (cur.t === 'multi') ans = ans.includes(i) ? ans.filter(x => x !== i) : [...ans, i]; else ans = i; return render(); }
    if (d.order !== undefined) { ans = [...ans, Number(d.order)]; return render(); }
    if (d.unorder !== undefined) { ans = ans.filter((_, k) => k !== Number(d.unorder)); return render(); }
    if (d.ml !== undefined) { ans.left = Number(d.ml); ans.wrong = null; return render(); }
    if (d.mr !== undefined) {
      if (ans.left === null) return;
      const r = Number(d.mr);
      if (r === ans.left) { ans.done.push(r); ans.left = null; ans.wrong = null; if (ans.done.length === cur.pairs.length) return ans.missed ? verdict(false) : verdict(true); }
      else { ans.wrong = [ans.left, r]; ans.missed = true; ans.left = null; }
      return render();
    }
    if (d.bin !== undefined) {
      const item = cur.items[view.items[ans.i]];
      if (item[1] === Number(d.bin)) { ans.i++; ans.wrong = null; if (ans.i >= view.items.length) return ans.missed ? verdict(false) : verdict(true); }
      else { ans.wrong = Number(d.bin); ans.missed = true; }
      return render();
    }
  }
  function onKey(e) {
    if (!root.querySelector('.ls') || e.target.closest('input,textarea')) return;
    if (e.key === 'Enter') {
      const b = root.querySelector('[data-ls="check"]:not([disabled]), [data-ls="next"]');
      if (!b || (phase === 'answer' && document.activeElement?.matches?.('.ls-opt,.ls-chip,.ls-bin'))) return;
      e.preventDefault(); b.click();
    }
    const n = Number(e.key); if (phase === 'answer' && n >= 1 && n <= 9) { const opts = root.querySelectorAll('.ls-opts .ls-opt, .ls-chips .ls-chip, .ls-bins .ls-bin'); opts[n - 1]?.click(); }
  }
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  reset();
  return {destroy() { clearInterval(timer); root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); }};
}
