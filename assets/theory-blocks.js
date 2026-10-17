// Renders structured theory blocks (tables, comparisons, flows, matrices, ladders, RACI, checklists).
// Interactive parts (step details, RACI filter, self-check) are bound once per root via bindTheoryBlocks().
import {blocksFor} from '../content/theory-blocks.js';

if (typeof document !== 'undefined' && !document.querySelector('link[data-theory-blocks]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = new URL('./theory-blocks.css', import.meta.url); link.dataset.theoryBlocks = '';
  document.head.append(link);
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let seq = 0;
const note = b => b.note ? `<p class="tb-note">${esc(b.note)}</p>` : '';
const head = (b, kind) => `<figcaption class="tb-head"><span class="tb-kind">${kind}</span><b>${esc(b.title)}</b></figcaption>`;

function steps(b, kind, cls) {
  const id = 'tb' + (++seq);
  const items = b.steps || b.levels;
  const detailed = items.some(([, t]) => t);
  const list = items.map(([title, text], i) => detailed
    ? `<li><button type="button" class="tb-step" data-tb-step="${i}" aria-controls="${id}" aria-pressed="${i === 0}"><span class="tb-num">${i + 1}</span><span>${esc(title)}</span></button></li>`
    : `<li><span class="tb-step is-static"><span class="tb-num">${i + 1}</span><span>${esc(title)}</span></span></li>`).join('');
  const texts = detailed ? `<div class="tb-detail" id="${id}" aria-live="polite" data-tb-texts='${esc(JSON.stringify(items.map(([t, x]) => [t, x || ''])))}'><b>${esc(items[0][0])}</b><p>${esc(items[0][1] || '')}</p></div>` : '';
  return `<figure class="tb ${cls}${b.loop ? ' is-loop' : ''}" data-tb>${head(b, kind)}<ol class="tb-steps">${list}</ol>${texts}${b.loop ? '<p class="tb-loop" aria-hidden="true">↻ выводы запускают следующий цикл</p>' : ''}${note(b)}</figure>`;
}

const renderers = {
  flow: b => steps(b, 'Схема', 'tb-flow'),
  scale: b => steps(b, 'Лестница', 'tb-scale'),
  compare: b => `<figure class="tb tb-compare" style="--cols:${b.columns.length}">${head(b, 'Сравнение')}<div class="tb-columns">${b.columns.map(c => `<section class="tb-col ${c.tone ? 'is-' + c.tone : ''}"><h4>${esc(c.head)}</h4><ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></section>`).join('')}</div>${note(b)}</figure>`,
  table: b => `<figure class="tb tb-table">${head(b, 'Таблица')}<div class="tb-scroll"><table><thead><tr>${b.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>${note(b)}</figure>`,
  cards: b => `<figure class="tb tb-cards ${b.tone ? 'is-' + b.tone : ''} ${b.compact ? 'is-compact' : ''}">${head(b, b.numbered ? 'Чек-лист' : 'Карточки')}<ul class="tb-grid">${b.items.map(([t, x], i) => `<li>${b.numbered ? `<span class="tb-num">${i + 1}</span>` : ''}<b>${esc(t)}</b>${x ? `<span>${esc(x)}</span>` : ''}</li>`).join('')}</ul>${note(b)}</figure>`,
  matrix: b => `<figure class="tb tb-matrix">${head(b, 'Матрица')}<div class="tb-matrix-grid"><span class="tb-axis-corner"></span>${b.x.map(x => `<span class="tb-axis-x">${esc(x)}</span>`).join('')}${[0, 1].map(r => `<span class="tb-axis-y">${esc(b.y[r])}</span>${[0, 1].map(c => { const [t, x] = b.cells[r * 2 + c]; return `<div class="tb-cell q${r * 2 + c}"><b>${esc(t)}</b><span>${esc(x)}</span></div>`; }).join('')}`).join('')}</div>${note(b)}</figure>`,
  checklist: b => `<figure class="tb tb-checklist">${head(b, 'Самопроверка')}<ul>${b.items.map((i, n) => `<li><label><input type="checkbox" data-tb-check> ${esc(i)}</label></li>`).join('')}</ul><p class="tb-check-result" aria-live="polite">Отмечено 0 из ${b.items.length}</p>${note(b)}</figure>`,
  raci: b => `<figure class="tb tb-raci" data-tb>${head(b, 'Матрица ответственности')}<div class="tb-raci-legend" role="group" aria-label="Подсветить роль">${[['R','выполняет'],['A','отвечает за итог'],['C','консультирует'],['I','информируется']].map(([l, t]) => `<button type="button" data-tb-raci="${l}" aria-pressed="false"><b>${l}</b> ${t}</button>`).join('')}</div><div class="tb-scroll"><table><thead><tr><th scope="col">Шаг</th>${b.roles.map(r => `<th scope="col">${esc(r)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(([step, cells]) => `<tr><th scope="row">${esc(step)}</th>${cells.map(c => `<td class="raci-${c || 'none'}" data-letter="${c}">${c ? `<abbr title="${{R:'Выполняет',A:'Отвечает за итог',C:'Консультирует',I:'Информируется'}[c]}">${c}</abbr>` : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${note(b)}</figure>`
};

export function renderBlock(b) { const r = renderers[b.type]; return r ? r(b) : ''; }
export function renderTheoryBlocks(topic, kind, key) {
  const list = blocksFor(topic, kind, key);
  return list.length ? `<div class="tb-set">${list.map(renderBlock).join('')}</div>` : '';
}

export function bindTheoryBlocks(root) {
  if (!root || root.dataset.tbBound) return;
  root.dataset.tbBound = '1';
  root.addEventListener('click', e => {
    const step = e.target.closest('[data-tb-step]');
    if (step) {
      const fig = step.closest('.tb'), detail = fig.querySelector('.tb-detail');
      const texts = JSON.parse(detail.dataset.tbTexts), [t, x] = texts[Number(step.dataset.tbStep)];
      fig.querySelectorAll('[data-tb-step]').forEach(s => s.setAttribute('aria-pressed', String(s === step)));
      detail.innerHTML = `<b>${esc(t)}</b><p>${esc(x)}</p>`;
      return;
    }
    const raci = e.target.closest('[data-tb-raci]');
    if (raci) {
      const fig = raci.closest('.tb'), on = raci.getAttribute('aria-pressed') !== 'true';
      fig.querySelectorAll('[data-tb-raci]').forEach(b => b.setAttribute('aria-pressed', String(on && b === raci)));
      fig.dataset.focus = on ? raci.dataset.tbRaci : '';
    }
  });
  root.addEventListener('change', e => {
    if (!e.target.matches('[data-tb-check]')) return;
    const fig = e.target.closest('.tb'), all = fig.querySelectorAll('[data-tb-check]'), done = [...all].filter(i => i.checked).length;
    fig.querySelector('.tb-check-result').textContent = done === all.length ? `Отмечено ${done} из ${all.length} — всё на месте` : `Отмечено ${done} из ${all.length}`;
  });
}
