// «Метрика врёт»: показатель резко вырос. Три проверки из шести, диагноз и новое измерение.
import {esc, icon} from '../ui.js';
import {clone} from './kit.js';

export const intro = {
  story: 'Отличные новости в отчёте: показатель отдела вырос так, как не рос никогда. Руководство готово выплатить премию. Но жалоб почему‑то не стало меньше.',
  goal: 'Понять, что на самом деле стоит за цифрой, и предложить измерение, которое нельзя «улучшить» на бумаге.',
  rules: ['У вас три проверки из шести. Выбирайте те, что покажут реальность, а не повторят отчёт.', 'Поставьте диагноз: что произошло с цифрой.', 'Выберите, как измерять дальше, — и посмотрите следующий квартал.']
};
export const scenarios = [{name: 'Обращения в срок'}, {name: 'Закрытые задачи'}];

const CASES = [
  {metric: 'Обращения закрыты в срок', unit: '%', before: [62, 64, 63], after: [81, 92, 95], honest: [66, 71, 74], fake: [97, 98, 99],
    checks: [
      ['cases', 'Открыть пять реальных обращений', '3 из 5 закрыты ответом «принято в работу», а через день открыто новое обращение по тому же вопросу.', true],
      ['repeat', 'Повторные обращения', 'Выросли с 8% до 31% за тот же период.', true],
      ['method', 'Методика расчёта', 'Срок считается от последней смены статуса, а не от первой регистрации.', true],
      ['team', 'Поговорить с сотрудниками', '«Нам сказали, что премия зависит от этой цифры».', true],
      ['volume', 'Число обращений', 'Без изменений: около 900 в месяц.', false],
      ['staff', 'Численность отдела', 'Не менялась, 12 человек.', false]
    ],
    diag: [['gaming', 'Цифру улучшают формальным закрытием', true], ['real', 'Сервис действительно стал быстрее', false], ['data', 'Сбой в системе учёта', false], ['volume', 'Обращений стало меньше', false]],
    fix: [['pair', 'Считать срок от первой регистрации + парная метрика: доля повторных обращений', true], ['raise', 'Поднять план до 98%', false], ['drop', 'Отменить показатель совсем', false], ['punish', 'Наказать тех, кто «химичит»', false]]},
  {metric: 'Задач закрыто за месяц', unit: '', before: [118, 121, 120], after: [160, 190, 210], honest: [124, 130, 133], fake: [240, 260, 290],
    checks: [
      ['size', 'Средний размер задачи', 'Упал вдвое: одну задачу стали разбивать на две‑три карточки.', true],
      ['client', 'Результат для заказчиков', 'Количество сданных заказчикам результатов не изменилось.', true],
      ['method', 'Что считается задачей', 'Любая карточка в трекере, независимо от объёма.', true],
      ['team', 'Поговорить с командой', '«Если дробить, цифра растёт — нас за это хвалят».', true],
      ['hours', 'Отработанные часы', 'Те же, переработок нет.', false],
      ['tool', 'Новый трекер', 'Внедрён месяц назад, работает без сбоев.', false]
    ],
    diag: [['gaming', 'Задачи дробят, чтобы закрыть больше', true], ['real', 'Команда стала продуктивнее', false], ['data', 'Новый трекер считает неправильно', false], ['volume', 'Пришло больше работы', false]],
    fix: [['pair', 'Считать сданные заказчику результаты и время их выполнения', true], ['raise', 'Поднять план до 300 задач', false], ['drop', 'Вообще не измерять работу', false], ['punish', 'Запретить создавать мелкие задачи', false]]}
];
const CHECKS = 3;

export function create(scenario = 0) { return {scenario, opened: [], phase: 'checks', diag: null, fix: null, hint: 'Выберите проверку. Их всего три.', done: false}; }

export function act(state, a) {
  const s = clone(state), c = CASES[s.scenario];
  if (a.type === 'check' && s.phase === 'checks') { if (s.opened.includes(a.arg) || s.opened.length >= CHECKS) return state; s.opened.push(a.arg); if (s.opened.length >= CHECKS) { s.phase = 'diag'; s.hint = 'Проверки закончились. Что произошло с цифрой?'; } else s.hint = `Осталось проверок: ${CHECKS - s.opened.length}.`; return s; }
  if (a.type === 'diag') { s.diag = a.arg; s.phase = 'fix'; s.hint = 'Как измерять дальше?'; return s; }
  if (a.type === 'fix') { s.fix = a.arg; return s; }
  if (a.type === 'next' && s.fix) { s.done = true; return s; }
  return state;
}

export function hud(s) {
  const c = CASES[s.scenario], d = c.after[2] - c.before[2];
  return [['Показатель', `${c.after[2]}${c.unit}`, 'good'], ['Рост', `+${Math.round(d / c.before[2] * 100)}%`, 'warn'], ['Проверки', `${CHECKS - s.opened.length} из ${CHECKS}`, '', (CHECKS - s.opened.length) / CHECKS * 100]];
}

function chart(c, extra, label) {
  const vals = [...c.before, ...c.after, ...(extra || [])], max = Math.max(...vals) * 1.1;
  return `<div class="mx-chart">${vals.map((v, i) => `<div class="mx-col ${i >= 6 ? 'next' : i >= 3 ? 'after' : ''}"><span class="mx-val">${v}${c.unit}</span><i style="height:${v / max * 100}%"></i><small>${i < 3 ? `${i + 1} кв.` : i < 6 ? `${i - 2} кв.` : `${i - 5} кв.`}</small></div>`).join('')}</div><p class="g-small mx-legend"><i></i> год назад <i class="after"></i> этот год ${extra ? `<i class="next"></i> ${esc(label)}` : ''}</p>`;
}

export function board(s) {
  const c = CASES[s.scenario];
  const checks = c.checks.map(([id, name, text]) => { const open = s.opened.includes(id); return `<button class="g-opt" data-act="check" data-arg="${id}" aria-pressed="${open}" ${open || s.phase !== 'checks' ? 'disabled' : ''} style="${open ? 'opacity:1' : ''}"><b>${icon(open ? 'eye' : 'search')} ${esc(name)}</b><span>${open ? esc(text) : 'Нажмите, чтобы проверить'}</span></button>`; }).join('');
  const diag = s.phase !== 'checks' ? `<section class="g-panel"><h3>${icon('flag')} Диагноз</h3><div class="g-choice">${c.diag.map(([id, name]) => `<button class="g-opt" data-act="diag" data-arg="${id}" aria-pressed="${s.diag === id}"><b>${esc(name)}</b></button>`).join('')}</div></section>` : '';
  const fix = s.phase === 'fix' ? `<section class="g-panel"><h3>${icon('target')} Как измерять дальше</h3><div class="g-choice">${c.fix.map(([id, name]) => `<button class="g-opt" data-act="fix" data-arg="${id}" aria-pressed="${s.fix === id}"><b>${esc(name)}</b></button>`).join('')}</div><button class="btn g-main-btn" style="margin-top:12px" data-act="next" ${s.fix ? '' : 'disabled'}>${icon('play')} Прожить следующий год</button></section>` : '';
  return `<section class="g-panel"><h3>${icon('chart')} ${esc(c.metric)}</h3>${chart(c)}</section><div class="g-cols"><section class="g-panel"><h3>${icon('search')} Проверки</h3><div class="g-choice">${checks}</div></section><div class="g-board" style="margin:0">${diag}${fix}</div></div>`;
}

export function result(s) {
  const c = CASES[s.scenario], diagOk = c.diag.find(d => d[0] === s.diag)[2], fixOk = c.fix.find(f => f[0] === s.fix)[2];
  const keys = s.opened.filter(id => c.checks.find(x => x[0] === id)[3]).length;
  const next = fixOk ? c.honest : s.fix === 'raise' ? c.fake : c.after;
  return {stars: 1 + (diagOk ? 1 : 0) + (diagOk && fixOk && keys >= 2 ? 1 : 0), title: fixOk ? 'Цифра снова показывает реальность' : 'Цифра по‑прежнему обманывает',
    summary: fixOk ? `Следующий год: ${next.join(' → ')}${c.unit}. Скромнее, зато это настоящий рост.` : s.fix === 'raise' ? `Следующий год: ${next.join(' → ')}${c.unit}. Цифра растёт ещё быстрее — и всё дальше от реальности.` : 'Без нового измерения управлять стало нечем или искажение осталось.',
    stats: [['Полезных проверок', `${keys}/${CHECKS}`], ['Диагноз', diagOk ? 'верный' : 'неверный'], ['Измерение', fixOk ? 'честное' : 'искажается']],
    lines: [[keys >= 2, keys >= 2 ? 'Проверки открыли реальность за цифрой.' : 'Проверки повторяли отчёт, а не проверяли его.'], [diagOk, diagOk ? 'Поняли, что цифру улучшают на бумаге.' : 'Диагноз мимо: дело было в том, что цифру «улучшали».'], [fixOk, fixOk ? 'Парная метрика ловит формальное улучшение.' : 'Новое измерение не защищает от того же искажения.']],
    lesson: 'Когда цифра становится целью, её начинают улучшать сами по себе. Смотрите на живые случаи, проверяйте определение и добавляйте парную метрику, которая ловит «улучшение на бумаге».'};
}
