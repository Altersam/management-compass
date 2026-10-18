// «День руководителя»: распланировать рабочий день — АБВГД, золотые часы хронотипа, делегирование,
// исключение хронофагов и запас времени на срочное. Потом день «проживается» с внезапными запросами.
import {esc, icon} from '../ui.js';
import {clone} from './kit.js';

export const intro = {
  story: 'Понедельник, 8:50. У вас семь рабочих часов, список дел длиннее, чем день, и вы — «жаворонок»: голова лучше всего работает до обеда. В течение дня обязательно прилетит что‑то срочное.',
  goal: 'Сделать все задачи группы А в срок, поставить сложное на золотые часы, поручить и убрать лишнее — и оставить запас на непредвиденное.',
  rules: ['Выберите задачу, затем час в расписании. Двухчасовая задача займёт два часа подряд (обед их разрывает).', 'Задачу можно «Поручить» сотруднику или «Убрать» из дня. Буквы А–Д подскажут последствия, но решать вам.', 'Нажмите «Прожить день»: срочные запросы займут свободный час, а если его нет — вытеснят то, что стоит в расписании.']
};
export const levels = ['6 задач, один срочный запрос', '8 задач, два срочных запроса', '9 задач, срочное с самого утра, без подсказок'];
export const scenarios = [{name: 'Понедельник'}, {name: 'Среда'}, {name: 'Пятница'}];

export const SLOTS = ['9:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];
const GOLDEN = [0, 1, 2];
const ALL = {
  strat: {name: 'Стратегия отдела на квартал', cls: 'А', h: 2, deep: true, note: 'Сложная работа, нужна свежая голова.'},
  report: {name: 'Отчёт в министерство', cls: 'А', h: 1, due: 5, note: 'Сдать до 16:00.'},
  talk: {name: 'Разговор с сотрудником об ошибке', cls: 'Б', h: 1, note: 'Если отложить — ошибка повторится.'},
  mail: {name: 'Почта одним пакетом', cls: 'В', h: 1, note: 'Можно и позже, но лучше разом.'},
  spr: {name: 'Справка для отдела кадров', cls: 'Г', h: 1, note: 'Типовая, специалист сделает не хуже.'},
  news: {name: 'Лента новостей и чаты', cls: 'Д', h: 1, note: 'Ощущение занятости.'},
  meet: {name: 'Совещание без повестки', cls: 'Д', h: 1, note: '«На всякий случай».'},
  plan: {name: 'План на завтра и обзор недели', cls: 'Б', h: 1, note: 'Без него завтра снова пожары.'},
  rector: {name: 'Данные для проректора', cls: 'А', h: 1, due: 2, note: 'Нужны к 12:00.'},
  train: {name: 'Инструктаж нового сотрудника', cls: 'Г', h: 1, note: 'Может провести наставник.'}
};
const SETS = [['strat', 'report', 'talk', 'mail', 'spr', 'news'], ['strat', 'report', 'talk', 'mail', 'spr', 'news', 'meet', 'plan'], ['strat', 'report', 'talk', 'mail', 'spr', 'news', 'meet', 'rector', 'train']];
const EVENTS = [[[2, 'Звонок: сбой в системе приёма заявок']], [[1, 'Звонок: сбой в системе приёма заявок'], [5, 'Проректор просит срочно уточнить цифры']], [[0, 'Авария в общежитии: нужен ваш звонок'], [4, 'Проректор просит срочно уточнить цифры']]];
const CLS_HELP = {'А': 'серьёзные последствия — делать', 'Б': 'умеренные последствия', 'В': 'почти без последствий', 'Г': 'можно поручить', 'Д': 'можно исключить'};

let LEVEL = 1;
export function create(scenario = 0, level = 1) {
  LEVEL = level;
  const ids = SETS[level] || SETS[1];
  return {scenario, level, tasks: ids.map(id => ({id, ...ALL[id], at: null, fate: null})), picked: null, log: [], events: [], hint: 'Начните с задач группы А. Что требует свежей головы — на утро.', done: false};
}

const slotOf = (s, i) => s.tasks.find(t => t.at !== null && i >= t.at && i < t.at + t.h);
const fits = (s, t, i) => i + t.h <= SLOTS.length && !(t.h === 2 && i === 3) && [...Array(t.h)].every((_, k) => !slotOf(s, i + k) || slotOf(s, i + k).id === t.id);

export function act(state, a) {
  const s = clone(state); s.flash = null;
  const t = s.tasks.find(x => x.id === s.picked);
  if (a.type === 'pick') { s.picked = s.picked === a.arg ? null : a.arg; s.hint = s.picked ? 'Выберите час, «Поручить» или «Убрать».' : 'Выберите следующую задачу.'; return s; }
  if (a.type === 'slot') {
    const i = Number(a.arg), there = slotOf(s, i);
    if (!t) { if (there) { there.at = null; s.hint = `«${there.name}» вернулась в список.`; } return s; }
    if (!fits(s, t, i)) { s.flash = {tone: 'bad', text: t.h === 2 ? 'Двухчасовой задаче нужны два свободных часа подряд, без обеда посередине.' : 'Этот час занят.'}; return s; }
    t.at = i; t.fate = null; s.picked = null; s.hint = 'Распределите остальные задачи. Свободный час — это запас на срочное.'; return s;
  }
  if (a.type === 'delegate' && t) { t.at = null; t.fate = 'delegated'; s.picked = null; return s; }
  if (a.type === 'drop' && t) { t.at = null; t.fate = 'dropped'; s.picked = null; return s; }
  if (a.type === 'restore' && t) { t.fate = null; s.picked = null; return s; }
  if (a.type === 'run') return live(s);
  return state;
}

// Urgent requests take the first free hour from their time on; with no free hour, they push out the task scheduled then.
export function live(s) {
  const free = i => !slotOf(s, i) && !s.events.some(e => e.at === i);
  for (const [time, title] of EVENTS[s.level] || EVENTS[1]) {
    let j = time; while (j < SLOTS.length && !free(j)) j++;
    if (j < SLOTS.length) { s.events.push({at: j, title, ok: true}); continue; }
    const victim = slotOf(s, time); s.events.push({at: time, title, ok: false, victim: victim?.id});
    if (victim) { victim.fate = 'bumped'; victim.at = null; }
  }
  s.done = true; return s;
}

const fmtSlot = i => SLOTS[i];
export function hud(s) {
  const planned = s.tasks.filter(t => t.at !== null).reduce((n, t) => n + t.h, 0), aLeft = s.tasks.filter(t => t.cls === 'А' && t.at === null).length;
  const freeH = SLOTS.length - planned;
  return [['Занято часов', `${planned} из ${SLOTS.length}`, planned > 6 ? 'warn' : '', planned / SLOTS.length * 100], ['Запас', `${freeH} ч`, freeH === 0 ? 'bad' : 'good'], ['Задачи А без места', `${aLeft}`, aLeft ? 'warn' : 'good'], ['Срочных запросов', `${(EVENTS[s.level] || []).length}`, '']];
}

export function board(s) {
  const pool = s.tasks.filter(t => t.at === null).map(t => `<button class="g-opt dy-task ${t.fate ? 'is-' + t.fate : ''}" data-act="pick" data-arg="${t.id}" aria-pressed="${s.picked === t.id}"><b><span class="dy-cls" data-c="${t.cls}">${t.cls}</span>${esc(t.name)}</b><span>${t.h} ч · ${esc(t.note)}${t.fate === 'delegated' ? ' · поручено' : t.fate === 'dropped' ? ' · убрано' : ''}</span></button>`).join('');
  const slots = SLOTS.map((time, i) => {
    const t = slotOf(s, i), start = t && t.at === i, gold = GOLDEN.includes(i);
    const cell = `<button class="dy-slot ${gold ? 'is-gold' : ''} ${t ? 'is-busy' : ''} ${t && !start ? 'is-cont' : ''}" data-act="slot" data-arg="${i}" aria-label="${time}${t ? ': ' + esc(t.name) : ': свободно'}"><span class="dy-time">${time}</span><span class="dy-what">${t ? (start ? `<b>${esc(t.name)}</b><small>${t.cls} · нажмите, чтобы снять</small>` : '<small>продолжение</small>') : `<small>${gold ? 'золотой час' : 'свободно'}</small>`}</span></button>`;
    return i === 4 ? `<div class="dy-lunch">13:00 · обед</div>${cell}` : cell;
  }).join('');
  const sel = s.tasks.find(t => t.id === s.picked);
  const tools = sel ? `<div class="g-row" style="margin-top:12px"><button class="btn ghost small" data-act="delegate">${icon('users')} Поручить</button><button class="btn ghost small" data-act="drop">${icon('x')} Убрать из дня</button>${sel.fate ? `<button class="btn ghost small" data-act="restore">Вернуть в список</button>` : ''}</div>` : '';
  return `<div class="g-cols"><section class="g-panel"><h3>${icon('calendar')} Расписание <small>золотые часы — до обеда</small></h3><div class="dy-day">${slots}</div><button class="btn g-main-btn" style="margin-top:14px" data-act="run">${icon('play')} Прожить день</button></section>
    <section class="g-panel"><h3>${icon('flag')} Дела <small>${s.level < 2 ? 'А — делать, Г — поручить, Д — исключить' : 'решайте сами'}</small></h3><div class="g-list">${pool || '<p class="g-small">Все дела распределены.</p>'}</div>${tools}</section></div>`;
}

export function result(s) {
  const A = s.tasks.filter(t => t.cls === 'А');
  const aOk = A.every(t => t.at !== null && (t.due === undefined || t.at + t.h - 1 <= t.due));
  const strat = s.tasks.find(t => t.id === 'strat'), gold = strat.at !== null && GOLDEN.includes(strat.at) && GOLDEN.includes(strat.at + 1);
  const dDone = s.tasks.filter(t => t.cls === 'Д' && t.at !== null), gSelf = s.tasks.filter(t => t.cls === 'Г' && t.at !== null);
  const aDelegated = A.filter(t => t.fate === 'delegated' || t.fate === 'dropped'), bLost = s.tasks.filter(t => t.cls === 'Б' && t.at === null);
  const absorbed = s.events.filter(e => e.ok).length, bumped = s.events.filter(e => !e.ok);
  const focus = gold && !dDone.length && !gSelf.length && !bLost.length;
  const stars = 1 + (aOk ? 1 : 0) + (aOk && focus ? 1 : 0);
  return {stars, title: aOk ? (stars === 3 ? 'День под контролем' : 'Главное сделано') : 'Главное не сделано',
    summary: aOk ? `Задачи А выполнены. Срочных запросов принято спокойно: ${absorbed} из ${s.events.length}.` : `Не выполнено вовремя: ${A.filter(t => !(t.at !== null && (t.due === undefined || t.at + t.h - 1 <= t.due))).map(t => t.name.toLowerCase()).join(', ')}.`,
    stats: [['Задачи А', aOk ? 'в срок' : 'сорваны'], ['Срочное', `${absorbed}/${s.events.length} в запас`], ['Хронофаги', dDone.length ? `${dDone.length} в плане` : 'убраны']],
    lines: [
      [aOk, aOk ? 'Всё из группы А сделано и в срок.' : 'Задача группы А не сделана или сделана после срока.'],
      [gold, gold ? 'Стратегия — на золотых часах, когда голова свежая.' : 'Стратегия не попала на золотые часы — получилась поверхностной.'],
      [!gSelf.length, gSelf.length ? `Сделали сами то, что можно было поручить: ${gSelf.map(t => t.name.toLowerCase()).join(', ')}.` : 'Типовое поручено — время осталось для своего.'],
      [!dDone.length, dDone.length ? `В плане остались хронофаги: ${dDone.map(t => t.name.toLowerCase()).join(', ')}.` : 'Хронофаги исключены.'],
      [!bLost.length, bLost.length ? `Отложено важное: ${bLost.map(t => t.name.toLowerCase()).join(', ')}.` : 'Важное‑несрочное не потерялось.'],
      ...(aDelegated.length ? [[false, `Задачу группы А нельзя поручить или убрать: ${aDelegated.map(t => t.name.toLowerCase()).join(', ')}.`]] : []),
      ...bumped.map(e => [false, `${fmtSlot(e.at)} — «${e.title}»: свободного часа не было${e.victim ? `, вытеснено «${ALL[e.victim].name}»` : ''}.`])
    ],
    lesson: 'День планируют не от количества дел, а от последствий: А — делать, Г — поручать, Д — исключать. Сложное — на пики энергии, и обязательно оставляйте запас: срочное приходит каждый день.'};
}
