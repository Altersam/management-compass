// «Этическая развилка»: досье из шести документов, три проверки источника,
// выбор оснований, решения и принципа, которым вы его объясните.
import {esc, icon} from '../ui.js';
import {clone} from './kit.js';

export const intro = {
  story: 'Вам нужно принять решение, о котором будут говорить. На вас давят с разных сторон, а в досье есть и факты, и мнения заинтересованных людей.',
  goal: 'Принять решение, которое можно объяснить любому участнику и которое опирается на проверенные факты.',
  rules: ['Читать документы можно бесплатно. Проверить источник можно ограниченное число раз.', 'Отметьте 2–3 документа, на которые опирается решение.', 'Выберите решение и принцип, которым его объясните.']
};
export const levels = ['4 проверки источников', '3 проверки источников', '2 проверки источников, без подсказок'];
export const scenarios = [{name: 'Опоздание на конкурс'}, {name: 'Премия по итогам квартала'}];

const CASES = [
  {title: 'Сильнейший кандидат подал документы на 3 часа позже срока', docs: [
    {id: 'rule', kind: 'Положение о конкурсе', from: 'Организация', text: 'Документы после срока не принимаются. При уважительной причине комиссия может продлить срок — для всех, публично.', rel: 'ok', check: 'Действующая редакция, утверждена приказом.'},
    {id: 'letter', kind: 'Письмо кандидата', from: 'Кандидат', text: '«Опоздал, потому что утром был в больнице».', rel: 'ok', check: 'Подтверждено справкой из поликлиники.'},
    {id: 'boss', kind: 'Мнение заведующего', from: 'Заведующий кафедрой', text: '«Это лучший кандидат, правила не должны мешать».', rel: 'bias', check: 'Заведующий — научный руководитель кандидата. Конфликт интересов.'},
    {id: 'log', kind: 'Журнал приёма', from: 'Система', text: 'Подача в 15:05 при сроке 12:00. Ещё двое подали после срока — их отклонили.', rel: 'ok', check: 'Данные системы, время зафиксировано автоматически.'},
    {id: 'rumor', kind: 'Сообщение коллеги', from: 'Коллега', text: '«Другим тоже делали исключения».', rel: 'bad', check: 'Не подтверждено: исключений по журналу не было.'},
    {id: 'rank', kind: 'Рейтинг кандидатов', from: 'Комиссия', text: 'Кандидат — первый по баллам.', rel: 'ok', check: 'Расчёт по утверждённым критериям.'}
  ], decisions: [
    {id: 'except', label: 'Принять только его заявку', detail: 'Он лучший, а опоздание уважительное.'},
    {id: 'reject', label: 'Отклонить по правилу', detail: 'Срок есть срок.'},
    {id: 'extend', label: 'Продлить срок для всех, кто опоздал по уважительной причине', detail: 'Публично, по пункту положения.'}
  ], right: 'extend', basis: ['rule', 'log'],
  why: {except: 'Двоих других отклонили за то же опоздание. Исключение для одного — двойной стандарт.', reject: 'Положение прямо даёт комиссии право продлить срок при уважительной причине. Решение формальное, но не справедливое.', extend: 'Одинаковое правило для всех опоздавших, опора на положение и проверенные факты.'}},
  {title: 'Нужно распределить премию между двумя ведущими специалистами', docs: [
    {id: 'rule', kind: 'Положение о премировании', from: 'Организация', text: 'Критерии: выполнение показателей и вклад в общие проекты.', rel: 'ok', check: 'Действующее положение.'},
    {id: 'kpi', kind: 'Отчёт по показателям', from: 'Система', text: 'Мария — 120% плана, Олег — 95%.', rel: 'ok', check: 'Выгрузка из системы учёта.'},
    {id: 'oleg', kind: 'Письмо Олега', from: 'Олег', text: '«Я вёл самый заметный проект квартала».', rel: 'bias', check: 'Проект сдан с опозданием на месяц и доработан Марией.'},
    {id: 'client', kind: 'Отзыв заказчика', from: 'Заказчик', text: 'Благодарность Марии за решение проблемы с отчётностью.', rel: 'ok', check: 'Письмо заказчика в системе документооборота.'},
    {id: 'deputy', kind: 'Мнение заместителя', from: 'Заместитель', text: '«Олег — опора отдела, его нужно поддержать».', rel: 'bias', check: 'Заместитель и Олег — давние друзья, работали вместе 10 лет.'},
    {id: 'rumor', kind: 'Разговор в коридоре', from: 'Неизвестно', text: '«Марии просто достались лёгкие задачи».', rel: 'bad', check: 'Не подтверждается: задачи распределялись поровну.'}
  ], decisions: [
    {id: 'visible', label: 'Большую часть — Олегу', detail: 'Его проект заметили все.'},
    {id: 'equal', label: 'Поровну', detail: 'Чтобы никого не обидеть.'},
    {id: 'criteria', label: 'По критериям положения и объяснить обоим основания', detail: 'Больше — Марии, Олегу — по его показателям.'}
  ], right: 'criteria', basis: ['rule', 'kpi'],
  why: {visible: 'Заметность — не критерий положения. Решение опирается на мнения заинтересованных людей.', equal: '«Поровну» кажется справедливым, но игнорирует критерии и разницу во вкладе.', criteria: 'Решение по заранее известным критериям и проверяемым данным. Его можно объяснить обоим.'}}
];
const PRINCIPLES = [
  {id: 'same', label: 'Одинаковые критерии для сходных случаев', detail: 'Решение можно повторить для любого другого.'},
  {id: 'benefit', label: 'Максимальная польза для организации', detail: 'Лучший человек важнее процедуры.'},
  {id: 'letter', label: 'Строгое следование букве правила', detail: 'Никаких толкований.'}
];
let CHECKS = 3;

export function create(scenario = 0, level = 1) { CHECKS = [4, 3, 2][level] ?? 3; return {scenario, read: [], checked: [], basis: [], decision: null, principle: null, phase: 'dossier', hint: 'Откройте документы. Проверка покажет, насколько источнику можно доверять.', done: false}; }

export function act(state, a) {
  const s = clone(state); s.flash = null; const c = CASES[s.scenario];
  if (a.type === 'read') { if (!s.read.includes(a.arg)) s.read.push(a.arg); return s; }
  if (a.type === 'check') { if (s.checked.includes(a.arg) || s.checked.length >= CHECKS) return state; if (!s.read.includes(a.arg)) s.read.push(a.arg); s.checked.push(a.arg); return s; }
  if (a.type === 'basis') { if (!s.read.includes(a.arg)) return state; s.basis = s.basis.includes(a.arg) ? s.basis.filter(x => x !== a.arg) : s.basis.length >= 3 ? s.basis : [...s.basis, a.arg]; s.hint = s.basis.length >= 2 ? 'Основания выбраны. Переходите к решению.' : 'Отметьте 2–3 документа как основания.'; return s; }
  if (a.type === 'toDecide') { if (s.basis.length < 2) { s.flash = {tone: 'info', text: 'Отметьте хотя бы два документа как основания.'}; return s; } s.phase = 'decide'; s.hint = 'Выберите решение и принцип.'; return s; }
  if (a.type === 'back') { s.phase = 'dossier'; return s; }
  if (a.type === 'decision') { s.decision = a.arg; return s; }
  if (a.type === 'principle') { s.principle = a.arg; return s; }
  if (a.type === 'sign' && s.decision && s.principle) { s.done = true; return s; }
  return state;
}

export function hud(s) {
  return [['Прочитано', `${s.read.length} / 6`, '', s.read.length / 6 * 100], ['Проверки', `${CHECKS - s.checked.length} из ${CHECKS}`, '', (CHECKS - s.checked.length) / CHECKS * 100], ['Основания', `${s.basis.length} / 3`, s.basis.length >= 2 ? 'good' : '']];
}

const relTag = r => r === 'ok' ? '<span class="g-tag good">проверено</span>' : r === 'bias' ? '<span class="g-tag warn">заинтересованный источник</span>' : '<span class="g-tag bad">не подтверждено</span>';

export function board(s) {
  const c = CASES[s.scenario];
  if (s.phase === 'decide') return `<section class="g-panel"><h3>${icon('scale')} ${esc(c.title)}</h3><p class="g-small" style="margin-bottom:10px">Основания: ${s.basis.map(id => esc(c.docs.find(d => d.id === id).kind)).join(', ')}</p><div class="g-choice">${c.decisions.map(d => `<button class="g-opt" data-act="decision" data-arg="${d.id}" aria-pressed="${s.decision === d.id}"><b>${esc(d.label)}</b><span>${esc(d.detail)}</span></button>`).join('')}</div></section>
    <section class="g-panel"><h3>${icon('quote')} Как объясните решение?</h3><div class="g-choice">${PRINCIPLES.map(p => `<button class="g-opt" data-act="principle" data-arg="${p.id}" aria-pressed="${s.principle === p.id}"><b>${esc(p.label)}</b><span>${esc(p.detail)}</span></button>`).join('')}</div><div class="g-row" style="margin-top:12px"><button class="btn" data-act="sign" ${s.decision && s.principle ? '' : 'disabled'}>${icon('check')} Подписать решение</button><button class="btn ghost small" data-act="back">К досье</button></div></section>`;
  return `<section class="g-panel"><h3>${icon('doc')} Досье: ${esc(c.title)}</h3><div class="et-docs">${c.docs.map(d => { const read = s.read.includes(d.id), checked = s.checked.includes(d.id), chosen = s.basis.includes(d.id); return `<article class="et-doc ${chosen ? 'is-basis' : ''}"><span class="eyebrow">${esc(d.kind)}</span><span class="g-small">${esc(d.from)}</span>${read ? `<p>${esc(d.text)}</p>` : '<p class="et-closed">Документ не прочитан</p>'}${checked ? `<p class="et-check">${relTag(d.rel)} ${esc(d.check)}</p>` : ''}<div class="g-row">${read ? '' : `<button class="btn ghost small" data-act="read" data-arg="${d.id}">${icon('eye')} Читать</button>`}${checked ? '' : `<button class="btn ghost small" data-act="check" data-arg="${d.id}" ${s.checked.length >= CHECKS ? 'disabled' : ''}>${icon('search')} Проверить</button>`}${read ? `<button class="btn small ${chosen ? 'mint' : 'ghost'}" data-act="basis" data-arg="${d.id}" aria-pressed="${chosen}">${chosen ? icon('check') + ' Основание' : 'В основания'}</button>` : ''}</div></article>`; }).join('')}</div><button class="btn g-main-btn" style="margin-top:14px" data-act="toDecide">К решению ${icon('arrow')}</button></section>`;
}

export function result(s) {
  const c = CASES[s.scenario], right = s.decision === c.right, principle = s.principle === 'same';
  const weak = s.basis.filter(id => c.docs.find(d => d.id === id).rel !== 'ok'), solid = c.basis.every(id => s.basis.includes(id)) && !weak.length;
  const stars = 1 + (right ? 1 : 0) + (right && solid && principle ? 1 : 0);
  return {stars, title: right ? 'Решение можно объяснить любому' : 'Решение вызовет вопросы',
    summary: c.why[s.decision],
    lines: [[right, right ? 'Выбрали решение, которое одинаково для всех в такой ситуации.' : 'Решение не выдерживает вопроса «а для другого вы бы сделали так же?»'], [!weak.length, weak.length ? `В основаниях — ненадёжный источник: ${weak.map(id => c.docs.find(d => d.id === id).kind).join(', ')}.` : 'Основания — только проверенные документы.'], [c.basis.every(id => s.basis.includes(id)), c.basis.every(id => s.basis.includes(id)) ? 'Опирались на правило и данные системы.' : `Ключевые документы: ${c.basis.map(id => c.docs.find(d => d.id === id).kind).join(' и ')}.`], [principle, principle ? 'Объяснили решение едиными критериями.' : 'Принцип объяснения не про справедливость.']],
    lesson: 'Справедливо — не значит одинаково, и не значит «как удобно сильному». Проверяйте, кто стоит за мнением, опирайтесь на правило и факты, и задайте себе вопрос: поступлю ли я так же с любым другим?'};
}
