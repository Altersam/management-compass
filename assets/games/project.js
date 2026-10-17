// «Проект под давлением»: 10 рабочих дней, 4 человека, 5 задач с зависимостями.
// Каждый день назначаете людей на задачи; усталость, события и бюджет влияют на результат.
import {esc, icon} from '../ui.js';
import {clone, avatar} from './kit.js';

export const intro = {
  story: 'Через 10 рабочих дней университет должен запустить сервис электронных заявок. У вас четыре человека с разными сильными сторонами и бюджет на 26 человеко-дней.',
  goal: 'Запустить сервис в срок, уложиться в бюджет и не потерять качество.',
  rules: ['Выберите человека, затем задачу — так назначаете работу. Назначения сохраняются на следующие дни.', 'Человек работает лучше на «своей» задаче. Без отдыха он устаёт и замедляется.', 'Задача начинается, только когда готовы предыдущие. Следите за событиями — они меняют план.']
};
export const scenarios = [{name: 'Сервис заявок'}, {name: 'Онлайн‑приёмная'}];

const SKILLS = {analysis: 'Анализ', design: 'Дизайн', tech: 'Разработка', training: 'Обучение'};
const PEOPLE = [
  {id: 'anna', name: 'Анна', role: 'аналитик', color: '#ffc53d', skills: {analysis: 3, design: 1, tech: 1, training: 2}},
  {id: 'max', name: 'Максим', role: 'дизайнер', color: '#ff9eb8', skills: {analysis: 1, design: 3, tech: 2, training: 1}},
  {id: 'ira', name: 'Ирина', role: 'разработчик', color: '#8fd3ff', skills: {analysis: 1, design: 1, tech: 3, training: 1}},
  {id: 'pavel', name: 'Павел', role: 'методист', color: '#9be7c4', skills: {analysis: 2, design: 1, tech: 1, training: 3}}
];
const TASKS = [
  {id: 'req', name: 'Требования', skill: 'analysis', effort: 6, deps: []},
  {id: 'proto', name: 'Прототип', skill: 'design', effort: 6, deps: ['req']},
  {id: 'integ', name: 'Интеграция', skill: 'tech', effort: 9, deps: ['proto']},
  {id: 'train', name: 'Обучение пользователей', skill: 'training', effort: 6, deps: ['req']},
  {id: 'test', name: 'Проверка', skill: 'analysis', effort: 4, deps: ['integ']}
];
const DAYS = 10, BUDGET = 26;

export function create(scenario = 0) {
  const tasks = clone(TASKS);
  if (scenario === 1) { tasks.find(t => t.id === 'train').effort = 8; tasks.find(t => t.id === 'integ').effort = 8; }
  return {scenario, day: 1, spent: 0, quality: 100, picked: null, tasks: tasks.map(t => ({...t, done: 0})), people: PEOPLE.map(p => ({...clone(p), energy: 4, task: null, away: 0})),
    flags: {}, log: [], hint: 'Начните с требований: без них остальные задачи заблокированы. Выберите Анну, затем «Требования».', modal: null, done: false};
}

const ready = (s, t) => t.deps.every(d => complete(s.tasks.find(x => x.id === d)));
const complete = t => !t || t.done >= t.effort;
export const output = (p, t, crowd = 1) => { if (!t || p.away) return 0; const base = p.skills[t.skill] || 1; const tired = p.energy <= 1 ? .5 : 1; return base * tired * (crowd > 1 ? .8 : 1); };

export function forecast(s) {
  // Remaining work divided by today's daily output — a rough, honest estimate.
  const left = s.tasks.reduce((n, t) => n + Math.max(0, t.effort - t.done), 0);
  const rate = s.people.reduce((n, p) => n + (p.task && p.task !== 'rest' ? output(p, s.tasks.find(t => t.id === p.task), crowdOf(s, p.task)) : 0), 0);
  return rate ? Math.ceil(left / rate) : null;
}
const crowdOf = (s, id) => s.people.filter(p => p.task === id && !p.away).length;

function event(s) {
  const d = s.day;
  if (d === 3 && !s.flags.e3) return {id: 'e3', kicker: `День ${d}`, title: 'Финансы и приёмная хотят разные поля в заявке', text: 'Прототип уже опирается на первый вариант требований.', options: [{id: 'clarify', label: 'Собрать всех и сверить сейчас', detail: '+1 день работы над требованиями или прототипом. Переделки потом не будет.'}, {id: 'ignore', label: 'Оставить как есть', detail: 'Без затрат сейчас. Риск переделки на интеграции.'}]};
  if (d === 5 && !s.flags.e5) return {id: 'e5', kicker: `День ${d}`, title: 'Ирина заболела на два дня', text: 'Интеграция — её сильная сторона.', options: [{id: 'contractor', label: 'Подрядчик на 3 дня', detail: 'Разработчик среднего уровня. 4 человеко-дня бюджета.'}, {id: 'manage', label: 'Справимся сами', detail: 'Перераспределите людей. Бюджет не тратится.'}]};
  if (d === 7 && !s.flags.e7) return {id: 'e7', kicker: `День ${d}`, title: 'Руководство просит красивую презентацию проекта', text: 'Займёт день одного человека. Вклад в запуск — нулевой.', options: [{id: 'present', label: 'Сделать — Анна потратит день', detail: 'Анна пропустит рабочий день.'}, {id: 'refuse', label: 'Предложить короткий статус вместо презентации', detail: 'Две строки: что готово, где риск, что нужно от руководства.'}]};
  if (d === 9 && !s.flags.e9 && !complete(s.tasks.find(t => t.id === 'test'))) return {id: 'e9', kicker: `День ${d}`, title: 'Предлагают запустить без проверки', text: 'Так точно успеете. Но ошибки найдут пользователи.', options: [{id: 'skip', label: 'Запускаем без проверки', detail: 'Проверка снимается. Качество −35.'}, {id: 'keep', label: 'Проверку оставляем', detail: 'Может не хватить времени.'}]};
  return null;
}

export function act(state, a) {
  const s = clone(state); s.flash = null;
  if (a.type === 'pick') { s.picked = s.picked === a.arg ? null : a.arg; s.hint = s.picked ? `Теперь выберите задачу для: ${s.people.find(p => p.id === s.picked).name}. Или «Отдых».` : state.hint; return s; }
  if (a.type === 'assign') {
    const p = s.people.find(x => x.id === s.picked); if (!p) { s.flash = {tone: 'info', text: 'Сначала выберите человека справа.'}; return s; }
    if (a.arg !== 'rest') { const t = s.tasks.find(x => x.id === a.arg); if (!ready(s, t)) { s.flash = {tone: 'bad', text: `«${t.name}» ещё заблокирована: ждёт ${t.deps.map(d => s.tasks.find(x => x.id === d).name).join(', ')}.`}; return s; } if (complete(t)) return s; }
    p.task = a.arg; s.picked = null; s.hint = 'Назначьте остальных или завершите день.'; return s;
  }
  if (a.type === 'choose') return choose(s, a.arg);
  if (a.type === 'next') return nextDay(s);
  return state;
}

function choose(s, id) {
  const m = s.modal; s.modal = null; s.flags[m.id] = id;
  if (id === 'clarify') { const t = complete(s.tasks.find(t => t.id === 'req')) ? s.tasks.find(t => t.id === 'proto') : s.tasks.find(t => t.id === 'req'); t.effort += 1; s.log.push([true, 'Требования сверили заранее — переделки не было.']); }
  if (id === 'ignore') s.log.push([false, 'Разные ожидания не сверили.']);
  if (id === 'contractor') { s.people.push({id: 'pod', name: 'Подрядчик', role: 'на 3 дня', color: '#d9d2ff', skills: {analysis: 1, design: 1, tech: 2, training: 1}, energy: 4, task: null, away: 0, temp: 3}); s.spent += 4; s.log.push([true, 'Подрядчик закрыл провал по интеграции.']); }
  if (id === 'manage') s.log.push([true, 'Обошлись без подрядчика.']);
  if (id === 'present') { s.people.find(p => p.id === 'anna').away = 1; s.log.push([false, 'День ушёл на презентацию без вклада в запуск.']); }
  if (id === 'refuse') s.log.push([true, 'Вместо презентации — короткий статус. Фокус сохранён.']);
  if (id === 'skip') { const t = s.tasks.find(t => t.id === 'test'); t.effort = t.done; s.quality -= 35; s.log.push([false, 'Запустили без проверки — ошибки найдут пользователи.']); }
  if (id === 'keep') s.log.push([true, 'Проверку не пропустили.']);
  return finishIfDone(s);
}

function nextDay(s) {
  // Work
  for (const p of s.people) {
    if (p.away) { p.away--; p.task = p.task === 'rest' ? null : p.task; continue; }
    if (p.task === 'rest' || !p.task) { p.energy = Math.min(4, p.energy + 2); if (p.task === 'rest') p.task = null; continue; }
    const t = s.tasks.find(x => x.id === p.task);
    if (!t || complete(t)) { p.task = null; continue; }
    t.done = Math.min(t.effort, t.done + output(p, t, crowdOf(s, t.id)));
    p.energy = Math.max(0, p.energy - 1); s.spent += 1;
    if (p.energy === 0) s.quality -= 3;
    if (complete(t)) { s.people.forEach(x => { if (x.task === t.id) x.task = null; }); s.flash = {tone: 'good', text: `Готово: ${t.name}!`}; }
    if (p.temp) { p.temp--; }
  }
  s.people = s.people.filter(p => p.temp === undefined || p.temp > 0);
  // Late rework if requirements were never reconciled
  if (s.day === 6 && s.flags.e3 === 'ignore') { const t = s.tasks.find(t => t.id === 'integ'); t.effort += 3; s.quality -= 10; s.flash = {tone: 'bad', text: 'Вернулась переделка: финансы не приняли поля. Интеграции +3 дня работы.'}; }
  s.day++;
  if (s.day === 5 && !s.flags.e5) { const ira = s.people.find(p => p.id === 'ira'); ira.away = 2; }
  const done = finishIfDone(s); if (done.done) return done;
  if (s.day > DAYS) { s.done = true; s.day = DAYS; return s; }
  s.modal = event(s);
  const idle = s.people.filter(p => !p.away && !p.task).map(p => p.name);
  s.hint = idle.length ? `Без задачи: ${idle.join(', ')}. Назначьте или дайте отдохнуть.` : 'Все при деле. Завершите день.';
  return s;
}
function finishIfDone(s) { if (s.tasks.every(complete)) { s.done = true; s.launchedDay = s.day - 1; } return s; }

export function hud(s) {
  const left = forecast(s), daysLeft = DAYS - s.day + 1;
  return [['День', `${Math.min(s.day, DAYS)} / ${DAYS}`, '', s.day / DAYS * 100], ['Бюджет', `${BUDGET - s.spent} из ${BUDGET}`, s.spent > BUDGET ? 'bad' : s.spent > BUDGET * .8 ? 'warn' : '', (BUDGET - s.spent) / BUDGET * 100], ['Качество', `${s.quality}%`, s.quality < 70 ? 'bad' : s.quality < 90 ? 'warn' : 'good', s.quality], ['Прогноз', left === null ? '—' : left <= daysLeft ? `успеваем, ~${left} дн.` : `не успеваем, нужно ~${left} дн.`, left !== null && left > daysLeft ? 'bad' : 'good']];
}

export function board(s) {
  const tasks = s.tasks.map(t => {
    const ok = ready(s, t), fin = complete(t), who = s.people.filter(p => p.task === t.id);
    return `<button class="pj-task ${fin ? 'is-done' : ''} ${!ok ? 'is-locked' : ''} ${s.picked && ok && !fin ? 'is-target' : ''}" data-act="assign" data-arg="${t.id}" ${fin ? 'disabled' : ''}>
      <span class="pj-task-head"><b>${esc(t.name)}</b><span class="g-tag ${fin ? 'good' : ok ? 'info' : ''}">${fin ? icon('check') + ' готово' : ok ? SKILLS[t.skill] : icon('lock') + ' ждёт'}</span></span>
      <span class="g-meter"><i style="width:${t.done / t.effort * 100}%"></i></span>
      <span class="pj-task-foot"><span class="g-small">${t.done.toFixed(1).replace('.0', '').replace('.', ',')} / ${t.effort} дн. работы</span><span class="pj-who">${who.map(p => avatar(p.name[0], p.color, 28)).join('')}</span></span></button>`;
  }).join('');
  const people = s.people.map(p => {
    const t = s.tasks.find(x => x.id === p.task);
    const status = p.away ? 'нет на месте' : p.task === 'rest' ? 'отдыхает' : t ? `${t.name} · ${output(p, t, crowdOf(s, t.id)).toFixed(1).replace('.0', '').replace('.', ',')}/день` : 'без задачи';
    return `<button class="pj-person ${s.picked === p.id ? 'is-picked' : ''}" data-act="pick" data-arg="${p.id}" aria-pressed="${s.picked === p.id}" ${p.away ? 'disabled' : ''}>${avatar(p.name[0], p.color, 44)}<span class="pj-pinfo"><b>${esc(p.name)}</b><span class="g-small">${esc(p.role)} · ${esc(status)}</span><span class="pj-skills">${Object.entries(p.skills).filter(([, v]) => v >= 2).map(([k, v]) => `<span class="g-tag">${SKILLS[k]} ${'●'.repeat(v)}</span>`).join('')}</span></span><span class="pj-energy" aria-label="Энергия ${p.energy} из 4">${[1, 2, 3, 4].map(i => `<i class="${i <= p.energy ? 'on' : ''} ${p.energy <= 1 ? 'low' : ''}"></i>`).join('')}</span></button>`;
  }).join('');
  return `<div class="g-cols"><section class="g-panel"><h3>${icon('calendar')} Задачи <small>нажмите, чтобы назначить выбранного</small></h3><div class="g-list">${tasks}</div></section>
    <section class="g-panel"><h3>${icon('users')} Команда</h3><div class="g-list">${people}${s.picked ? `<button class="g-opt" data-act="assign" data-arg="rest"><b>Отдых на день</b><span>Энергия +2, работа не идёт.</span></button>` : ''}</div>
    <button class="btn g-main-btn" data-act="next">${icon('arrow')} Завершить день ${s.day}</button></section></div>`;
}

export function result(s) {
  const launched = s.tasks.every(complete), onBudget = s.spent <= BUDGET, good = s.quality >= 80;
  const stars = (launched ? 1 : 0) + (launched && onBudget ? 1 : 0) + (launched && good ? 1 : 0);
  return {stars: Math.max(stars, launched ? 1 : 0), title: launched ? (stars === 3 ? 'Запуск в срок, в бюджете и без брака!' : 'Сервис запущен') : 'Сервис не успели запустить',
    summary: launched ? `Запуск на ${s.launchedDay}-й день. Потрачено ${s.spent} из ${BUDGET} человеко-дней, качество ${s.quality}%.` : `К 10-му дню осталось ${s.tasks.filter(t => !complete(t)).map(t => t.name.toLowerCase()).join(', ')}.`,
    stats: [['Срок', launched ? `${s.launchedDay} дн.` : 'сорван'], ['Бюджет', `${s.spent}/${BUDGET}`], ['Качество', `${s.quality}%`]],
    lines: [...s.log, [onBudget, onBudget ? 'Уложились в бюджет.' : 'Бюджет превышен.'], [s.quality >= 90, s.quality >= 90 ? 'Команда не выгорела.' : 'Были дни работы на пределе — качество упало.']],
    lesson: 'Самое дорогое в проекте — не работа, а ожидание и переделки. Ставьте людей на их сильные задачи, сверяйте требования заранее и не жертвуйте проверкой ради даты.'};
}
