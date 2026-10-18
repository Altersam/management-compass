// «Испорченный телефон»: поручение из шести смысловых частей проходит четыре передачи.
// Канал определяет, что сохранится. Ресурс ограничен, уточнение у источника — дважды.
import {esc, icon} from '../ui.js';
import {clone, avatar} from './kit.js';

export const intro = {
  story: 'Проректор дал поручение. Оно пройдёт через начальника отдела, координатора и исполнителя к подрядчику. Каждый пересказ что‑то теряет.',
  goal: 'Довести до подрядчика поручение так, чтобы две критичные части дошли точно, а остальные — не потерялись.',
  rules: ['На каждой передаче выберите канал. Устно — бесплатно, но точные условия теряются. Встреча с резюме — надёжно, но дорого.', 'Ресурс на всю цепочку — 5. «Уточнить у источника» восстанавливает одну часть (стоит 1, не больше двух раз).', 'Смотрите на дерево смысла: чем бледнее кружок, тем сильнее искажена часть.']
};
export const scenarios = [{name: 'Отчёт для министерства'}, {name: 'Ремонт аудитории'}];

const PARTS = [['goal', 'Цель'], ['deadline', 'Срок'], ['owner', 'Владелец'], ['criteria', 'Критерий'], ['limit', 'Ограничение'], ['context', 'Контекст']];
const TEXTS = [
  {goal: 'Отчёт о трудоустройстве выпускников', deadline: 'До 15 марта, 12:00', owner: 'Отвечает Ирина', criteria: 'Данные за 3 года, по каждому направлению', limit: 'Без персональных данных', context: 'Министерство сверит с налоговой базой', critical: ['deadline', 'limit']},
  {goal: 'Ремонт аудитории 304', deadline: 'Закончить до 25 августа', owner: 'Принимает Павел', criteria: 'Новые розетки у каждого стола', limit: 'Не шуметь до 14:00 — идут экзамены', context: 'Аудиторию отдают под компьютерный класс', critical: ['criteria', 'limit']}
];
const ROLES = ['Проректор', 'Начальник отдела', 'Координатор', 'Исполнитель', 'Подрядчик'];
export const CHANNELS = {
  voice: {name: 'Устно', cost: 0, keep: {goal: .97, deadline: .75, owner: .9, criteria: .7, limit: .65, context: .97}, note: 'Быстро, сохраняет смысл. Цифры и условия теряются.'},
  mail: {name: 'Письмо', cost: 1, keep: {goal: .93, deadline: 1, owner: .97, criteria: .97, limit: .97, context: .8}, note: 'Точные условия сохраняются. Контекст «зачем» сокращают.'},
  tracker: {name: 'Задача в трекере', cost: 1, keep: {goal: .85, deadline: 1, owner: 1, criteria: .85, limit: .7, context: .65}, note: 'Срок и владелец в полях. Остальное — как напишут.'},
  meet: {name: 'Встреча + резюме', cost: 2, keep: {goal: 1, deadline: 1, owner: 1, criteria: 1, limit: 1, context: 1}, note: 'Обсудили и записали. Дорого.'}
};
const RESOURCE = 5, CLARIFY = 2;
const state01 = v => v >= .75 ? 'ok' : v >= .45 ? 'blur' : 'lost';

export function create(scenario = 0) {
  const vals = Object.fromEntries(PARTS.map(([k]) => [k, 1]));
  return {scenario, step: 0, resource: RESOURCE, clarify: CLARIFY, channel: null, history: [vals], pick: null, hint: 'Выберите канал для первой передачи: проректор → начальник отдела.', done: false};
}

export function pass(vals, channel) { const c = CHANNELS[channel]; return Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, Math.round(v * c.keep[k] * 100) / 100])); }

export function act(state, a) {
  const s = clone(state); s.flash = null; const cur = s.history[s.history.length - 1];
  const rushed = s.step === 2;
  if (a.type === 'channel') { if (rushed && a.arg === 'meet') return state; s.channel = a.arg; return s; }
  if (a.type === 'pick') { s.pick = a.arg; return s; }
  if (a.type === 'clarify') {
    if (!s.pick || s.clarify <= 0 || s.resource < 1 || cur[s.pick] >= .99) return state;
    cur[s.pick] = 1; s.clarify--; s.resource--; s.flash = {tone: 'good', text: `Уточнили у проректора: «${PARTS.find(p => p[0] === s.pick)[1]}» снова точно.`}; s.pick = null; return s;
  }
  if (a.type === 'send') {
    const c = CHANNELS[s.channel]; if (!c || s.resource < c.cost) return state;
    s.resource -= c.cost; s.history.push(pass(cur, s.channel)); s.step++; s.channel = null; s.pick = null;
    const lost = PARTS.filter(([k]) => state01(s.history[s.step][k]) !== 'ok' && state01(cur[k]) === 'ok').map(p => p[1]);
    s.flash = lost.length ? {tone: 'bad', text: `После пересказа исказилось: ${lost.join(', ').toLowerCase()}.`} : {tone: 'good', text: 'Всё дошло без потерь.'};
    if (s.step >= ROLES.length - 1) { s.done = true; return s; }
    s.hint = s.step === 2 ? 'Исполнитель в разъездах — встретиться не получится. Выберите другой канал.' : `Передача ${s.step + 1}: ${ROLES[s.step]} → ${ROLES[s.step + 1]}.`;
    return s;
  }
  return state;
}

export function hud(s) {
  const crit = TEXTS[s.scenario].critical, cur = s.history[s.history.length - 1];
  return [['Передача', `${Math.min(s.step + 1, 4)} / 4`, '', s.step / 4 * 100], ['Ресурс', `${s.resource} из ${RESOURCE}`, s.resource === 0 ? 'bad' : '', s.resource / RESOURCE * 100], ['Уточнения', `${s.clarify}`, ''], ['Критичное цело', `${crit.filter(k => state01(cur[k]) === 'ok').length} из ${crit.length}`, crit.every(k => state01(cur[k]) === 'ok') ? 'good' : 'bad']];
}

export function board(s) {
  const t = TEXTS[s.scenario], cur = s.history[s.history.length - 1], rushed = s.step === 2;
  const tree = `<div class="tp-tree" style="--n:${ROLES.length}"><span></span>${ROLES.map((r, i) => `<span class="tp-role ${i === s.step ? 'is-now' : ''}">${avatar(r[0], i === s.step ? '#ffc53d' : '#efe3d3', 30)}<small>${esc(r)}</small></span>`).join('')}
    ${PARTS.map(([k, name]) => `<span class="tp-part ${t.critical.includes(k) ? 'is-crit' : ''}">${esc(name)}${t.critical.includes(k) ? ' ★' : ''}</span>${ROLES.map((r, i) => { const v = s.history[i]?.[k]; return v === undefined ? '<span class="tp-dot none"></span>' : `<span class="tp-dot ${state01(v)}" style="--o:${v}" title="${Math.round(v * 100)}%"></span>`; }).join('')}`).join('')}</div>
    <p class="g-small" style="margin-top:8px">● точно · ◐ размыто · ○ потеряно · ★ критично для этого поручения</p>`;
  const msg = `<div class="tp-msg">${PARTS.map(([k, name]) => `<button class="tp-line ${state01(cur[k])}" data-act="pick" data-arg="${k}" aria-pressed="${s.pick === k}"><b>${esc(name)}</b><span>${state01(cur[k]) === 'lost' ? '???' : esc(t[k])}${state01(cur[k]) === 'blur' ? ' <em>(неточно)</em>' : ''}</span></button>`).join('')}</div><button class="btn ghost small" data-act="clarify" ${s.pick && s.clarify > 0 && s.resource > 0 ? '' : 'disabled'}>${icon('replay')} Уточнить у источника (−1)</button>`;
  const channels = Object.entries(CHANNELS).map(([id, c]) => `<button class="g-opt" data-act="channel" data-arg="${id}" aria-pressed="${s.channel === id}" ${(rushed && id === 'meet') || s.resource < c.cost ? 'disabled' : ''}><b>${esc(c.name)} · ${c.cost ? '−' + c.cost : 'бесплатно'}</b><span>${rushed && id === 'meet' ? 'Недоступно: исполнитель в разъездах.' : esc(c.note)}</span></button>`).join('');
  return `<section class="g-panel"><h3>${icon('link')} Дерево смысла</h3>${tree}</section>
    <div class="g-cols"><section class="g-panel"><h3>${icon('chat')} Как поручение звучит сейчас <small>у: ${esc(ROLES[s.step])}</small></h3>${msg}</section>
    <section class="g-panel"><h3>${icon('arrow')} Канал: ${esc(ROLES[s.step])} → ${esc(ROLES[s.step + 1])}</h3><div class="g-choice">${channels}</div><button class="btn g-main-btn" style="margin-top:12px" data-act="send" ${s.channel ? '' : 'disabled'}>${icon('arrow')} Передать</button></section></div>`;
}

export function result(s) {
  const t = TEXTS[s.scenario], fin = s.history[s.history.length - 1];
  const critOk = t.critical.every(k => state01(fin[k]) === 'ok'), intact = PARTS.filter(([k]) => state01(fin[k]) === 'ok').length, lost = PARTS.filter(([k]) => state01(fin[k]) === 'lost');
  const stars = 1 + (critOk ? 1 : 0) + (critOk && intact >= 5 && lost.length === 0 ? 1 : 0);
  return {stars, title: critOk ? 'Подрядчик сделал то, что нужно' : 'Подрядчик сделал не то',
    summary: critOk ? `Дошло точно: ${intact} из 6 частей. Критичное — без искажений.` : `Исказилось критичное: ${t.critical.filter(k => state01(fin[k]) !== 'ok').map(k => PARTS.find(p => p[0] === k)[1].toLowerCase()).join(', ')}.`,
    stats: [['Точно', `${intact}/6`], ['Потеряно', String(lost.length)], ['Ресурс', `${s.resource} осталось`]],
    lines: PARTS.map(([k, name]) => [state01(fin[k]) === 'ok', `${name}: ${state01(fin[k]) === 'ok' ? 'дошло точно' : state01(fin[k]) === 'blur' ? 'дошло неточно' : 'потерялось'}${t.critical.includes(k) ? ' (критично)' : ''}`]),
    lesson: 'Точные условия — сроки, критерии, ограничения — переживают пересказ только в письменном виде. Смысл и контекст — в разговоре. Лучшее сочетание: обсудить голосом и сразу зафиксировать.'};
}
