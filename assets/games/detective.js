// «Найди разрыв»: отчёт показывает 2 дня, люди ждут 7. Три проверки, чтобы найти, где лежит заявка,
// потом — выбрать меру и проверить её на тех же делах.
import {esc, icon} from '../ui.js';
import {clone} from './kit.js';

export const intro = {
  story: 'Отчёт сервиса: справка готовится за 2 дня. Студенты жалуются, что ждут неделю. Руководитель хочет нанять ещё одного сотрудника.',
  goal: 'Найти этап, где на самом деле теряется время, и выбрать меру, которая его сократит.',
  rules: ['Источников шесть, а проверок только три. Выбирайте, что откроет больше фактов.', 'Факты подсвечивают этапы процесса. Потом отметьте этап с главной потерей.', 'Выберите меру — пилот на тех же делах покажет, сработала ли она.']
};
export const scenarios = [{name: 'Справка для студента'}, {name: 'Заявка на закупку'}, {name: 'Пропуск для гостя'}];

const STAGES = [['reg', 'Регистрация'], ['check', 'Проверка комплекта'], ['work', 'Исполнение'], ['approve', 'Согласование'], ['send', 'Выдача']];
// [work, wait] in days per stage for each scenario; cause = stage with the hidden loss.
const CASES = [
  {cause: 'approve', fix: 'deputy', times: {reg: [.2, .3], check: [.3, .2], work: [1, .4], approve: [.2, 3.6], send: [.3, .5]}},
  {cause: 'check', fix: 'checklist', times: {reg: [.2, .3], check: [.5, 2.8], work: [1.1, .6], approve: [.3, .6], send: [.2, .4]}},
  {cause: 'work', fix: 'early', times: {reg: [.2, .2], check: [.3, .3], work: [1, 3.4], approve: [.2, .5], send: [.3, .3]}}
];
const SOURCES = [
  {id: 'method', name: 'Методика отчёта', what: 'Как считается «2 дня»'},
  {id: 'chrono', name: 'Хронология пяти дел', what: 'Даты каждого шага'},
  {id: 'returns', name: 'Журнал возвратов', what: 'Сколько заявок возвращали'},
  {id: 'load', name: 'Загрузка согласующего', what: 'Очередь на подпись'},
  {id: 'interview', name: 'Разговор с исполнителем', what: 'Что мешает работать'},
  {id: 'complaints', name: 'Жалобы клиентов', what: 'На что жалуются'}
];
const CLUES = {
  method: () => ['Отчёт считает только время работы исполнителя. Ожидание между этапами в «2 дня» не входит.', []],
  chrono: c => [`По пяти делам больше всего времени заявка лежит на этапе «${stageName(c.cause)}».`, [c.cause], true],
  returns: c => c.cause === 'check' ? ['Каждую вторую заявку возвращают за недостающими документами. Круг возврата — 2–3 дня.', ['check']] : ['Возвратов мало — 1 из 15 заявок. Дело не в них.', []],
  load: c => c.cause === 'approve' ? ['Все заявки подписывает один заместитель. В очереди 40 документов, он смотрит их раз в два дня.', ['approve']] : ['Согласующий успевает: очередь 3–4 документа.', []],
  interview: c => c.cause === 'work' ? ['«Я жду данные из бухгалтерии. Запрашиваю, когда беру заявку в работу, — и жду 3 дня».', ['work']] : ['«Работы много, но сама справка занимает час. Остальное — не от меня».', []],
  complaints: c => [`Чаще всего спрашивают: «Почему так долго, если всё уже сдал?» Заявка «пропадает» после этапа «${stageName(STAGES[Math.max(0, STAGES.findIndex(s => s[0] === c.cause) - 1)][0])}».`, []]
};
const FIXES = [
  {id: 'hire', name: 'Нанять ещё одного исполнителя', detail: 'Предложение руководителя.'},
  {id: 'deputy', name: 'Право подписи до лимита — начальникам отделов', detail: 'Разгрузить единственного согласующего.'},
  {id: 'checklist', name: 'Чек‑лист комплектности при приёме', detail: 'Не брать неполные заявки в работу.'},
  {id: 'early', name: 'Запрашивать данные у бухгалтерии в день регистрации', detail: 'Ожидание идёт параллельно, а не после.'},
  {id: 'report', name: 'Поменять методику отчёта', detail: 'Считать полный срок от заявки до выдачи.'}
];
const stageName = id => STAGES.find(s => s[0] === id)[1];
const total = t => Object.values(t).reduce((n, [w, q]) => n + w + q, 0);
const fmt = n => n.toFixed(1).replace('.', ',');
const CHECKS = 3;

export function create(scenario = 0) {
  return {scenario, phase: 'search', opened: [], marked: [], suspect: null, fix: null, pilot: null, hint: 'Выберите источник. Каждый стоит одну проверку.', done: false};
}

export function pilotTimes(c, fix) {
  const t = clone(c.times);
  if (fix === c.fix) t[c.cause][1] = .4;
  else if (fix === 'hire') t.work[0] = t.work[0] * .8;
  return t;
}

export function act(state, a) {
  const s = clone(state), c = CASES[s.scenario]; s.flash = null;
  if (a.type === 'open' && s.phase === 'search') {
    if (s.opened.includes(a.arg) || s.opened.length >= CHECKS) return state;
    s.opened.push(a.arg);
    const [, marks] = CLUES[a.arg](c); s.marked = [...new Set([...s.marked, ...marks])];
    s.hint = s.opened.length < CHECKS ? `Осталось проверок: ${CHECKS - s.opened.length}.` : 'Проверки закончились. Нажмите на этап, где, по‑вашему, главная потеря.';
    if (s.opened.length >= CHECKS) s.phase = 'suspect';
    return s;
  }
  if (a.type === 'enough' && s.phase === 'search' && s.opened.length) { s.phase = 'suspect'; s.hint = 'Нажмите на этап, где, по‑вашему, главная потеря.'; return s; }
  if (a.type === 'suspect' && s.phase === 'suspect') { s.suspect = a.arg; s.phase = 'fix'; s.hint = `Ваша версия: «${stageName(a.arg)}». Выберите меру.`; return s; }
  if (a.type === 'fix' && s.phase === 'fix') { s.fix = a.arg; return s; }
  if (a.type === 'repick' && s.phase === 'fix') { s.phase = 'suspect'; s.suspect = null; s.fix = null; s.hint = 'Нажмите на этап.'; return s; }
  if (a.type === 'pilot' && s.phase === 'fix' && s.fix) { s.pilot = pilotTimes(c, s.fix); s.done = true; return s; }
  return state;
}

export function hud(s) {
  const c = CASES[s.scenario];
  return [['По отчёту', '2 дня', ''], ['Реально ждут', `${fmt(total(c.times))} дня`, 'bad'], ['Проверки', `${CHECKS - s.opened.length} из ${CHECKS}`, s.opened.length >= CHECKS ? 'warn' : '', (CHECKS - s.opened.length) / CHECKS * 100]];
}

function timeline(s, c) {
  const showTimes = s.opened.includes('chrono'), max = Math.max(...Object.values(c.times).map(([w, q]) => w + q));
  return `<div class="dt-line">${STAGES.map(([id, name]) => {
    const [w, q] = c.times[id], hot = s.marked.includes(id), pick = s.phase === 'suspect' || s.phase === 'fix';
    return `<button class="dt-stage ${hot ? 'is-hot' : ''} ${s.suspect === id ? 'is-suspect' : ''}" data-act="suspect" data-arg="${id}" ${pick ? '' : 'aria-disabled="true"'}><b>${esc(name)}</b>${showTimes ? `<span class="dt-bars" aria-label="Работа ${fmt(w)}, ожидание ${fmt(q)} дня"><i class="w" style="height:${w / max * 100}%"></i><i class="q" style="height:${q / max * 100}%"></i></span><span class="g-small">${fmt(w + q)} дн.</span>` : `<span class="dt-q">?</span>`}${hot ? `<span class="g-tag bad">${icon('flag')} улика</span>` : ''}</button>`;
  }).join('<span class="dt-arrow">→</span>')}</div>${showTimes ? `<p class="g-small dt-legend"><i class="w"></i> работа <i class="q"></i> ожидание</p>` : ''}`;
}

export function board(s) {
  const c = CASES[s.scenario];
  const sources = SOURCES.map(src => {
    const open = s.opened.includes(src.id), [text] = CLUES[src.id](c);
    return `<button class="g-opt dt-src ${open ? 'is-open' : ''}" data-act="open" data-arg="${src.id}" ${open || s.phase !== 'search' || s.opened.length >= CHECKS ? 'disabled' : ''} aria-pressed="${open}"><b>${icon(open ? 'eye' : 'search')} ${esc(src.name)}</b><span>${open ? esc(text) : esc(src.what)}</span></button>`;
  }).join('');
  const fixes = s.phase === 'fix' ? `<section class="g-panel"><h3>${icon('bolt')} Что изменить?</h3><div class="g-choice">${FIXES.map(f => `<button class="g-opt" data-act="fix" data-arg="${f.id}" aria-pressed="${s.fix === f.id}"><b>${esc(f.name)}</b><span>${esc(f.detail)}</span></button>`).join('')}</div><div class="g-row" style="margin-top:12px"><button class="btn" data-act="pilot" ${s.fix ? '' : 'disabled'}>${icon('play')} Проверить на тех же делах</button><button class="btn ghost small" data-act="repick">Другой этап</button></div></section>` : '';
  return `<section class="g-panel"><h3>${icon('flow')} Путь заявки <small>${s.phase === 'search' ? 'улики появятся на этапах' : 'нажмите этап с главной потерей'}</small></h3>${timeline(s, c)}</section>
    ${s.phase === 'search' ? `<section class="g-panel"><h3>${icon('search')} Источники</h3><div class="dt-sources">${sources}</div>${s.opened.length && s.opened.length < CHECKS ? `<button class="btn ghost small" style="margin-top:12px" data-act="enough">Фактов достаточно</button>` : ''}</section>` : `<section class="g-panel"><h3>${icon('eye')} Что узнали</h3><div class="g-list">${s.opened.map(id => `<p class="dt-fact"><b>${esc(SOURCES.find(x => x.id === id).name)}.</b> ${esc(CLUES[id](c)[0])}</p>`).join('')}</div></section>`}${fixes}`;
}

export function result(s) {
  const c = CASES[s.scenario], before = total(c.times), after = total(s.pilot), relevant = s.opened.filter(id => CLUES[id](c)[1].length || id === 'chrono').length;
  const stage = s.suspect === c.cause, fix = s.fix === c.fix, evidence = relevant >= 2;
  const stars = Math.max(1, stage + fix + (stage && fix && evidence));
  return {stars, title: fix ? `Срок: ${fmt(before)} → ${fmt(after)} дня` : 'Мера почти не помогла',
    summary: fix ? 'Пилот на тех же делах подтвердил: время терялось в ожидании, а не в работе.' : `Главная потеря была на этапе «${stageName(c.cause)}». Мера ${s.fix === 'hire' ? 'ускорила работу, но не ожидание' : 'не затронула эту очередь'}.`,
    stats: [['Было', `${fmt(before)} дн.`], ['Стало', `${fmt(after)} дн.`], ['Проверок', `${s.opened.length}/${CHECKS}`]],
    lines: [[stage, stage ? `Верно: время терялось на этапе «${stageName(c.cause)}».` : `Время терялось на этапе «${stageName(c.cause)}», а не «${stageName(s.suspect)}».`], [fix, fix ? 'Мера била в причину.' : 'Мера не про эту причину.'], [evidence, evidence ? 'Вывод опирался на несколько фактов.' : 'Фактов было мало — версия держалась на догадке.'], [s.opened.includes('method'), s.opened.includes('method') ? 'Поняли, почему отчёт показывал 2 дня.' : 'Не проверили, как считается отчётная цифра.']],
    lesson: 'Отчёт часто считает только работу, а люди ждут из‑за очередей и возвратов. Сначала найдите, где заявка лежит, — потом меняйте процесс. Нанять ещё людей — самая дорогая и часто бесполезная мера.'};
}
