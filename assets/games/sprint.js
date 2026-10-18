// «Спринт: цель, а не скорость»: два спринта по 20 очков. Цель — три порога.
// Незавершённая задача не даёт эффекта, заметная, но бесполезная работа съедает ёмкость.
import {esc, icon} from '../ui.js';
import {clone} from './kit.js';

export const intro = {
  story: 'Служба поддержки тонет в повторных обращениях. Руководство дало команде два спринта, чтобы «сделать сервис лучше». В бэклоге девять задач — от полезных до просто красивых.',
  goal: 'За два спринта достичь всех трёх порогов цели. Объём сделанной работы сам по себе не считается.',
  rules: ['Добавляйте задачи в спринт — каждая занимает очки ёмкости. Порядок важен: что не влезло, останется хвостом.', 'Цветные метки показывают, какой показатель двигает задача. Некоторые задачи требуют другую.', 'В середине спринта случится событие — решите, что с ним делать.']
};
export const levels = ['Ёмкость спринта — 22 очка', 'Ёмкость спринта — 20 очков', 'Ёмкость спринта — 18 очков, без подсказок'];
export const scenarios = [{name: 'Служба поддержки'}, {name: 'Приёмная комиссия'}];

const CRIT = {
  0: [['rep', 'Повторные обращения', 'меньше на', 6], ['speed', 'Скорость ответа', 'быстрее на', 6], ['sat', 'Довольные клиенты', 'больше на', 5]],
  1: [['rep', 'Ошибки в заявлениях', 'меньше на', 6], ['speed', 'Срок рассмотрения', 'быстрее на', 6], ['sat', 'Довольные абитуриенты', 'больше на', 5]]
};
const ITEMS = {
  0: [
    ['base', 'База ответов на типовые вопросы', 6, {rep: 4, speed: 2, sat: 1}, 'cause'],
    ['cause', 'Разобрать причины повторов', 4, {rep: 2}, null, 'invest'],
    ['tmpl', 'Шаблоны ответов', 3, {speed: 3, sat: 1}],
    ['dash', 'Красивый дашборд скорости', 5, {}, null, 'shiny'],
    ['train', 'Обучить операторов', 5, {rep: 2, speed: 1, sat: 2}],
    ['survey', 'Ещё один опрос', 3, {sat: 1}],
    ['route', 'Маршрутизация по типу запроса', 7, {rep: 1, speed: 4, sat: 1}],
    ['site', 'Редизайн сайта поддержки', 8, {sat: 1}, null, 'shiny'],
    ['call', 'Обратный звонок за 2 часа', 4, {speed: 1, sat: 3}]
  ],
  1: [
    ['check', 'Онлайн‑проверка комплекта документов', 6, {rep: 4, speed: 2, sat: 1}, 'rules'],
    ['rules', 'Разобрать частые ошибки абитуриентов', 4, {rep: 2}, null, 'invest'],
    ['faq', 'Короткая памятка на сайте', 3, {rep: 1, sat: 2}],
    ['video', 'Промо‑ролик о вузе', 5, {}, null, 'shiny'],
    ['queue', 'Электронная очередь на подачу', 6, {speed: 3, sat: 2}],
    ['form', 'Перерисовать логотип формы', 3, {}, null, 'shiny'],
    ['split', 'Разделить поток: целевые и общие', 7, {rep: 1, speed: 4}],
    ['bot', 'Чат‑бот «как дела»', 6, {sat: 1}, null, 'shiny'],
    ['sms', 'SMS о статусе заявления', 4, {speed: 1, sat: 3}]
  ]
};
let CAP = 20;

export function create(scenario = 0, level = 1) { CAP = [22, 20, 18][level] ?? 20;
  return {scenario, sprint: 1, phase: 'plan', cap: CAP, items: ITEMS[scenario].map(([id, name, pts, eff, dep, kind]) => ({id, name, pts, eff, dep, kind: kind || 'goal', left: pts, done: false})), plan: [], progress: {rep: 0, speed: 0, sat: 0}, reviews: [], worked: 0, hint: 'Добавьте задачи в спринт 1. Ёмкость — 20 очков.', modal: null, done: false};
}
const item = (s, id) => s.items.find(i => i.id === id);
const load = s => s.plan.reduce((n, id) => n + item(s, id).left, 0);

export function runSprint(s, cap) {
  // Work flows through the plan in order; dependencies must be finished earlier.
  let budget = cap; const finished = [], tail = [], blocked = [];
  for (const id of s.plan) {
    const it = item(s, id);
    if (it.dep && !item(s, it.dep).done) { blocked.push(id); continue; }
    const used = Math.min(budget, it.left); it.left -= used; budget -= used; s.worked += used;
    if (it.left === 0) { it.done = true; finished.push(id); for (const [k, v] of Object.entries(it.eff)) s.progress[k] += v; }
    else if (used > 0) tail.push(id);
  }
  return {finished, tail, blocked, unused: budget};
}

export function act(state, a) {
  const s = clone(state); s.flash = null;
  if (s.phase === 'plan') {
    if (a.type === 'add') { const it = item(s, a.arg); if (!it || it.done || s.plan.includes(a.arg)) return state; s.plan.push(a.arg); if (load(s) > s.cap) s.flash = {tone: 'info', text: 'План больше ёмкости: последние задачи останутся хвостом.'}; return s; }
    if (a.type === 'remove') { s.plan = s.plan.filter(x => x !== a.arg); return s; }
    if (a.type === 'up' || a.type === 'down') { const i = s.plan.indexOf(a.arg), j = a.type === 'up' ? i - 1 : i + 1; if (i < 0 || j < 0 || j >= s.plan.length) return state; [s.plan[i], s.plan[j]] = [s.plan[j], s.plan[i]]; return s; }
    if (a.type === 'run' && s.plan.length) {
      s.modal = s.sprint === 1
        ? {id: 'ask', kicker: 'Спринт 1, день 3', title: 'Руководство просит отчёт о «скорости команды»', text: 'Красивый, заметный — и никак не двигает цель. Займёт 4 очка.', options: [{id: 'accept', label: 'Взять в спринт', detail: 'Минус 4 очка ёмкости.'}, {id: 'decline', label: 'Объяснить и предложить показать результаты на ревью', detail: 'Ёмкость сохранится.'}]}
        : {id: 'sick', kicker: 'Спринт 2, день 2', title: 'Двое из команды на обязательном обучении', text: 'Ёмкость спринта падает на 5 очков.', options: [{id: 'trim', label: 'Убрать из плана наименее важное', detail: 'Последняя задача вернётся в бэклог — без хвоста.'}, {id: 'keep', label: 'Оставить план как есть', detail: 'Что не успеем — станет хвостом.'}]};
      return s;
    }
  }
  if (a.type === 'choose' && s.modal) {
    const id = a.arg; s.modal = null; let cap = s.cap;
    if (id === 'accept') { cap -= 4; s.asked = true; }
    if (id === 'decline') s.declined = true;
    if (id === 'trim' || id === 'keep') cap -= 5;
    if (id === 'trim' && s.plan.length > 1) s.plan.pop();
    const before = {...s.progress}, r = runSprint(s, cap);
    s.reviews.push({sprint: s.sprint, before, after: {...s.progress}, ...r, choice: id});
    s.phase = 'review'; s.hint = s.sprint === 1 ? 'Посмотрите, что сдвинулось, и планируйте спринт 2.' : 'Спринты закончены. Посмотрите итоги.';
    return s;
  }
  if (a.type === 'next' && s.phase === 'review') {
    if (s.sprint === 2) { s.done = true; return s; }
    s.sprint = 2; s.phase = 'plan'; s.plan = s.items.filter(i => !i.done && i.left < i.pts).map(i => i.id); s.hint = s.plan.length ? 'Хвост из спринта 1 уже в плане. Добавьте задачи на спринт 2.' : 'Добавьте задачи на спринт 2.'; return s;
  }
  return state;
}

export function hud(s) {
  const crit = CRIT[s.scenario];
  return [['Спринт', `${s.sprint} / 2`, ''], ...crit.map(([k, name, , target]) => [name, `${s.progress[k]} / ${target}`, s.progress[k] >= target ? 'good' : '', s.progress[k] / target * 100]), ['Сделано работы', `${s.worked} очк.`, '']];
}

const effTags = (s, eff) => CRIT[s.scenario].filter(([k]) => eff[k]).map(([k, name]) => `<span class="sp-eff sp-${k}">${esc(name.split(' ')[0])} +${eff[k]}</span>`).join('') || '<span class="g-tag warn">не двигает цель</span>';

export function board(s) {
  if (s.phase === 'review') {
    const r = s.reviews[s.reviews.length - 1], crit = CRIT[s.scenario];
    return `<section class="g-panel sp-review"><h3>${icon('flag')} Ревью спринта ${r.sprint}</h3><div class="sp-crit">${crit.map(([k, name, how, t]) => `<div><b>${esc(name)}</b><span class="g-small">${how} ${t}</span><div class="sp-bar"><i class="was" style="width:${Math.min(100, r.before[k] / t * 100)}%"></i><i class="now" style="width:${Math.min(100, (r.after[k] - r.before[k]) / t * 100)}%"></i></div><span class="g-tag ${r.after[k] >= t ? 'good' : ''}">${r.after[k]} / ${t}${r.after[k] >= t ? ' ✓' : ''}</span></div>`).join('')}</div>
      <div class="sp-cols"><div><h4>Готово</h4>${r.finished.map(id => `<p class="sp-chip ok">${icon('check')} ${esc(item(s, id).name)}</p>`).join('') || '<p class="g-small">ничего</p>'}</div><div><h4>Хвост — эффекта нет</h4>${r.tail.map(id => `<p class="sp-chip tail">${esc(item(s, id).name)} · осталось ${item(s, id).left}</p>`).join('') || '<p class="g-small">нет</p>'}${r.blocked.map(id => `<p class="sp-chip tail">${icon('lock')} ${esc(item(s, id).name)} — ждала «${esc(item(s, item(s, id).dep).name)}»</p>`).join('')}</div></div>
      <button class="btn g-main-btn" data-act="next">${s.sprint === 1 ? 'Планировать спринт 2' : 'Итоги'} ${icon('arrow')}</button></section>`;
  }
  const backlog = s.items.filter(i => !i.done && !s.plan.includes(i.id));
  const total = load(s);
  return `<div class="g-cols"><section class="g-panel"><h3>${icon('book')} Бэклог</h3><div class="g-list">${backlog.map(i => `<div class="sp-item"><div><b>${esc(i.name)}</b><div class="sp-tags">${effTags(s, i.eff)}${i.kind === 'invest' ? '<span class="g-tag info">основа для другой</span>' : ''}${i.dep ? `<span class="g-tag">${icon('lock')} нужна «${esc(item(s, i.dep).name)}»</span>` : ''}</div></div><span class="sp-pts">${i.left}</span><button class="btn small" data-act="add" data-arg="${i.id}">В спринт</button></div>`).join('') || '<p class="g-small">Всё распределено.</p>'}</div></section>
    <section class="g-panel"><h3>${icon('target')} Спринт ${s.sprint}</h3><div class="sp-cap"><div class="sp-cap-bar"><i style="width:${Math.min(100, total / s.cap * 100)}%" class="${total > s.cap ? 'over' : ''}"></i></div><span class="g-small">${total} из ${s.cap} очков${total > s.cap ? ' — перебор, хвост неизбежен' : ''}</span></div>
      <ol class="sp-plan">${s.plan.map((id, n) => { const i = item(s, id); return `<li><span class="sp-n">${n + 1}</span><div><b>${esc(i.name)}</b><div class="sp-tags">${effTags(s, i.eff)}</div></div><span class="sp-pts">${i.left}</span><span class="sp-ctl"><button data-act="up" data-arg="${id}" aria-label="Выше">↑</button><button data-act="down" data-arg="${id}" aria-label="Ниже">↓</button><button data-act="remove" data-arg="${id}" aria-label="Убрать">${icon('x')}</button></span></li>`; }).join('') || '<li class="g-small">Добавьте задачи из бэклога.</li>'}</ol>
      <button class="btn g-main-btn" data-act="run" ${s.plan.length ? '' : 'disabled'}>${icon('play')} Запустить спринт ${s.sprint}</button></section></div>`;
}

export function result(s) {
  const crit = CRIT[s.scenario], reached = crit.filter(([k, , , t]) => s.progress[k] >= t);
  const shiny = s.items.filter(i => i.kind === 'shiny' && i.done).length;
  const tails = s.reviews.reduce((n, r) => n + r.tail.length, 0);
  return {stars: Math.max(1, reached.length), title: reached.length === 3 ? 'Цель достигнута!' : `Достигнуто порогов: ${reached.length} из 3`,
    summary: `Команда сделала ${s.worked} очков работы. Важно не это, а то, что сдвинулись показатели цели.`,
    stats: crit.map(([k, name, , t]) => [name, `${s.progress[k]}/${t}`]),
    lines: [[shiny === 0, shiny === 0 ? 'Не тратили ёмкость на заметную, но бесполезную работу.' : `Сделано «красивых» задач без вклада в цель: ${shiny}.`], [!!s.declined, s.declined ? 'Отказались от отчёта ради отчёта — сохранили фокус.' : 'Отчёт о скорости съел 4 очка.'], [tails === 0, tails === 0 ? 'Без незавершённых хвостов.' : `Хвостов: ${tails}. Незавершённое не даёт эффекта.`]],
    lesson: 'Скорость — не результат. Выбирайте задачи, которые двигают цель, доводите их до конца и защищайте спринт от «срочно, но не важно».'};
}
