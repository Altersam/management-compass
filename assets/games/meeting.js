// «Совещание без решения»: все говорят «да», но у каждого есть скрытое ограничение.
// Четыре разговора до встречи, затем решение из четырёх параметров и проверка исполнением.
import {esc, icon} from '../ui.js';
import {clone, avatar} from './kit.js';

export const intro = {
  story: 'В прошлый раз на совещании все поддержали новый регламент приёма обращений. Прошёл месяц — ничего не работает. Завтра новая встреча, и решение должно быть исполнимым.',
  goal: 'Собрать решение, которое каждый участник действительно сможет выполнить.',
  rules: ['Публичное «да» ничего не гарантирует. У каждого есть ограничение, о котором он не скажет при всех.', 'До встречи успеете поговорить с четырьмя из пяти участников.', 'Соберите решение и посмотрите, как оно исполняется неделя за неделей.']
};
export const scenarios = [{name: 'Регламент обращений'}, {name: 'Оборудование к открытию'}];

const DIALS = {
  scope: ['Сразу на всех', 'Пилот на одном отделе'],
  time: ['Через 1 неделю', 'Через 3 недели', 'Через 6 недель'],
  res: ['Текущая команда', '+ временный сотрудник'],
  train: ['Без обучения', 'Короткое обучение']
};
const CASES = [
  [
    {id: 'boss', name: 'Ольга', role: 'Заказчик, руководитель направления', color: '#ffc53d', say: '«Нужен результат. Не тяните.»', hidden: 'Ректор ждёт первые итоги к концу месяца. Хоть где‑то, но должно заработать через три недели.', ok: d => d.time <= 1, fail: 'Через 6 недель ректор спросил результат. Ольга сняла проект с приоритета.'},
    {id: 'it', name: 'Сергей', role: 'IT', color: '#8fd3ff', say: '«Технически всё возможно.»', hidden: 'Доступы к системе выдаём только в окно обновлений — через три недели. Раньше никак.', ok: d => d.time >= 1, fail: 'На первой неделе у сотрудников не оказалось доступов. Работа встала.'},
    {id: 'fin', name: 'Анна', role: 'Финансы', color: '#9be7c4', say: '«Бюджет поддерживаем.»', hidden: 'Новые ставки — только со следующего квартала. Временного сотрудника оформить не сможем.', ok: d => d.res === 0, fail: 'Временного сотрудника не смогли оформить. Его задачи повисли.'},
    {id: 'hr', name: 'Галина', role: 'Обучение персонала', color: '#ff9eb8', say: '«Обучим, конечно.»', hidden: 'Без обучения люди будут работать по‑старому. Один отдел обучим за неделю, всех — минимум за шесть.', ok: d => d.train === 1 && (d.scope === 1 || d.time === 2), fail: 'Сотрудники не знали новый порядок и продолжили работать по‑старому.'},
    {id: 'law', name: 'Павел', role: 'Юрист', color: '#d9d2ff', say: '«Возражений нет.»', hidden: 'Для всех отделов нужен приказ — это четыре‑шесть недель согласований. Пилот на одном отделе можно распоряжением.', ok: d => d.scope === 1 || d.time === 2, fail: 'Приказ для всех отделов не успели согласовать. Новый порядок не вступил в силу.'}
  ],
  [
    {id: 'boss', name: 'Ольга', role: 'Директор кампуса', color: '#ffc53d', say: '«Аудитории должны открыться вовремя.»', hidden: 'Открытие через три недели. Хотя бы одна аудитория должна работать к этому дню.', ok: d => d.time <= 1, fail: 'К открытию не было готово ни одной аудитории.'},
    {id: 'it', name: 'Сергей', role: 'Закупки', color: '#8fd3ff', say: '«Закупим.»', hidden: 'Конкурс на всю партию — шесть недель. Небольшую партию для одной аудитории можно купить за три.', ok: d => d.scope === 1 ? d.time >= 1 : d.time === 2, fail: 'Конкурсная процедура не успела. Оборудования нет.'},
    {id: 'fin', name: 'Анна', role: 'Финансы', color: '#9be7c4', say: '«Деньги есть.»', hidden: 'Лимит этого квартала покрывает только оборудование. На временного монтажника денег нет.', ok: d => d.res === 0, fail: 'Счёт на монтажника не прошёл — лимит исчерпан.'},
    {id: 'hr', name: 'Галина', role: 'Преподаватели', color: '#ff9eb8', say: '«Будем рады новой технике.»', hidden: 'Если не показать, как пользоваться, половина преподавателей вернётся к меловой доске.', ok: d => d.train === 1, fail: 'Преподаватели не умели включать технику и вернулись к доске.'},
    {id: 'law', name: 'Павел', role: 'Охрана труда', color: '#d9d2ff', say: '«Согласуем.»', hidden: 'Каждую аудиторию нужно принять по акту. Мы успеваем одну‑две в неделю, не больше.', ok: d => d.scope === 1 || d.time === 2, fail: 'Аудитории не приняли по акту — пользоваться ими нельзя.'}
  ]
];
const TALKS = 4;

export function create(scenario = 0) {
  return {scenario, phase: 'talk', talked: [], decision: {scope: 0, time: 0, res: 0, train: 0}, exec: null, hint: 'Нажмите на участника, чтобы поговорить с ним до встречи.', done: false};
}
export const executes = (scenario, d) => CASES[scenario].map(p => [p.id, p.ok(d)]);

export function act(state, a) {
  const s = clone(state); s.flash = null; const people = CASES[s.scenario];
  if (a.type === 'talk' && s.phase === 'talk') {
    if (s.talked.includes(a.arg) || s.talked.length >= TALKS) return state;
    s.talked.push(a.arg); const p = people.find(x => x.id === a.arg);
    s.flash = {tone: 'info', text: `${p.name}: «${p.hidden}»`};
    s.hint = s.talked.length < TALKS ? `Разговоров осталось: ${TALKS - s.talked.length}.` : 'Разговоры закончились. Пора собирать решение.';
    if (s.talked.length >= TALKS) s.phase = 'decide';
    return s;
  }
  if (a.type === 'meet' && s.phase === 'talk') { s.phase = 'decide'; s.hint = 'Соберите решение: по одному варианту в каждой строке.'; return s; }
  if (a.type === 'dial' && s.phase === 'decide') { const [k, v] = a.arg.split(':'); s.decision[k] = Number(v); return s; }
  if (a.type === 'commit' && s.phase === 'decide') { s.exec = executes(s.scenario, s.decision); s.done = true; return s; }
  return state;
}

export function hud(s) {
  return [['Разговоры', `${TALKS - s.talked.length} из ${TALKS}`, '', (TALKS - s.talked.length) / TALKS * 100], ['Известно ограничений', `${s.talked.length} из 5`, s.talked.length >= 4 ? 'good' : ''], ['Этап', s.phase === 'talk' ? 'до встречи' : 'встреча', '']];
}

export function board(s) {
  const people = CASES[s.scenario];
  const table = `<div class="mt-table">${people.map(p => { const known = s.talked.includes(p.id); return `<button class="mt-seat ${known ? 'is-known' : ''}" data-act="talk" data-arg="${p.id}" ${known || s.phase !== 'talk' ? 'aria-disabled="true"' : ''}>${avatar(p.name[0], p.color, 52)}<b>${esc(p.name)}</b><span class="g-small">${esc(p.role)}</span><span class="mt-say">${esc(p.say)}</span>${known ? `<span class="mt-hidden">${icon('eye')} ${esc(p.hidden)}</span>` : s.phase === 'talk' ? `<span class="g-tag info">${icon('chat')} поговорить</span>` : `<span class="g-tag">${icon('lock')} не узнали</span>`}</button>`; }).join('')}</div>`;
  const decide = s.phase === 'decide' ? `<section class="g-panel"><h3>${icon('scale')} Решение</h3><div class="mt-dials">${Object.entries(DIALS).map(([k, opts]) => `<div class="mt-dial"><span class="g-small">${{scope: 'Масштаб', time: 'Старт', res: 'Ресурс', train: 'Обучение'}[k]}</span><div class="mt-seg" role="radiogroup">${opts.map((o, i) => `<button role="radio" aria-checked="${s.decision[k] === i}" aria-pressed="${s.decision[k] === i}" data-act="dial" data-arg="${k}:${i}">${esc(o)}</button>`).join('')}</div></div>`).join('')}</div><button class="btn g-main-btn" style="margin-top:14px" data-act="commit">${icon('check')} Принять решение и посмотреть исполнение</button></section>` : `<button class="btn ghost" data-act="meet">Хватит разговоров — к встрече</button>`;
  return `<section class="g-panel"><h3>${icon('users')} Участники <small>${s.phase === 'talk' ? 'публичная позиция и то, что скажут наедине' : 'то, что вы знаете'}</small></h3>${table}</section>${decide}`;
}

export function result(s) {
  const people = CASES[s.scenario], fails = s.exec.filter(([, ok]) => !ok).map(([id]) => people.find(p => p.id === id));
  const works = fails.length === 0, informed = s.talked.length >= 4;
  const d = s.decision, txt = `${DIALS.scope[d.scope]}, ${DIALS.time[d.time].toLowerCase()}, ${DIALS.res[d.res].toLowerCase()}, ${DIALS.train[d.train].toLowerCase()}`;
  return {stars: works ? (informed ? 3 : 2) : 1, title: works ? 'Решение исполнено!' : `Сорвалось на ${fails.length} ${fails.length === 1 ? 'участнике' : 'участниках'}`,
    summary: `Решение: ${txt}.`,
    lines: [...people.map(p => [!fails.includes(p), fails.includes(p) ? `${p.name}: ${p.fail}` : `${p.name}: своё сделал(а) в срок.`]), [informed, informed ? 'Решение опиралось на реальные ограничения, а не на «да» на встрече.' : 'С частью участников не поговорили — решение держалось на удаче.']],
    lesson: 'Публичное согласие не равно обязательству. До встречи узнайте ограничения каждого и соберите решение, которое их учитывает: часто это пилот, а не «всё сразу».'};
}
