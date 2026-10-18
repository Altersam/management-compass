// «Проектный подход»: три проекта с разным характером. Для каждого — подход и частота проверок.
// Затем проекты «проживаются»: изменения требований и поздние ошибки бьют по неподходящему выбору.
import {esc, icon} from '../ui.js';
import {clone} from './kit.js';

export const intro = {
  story: 'В портфеле три проекта. Руководитель хочет «одну методологию на всё». Вы считаете, что у каждого проекта свой характер.',
  goal: 'Подобрать каждому проекту подход и ритм проверок так, чтобы все три уложились в срок и принесли пользу.',
  rules: ['Посмотрите на характер проекта: насколько всё известно заранее, сколько стоит поздняя ошибка, можно ли быстро получить отзыв.', 'Выберите подход и частоту проверок для каждого.', 'Запустите — увидите, что случилось с каждым проектом за полгода.']
};
export const levels = ['С подсказками', 'Другой портфель', 'Без подсказок'];
export const scenarios = [{name: 'Портфель университета'}, {name: 'Портфель отдела'}];

const APPROACHES = [['water', 'Каскадный', 'Всё спланировать, потом делать'], ['agile', 'Гибкий', 'Короткие циклы с отзывом пользователей'], ['hybrid', 'Гибридный', 'Жёсткая часть по плану, неизвестная — циклами']];
const CADENCE = [['rare', 'Редко', 'проверка в конце этапа'], ['regular', 'Регулярно', 'раз в месяц'], ['often', 'Часто', 'каждые две недели']];
const LEVEL = ['низкая', 'средняя', 'высокая'];
const SETS = [
  [
    {id: 'room', name: 'Ремонт лекционной аудитории', u: 0, err: 2, fb: 0, best: 'water', cad: 'regular', event: 'Пожарная инспекция потребовала сменить проводку.', why: {water: 'Нормы известны, переделка дорогая — план заранее окупился.', agile: 'Короткие циклы в ремонте означают переделки уже сделанного. Дорого.', hybrid: 'Сработало, но лишние согласования циклов съели время.'}},
    {id: 'app', name: 'Онлайн‑запись к специалистам', u: 2, err: 0, fb: 2, best: 'agile', cad: 'often', event: 'После первого месяца студенты попросили запись через мессенджер.', why: {water: 'Годовой план устарел через месяц: сделали то, что уже никому не нужно.', agile: 'Отзыв пользователей каждые две недели — сервисом начали пользоваться.', hybrid: 'Неплохо, но часть функций успели «зацементировать» до отзывов.'}},
    {id: 'archive', name: 'Переезд и оцифровка архива', u: 1, err: 1, fb: 1, best: 'hybrid', cad: 'regular', event: 'Оказалось, треть документов нужно оцифровать по другому стандарту.', why: {water: 'Переезд прошёл по плану, а оцифровку пришлось переделывать.', agile: 'Переезд «итерациями» растянулся и стоил дороже.', hybrid: 'Переезд — по плану, оцифровка — циклами. Изменение стандарта поглотили спокойно.'}}
  ],
  [
    {id: 'room', name: 'Закупка серверов', u: 0, err: 2, fb: 0, best: 'water', cad: 'regular', event: 'Поставщик изменил сроки поставки.', why: {water: 'Требования известны — тендер провели один раз и правильно.', agile: 'Закупку нельзя «итерировать»: каждый круг — новый тендер.', hybrid: 'Получилось, но с лишними согласованиями.'}},
    {id: 'app', name: 'Новый дашборд для руководства', u: 2, err: 0, fb: 2, best: 'agile', cad: 'often', event: 'Руководство поменяло набор показателей после первой версии.', why: {water: 'Сделали по ТЗ — а показатели уже другие.', agile: 'Каждые две недели показывали версию — дашборд стал рабочим инструментом.', hybrid: 'Почти получилось, но первая половина ушла в план.'}},
    {id: 'archive', name: 'Новая система оценки сотрудников', u: 1, err: 1, fb: 1, best: 'hybrid', cad: 'regular', event: 'Профсоюз попросил изменить шкалу.', why: {water: 'Шкалу утвердили до обсуждения — пришлось переутверждать.', agile: 'Без жёсткой правовой части оценку нельзя было запускать.', hybrid: 'Правовая часть по плану, шкала — после пилота. Изменение приняли без конфликта.'}}
  ]
];

export function create(scenario = 0, level = 1) {  return {scenario, picks: {}, cad: {}, hint: 'Выберите подход и ритм проверок для каждого проекта.', done: false}; }

export function outcome(p, ap, cad) {
  const fit = ap === p.best ? 2 : ap === 'hybrid' || p.best === 'hybrid' ? 1 : 0;
  const cadFit = cad === p.cad ? 1 : (Math.abs(CADENCE.findIndex(c => c[0] === cad) - CADENCE.findIndex(c => c[0] === p.cad)) === 1 ? .5 : 0);
  const delay = Math.round((2 - fit) * 18 + (1 - cadFit) * 12), over = Math.round((2 - fit) * 15 + (1 - cadFit) * 8), value = Math.round(45 + fit * 22 + cadFit * 11);
  return {fit, cadFit, delay, over, value, ok: delay <= 15 && value >= 70};
}

export function act(state, a) {
  const s = clone(state);
  if (a.type === 'ap') { const [id, v] = a.arg.split(':'); s.picks[id] = v; return s; }
  if (a.type === 'cad') { const [id, v] = a.arg.split(':'); s.cad[id] = v; return s; }
  if (a.type === 'run') { const set = SETS[s.scenario]; if (!set.every(p => s.picks[p.id] && s.cad[p.id])) return state; s.results = set.map(p => outcome(p, s.picks[p.id], s.cad[p.id])); s.done = true; return s; }
  return state;
}

export function hud(s) {
  const set = SETS[s.scenario], ready = set.filter(p => s.picks[p.id] && s.cad[p.id]).length;
  return [['Проектов настроено', `${ready} из 3`, ready === 3 ? 'good' : '', ready / 3 * 100], ['Горизонт', '6 месяцев', '']];
}

export function board(s) {
  const set = SETS[s.scenario], ready = set.every(p => s.picks[p.id] && s.cad[p.id]);
  return `<div class="ap-projects">${set.map(p => `<section class="g-panel ap-card"><h3>${esc(p.name)}</h3><dl class="ap-params"><div><dt>Неопределённость</dt><dd>${'●'.repeat(p.u + 1)}<span>${LEVEL[p.u]}</span></dd></div><div><dt>Цена поздней ошибки</dt><dd>${'●'.repeat(p.err + 1)}<span>${LEVEL[p.err]}</span></dd></div><div><dt>Быстрый отзыв</dt><dd>${'●'.repeat(p.fb + 1)}<span>${['почти нет', 'есть', 'легко получить'][p.fb]}</span></dd></div></dl>
    <span class="g-small">Подход</span><div class="mt-seg">${APPROACHES.map(([id, name]) => `<button data-act="ap" data-arg="${p.id}:${id}" aria-pressed="${s.picks[p.id] === id}">${esc(name)}</button>`).join('')}</div>
    ${s.picks[p.id] ? `<p class="g-small" style="margin:6px 0 2px">${esc(APPROACHES.find(x => x[0] === s.picks[p.id])[2])}</p>` : ''}
    <span class="g-small" style="margin-top:10px">Проверки</span><div class="mt-seg">${CADENCE.map(([id, name]) => `<button data-act="cad" data-arg="${p.id}:${id}" aria-pressed="${s.cad[p.id] === id}">${esc(name)}</button>`).join('')}</div></section>`).join('')}</div>
    <button class="btn g-main-btn" data-act="run" ${ready ? '' : 'disabled'}>${icon('play')} Прожить полгода</button>`;
}

export function result(s) {
  const set = SETS[s.scenario], ok = s.results.filter(r => r.ok).length, perfect = s.results.filter(r => r.fit === 2).length;
  return {stars: ok === 3 ? (perfect === 3 ? 3 : 2) : ok >= 2 ? 2 : 1, title: ok === 3 ? 'Все три проекта принесли результат' : `Удачно: ${ok} из 3 проектов`,
    summary: 'Один подход на всё не работает: у каждого проекта свой характер.',
    stats: set.map((p, i) => [p.name.split(' ').slice(0, 2).join(' '), `${s.results[i].delay > 0 ? '+' + s.results[i].delay + '% к сроку' : 'в срок'}`]),
    lines: set.map((p, i) => [s.results[i].ok, `${p.name}: ${p.event} ${p.why[s.picks[p.id]]}${s.results[i].cadFit < 1 ? ' Ритм проверок не совпал с риском.' : ''}`]),
    lesson: 'Когда всё известно и ошибка дорога — планируйте заранее. Когда требования будут меняться и отзыв легко получить — работайте короткими циклами. Когда есть и то и другое — разделите проект.'};
}
