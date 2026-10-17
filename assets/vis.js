// Visual blocks for theory ideas: compare, flow, ladder, cards, matrix, table.
import {esc, icon} from './ui.js';

let seq = 0;
const note = b => b.note ? `<p class="v-note">${icon('bulb')}<span>${esc(b.note)}</span></p>` : '';
const title = b => b.title ? `<div class="vis-title">${esc(b.title)}</div>` : '';

const kinds = {
  compare: b => `<div class="v-compare" style="--n:${b.cols.length}">${b.cols.map(c => `<section class="v-col ${c.tone || 'neutral'}"><h4>${esc(c.h)}</h4><ul>${c.items.map(i => `<li>${icon(c.tone === 'bad' ? 'x' : c.tone === 'good' ? 'check' : 'dot')}<span>${esc(i)}</span></li>`).join('')}</ul></section>`).join('')}</div>`,
  flow: b => {
    const id = 'vd' + (++seq), detailed = !b.compact && b.steps.some(s => s[1]);
    if (!detailed) return `<div class="v-flow compact">${b.steps.map(([t], i) => `<div class="v-step"><span class="n">${i + 1}</span><b>${esc(t)}</b></div>`).join('')}</div>`;
    return `<div class="v-flow" role="group">${b.steps.map(([t, x], i) => `<button type="button" class="v-step" data-step="${i}" aria-pressed="${i === 0}" aria-controls="${id}" data-text="${esc(x)}" data-title="${esc(t)}"><span class="n">${i + 1}</span><b>${esc(t)}</b></button>`).join('')}</div><div class="v-detail" id="${id}" aria-live="polite"><b>${esc(b.steps[0][0])}</b>${esc(b.steps[0][1])}</div>`;
  },
  ladder: b => `<div class="v-ladder">${b.steps.map(([t, x], i) => `<div class="v-rung" style="--i:${i}"><span class="n">${i + 1}</span><div><b>${esc(t)}</b>${x ? `<span>${esc(x)}</span>` : ''}</div></div>`).join('')}</div>`,
  cards: b => `<div class="v-cards">${b.items.map(([t, x], i) => `<div class="v-card"><span class="ic">${b.numbered ? i + 1 : icon('check')}</span><b>${esc(t)}</b>${x ? `<span>${esc(x)}</span>` : ''}</div>`).join('')}</div>`,
  matrix: b => `<div class="v-matrix"><span></span><span class="ax">${esc(b.x[0])}</span><span class="ax">${esc(b.x[1])}</span>${[0, 1].map(r => `<span class="ax ay">${esc(b.y[r])}</span>${[0, 1].map(c => { const [t, x] = b.cells[r * 2 + c]; return `<div class="v-q q${r * 2 + c}"><b>${esc(t)}</b><span>${esc(x)}</span></div>`; }).join('')}`).join('')}</div>`,
  table: b => `<div class="v-scroll"><table class="v-table"><thead><tr>${b.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`
};

export const renderVis = b => kinds[b.type] ? `<figure class="vis" style="margin-inline:0">${title(b)}${kinds[b.type](b)}${note(b)}</figure>` : '';

export function bindVis(root) {
  root.addEventListener('click', e => {
    const step = e.target.closest('.v-step[data-step]');
    if (!step) return;
    const group = step.parentElement, detail = document.getElementById(step.getAttribute('aria-controls'));
    group.querySelectorAll('.v-step').forEach(s => s.setAttribute('aria-pressed', String(s === step)));
    detail.innerHTML = `<b>${esc(step.dataset.title)}</b>${esc(step.dataset.text)}`;
  });
}
