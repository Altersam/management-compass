// «Лаборатория изменений»: шесть групп, у каждой своя ступень ADKAR.
// Помогает только мера под текущую ступень. Лидеры мнений подтягивают соседей, без закрепления — откат.
import {esc, icon} from '../ui.js';
import {clone, avatar} from './kit.js';

export const intro = {
  story: 'Университет перешёл на электронный документооборот. Приказ подписан, система работает, а пользуются ею три человека. Остальные пишут письма.',
  goal: 'За отведённые волны довести хотя бы четыре группы из шести до устойчивой новой практики.',
  rules: ['У каждой группы своя ступень: понимание → желание → знание → умение → закрепление. Мера помогает, только если подходит ступени.', '«Диагностика» показывает, где застряла группа. Наугад — можно промахнуться.', 'В волне 4 действия. Лидеры мнений подтягивают связанные группы. Кого не закрепили — может откатиться.']
};
export const levels = ['4 волны по 5 действий', '4 волны по 4 действия', '3 волны по 4 действия, без подсказок'];
export const scenarios = [{name: 'Электронный документооборот'}, {name: 'Новое расписание'}];

export const STEPS = ['Понимание', 'Желание', 'Знание', 'Умение', 'Закрепление'];
const SYMPTOM = ['«Зачем это вообще нужно?»', '«Нам и по‑старому нормально»', '«Хотим, но не знаем, как»', '«Знаем как, но нет времени»', '«Работаем по‑новому, но иногда срываемся»', 'Новая практика стала привычкой'];
export const ACTIONS = [['explain', 'Объяснить смысл', 0], ['involve', 'Вовлечь в настройку', 1], ['train', 'Обучить', 2], ['relieve', 'Снять нагрузку на переход', 3], ['reinforce', 'Закрепить правилом и показателем', 4]];
const GROUPS = [
  [['dean', 'Деканат А', '#ffc53d', 2, 'deanb'], ['deanb', 'Деканат Б', '#ffe08a', 1], ['it', 'IT‑служба', '#8fd3ff', 3], ['teach', 'Преподаватели', '#ff9eb8', 0], ['acc', 'Бухгалтерия', '#9be7c4', 1], ['council', 'Студсовет', '#d9d2ff', 2, 'teach']],
  [['dean', 'Учебный отдел', '#ffc53d', 2, 'deanb'], ['deanb', 'Диспетчеры', '#ffe08a', 1], ['it', 'IT‑служба', '#8fd3ff', 3], ['teach', 'Кафедры', '#ff9eb8', 0], ['acc', 'Студенты', '#9be7c4', 1], ['council', 'Старосты', '#d9d2ff', 2, 'teach']]
];
let WAVES = 4, AP = 4, GOAL = 4;

export function create(scenario = 0, level = 1) { AP = [5, 4, 4][level] ?? 4; WAVES = [4, 4, 3][level] ?? 4;
  return {scenario, wave: 1, ap: AP, groups: GROUPS[scenario].map(([id, name, color, stage, link]) => ({id, name, color, stage, link: link || null, known: false, touched: false})), selected: null, log: [], hits: 0, misses: 0, regress: 0, hint: 'Выберите группу. Начните с диагностики — так не потратите действие впустую.', done: false};
}
const done = g => g.stage >= 5;

export function act(state, a) {
  const s = clone(state); s.flash = null;
  if (a.type === 'select') { s.selected = a.arg; return s; }
  if (a.type === 'endWave') return endWave(s);
  const g = s.groups.find(x => x.id === s.selected); if (!g || s.ap <= 0) return state;
  if (a.type === 'diagnose') { if (g.known) return state; g.known = true; s.ap--; s.flash = {tone: 'info', text: `${g.name}: ${SYMPTOM[g.stage]} Ступень — ${STEPS[g.stage] || 'пройдено'}.`}; return after(s); }
  const actDef = ACTIONS.find(x => x[0] === a.type); if (!actDef || done(g)) return state;
  s.ap--; g.touched = true;
  if (actDef[2] === g.stage) {
    g.stage++; g.known = true; s.hits++;
    s.flash = {tone: 'good', text: `${g.name}: ${done(g) ? 'новая практика закрепилась!' : `теперь — «${STEPS[g.stage]}».`}`};
    const linked = g.link && s.groups.find(x => x.id === g.link);
    if (linked && !done(linked) && linked.stage < g.stage) { linked.stage++; s.flash.text += ` Лидер мнений подтянул «${linked.name}».`; }
  } else { s.misses++; s.flash = {tone: 'bad', text: `${g.name}: мера не попала. ${g.known ? `Им сейчас нужно «${STEPS[g.stage]}».` : 'Вы действовали без диагностики.'}`}; }
  return after(s);
}
function after(s) { s.hint = s.ap ? `В этой волне осталось действий: ${s.ap}.` : 'Действия волны закончились. Завершите волну.'; return s; }

function endWave(s) {
  // Groups that reached "Умение" but were not reinforced this wave slip back.
  const slipped = [];
  for (const g of s.groups) { if (g.stage === 4 && !g.touched) { g.stage = 3; slipped.push(g.name); s.regress++; } g.touched = false; }
  s.flash = slipped.length ? {tone: 'bad', text: `Откат без закрепления: ${slipped.join(', ')}.`} : {tone: 'info', text: `Волна ${s.wave} завершена.`};
  s.wave++; s.ap = AP;
  if (s.wave > WAVES) { s.wave = WAVES; s.done = true; return s; }
  s.hint = 'Новая волна: 4 действия.'; return s;
}

export function hud(s) {
  const fixed = s.groups.filter(done).length;
  return [['Волна', `${s.wave} / ${WAVES}`, '', s.wave / WAVES * 100], ['Действия', `${s.ap} из ${AP}`, s.ap ? '' : 'warn', s.ap / AP * 100], ['Закрепили', `${fixed} из 6`, fixed >= GOAL ? 'good' : '', fixed / GOAL * 100]];
}

export function board(s) {
  const groups = s.groups.map(g => `<button class="ch-group ${s.selected === g.id ? 'is-sel' : ''} ${done(g) ? 'is-done' : ''}" data-act="select" data-arg="${g.id}" aria-pressed="${s.selected === g.id}">${avatar(g.name[0], g.color, 44)}<span><b>${esc(g.name)}</b>${g.link ? `<span class="g-tag info">лидер мнений → ${esc(s.groups.find(x => x.id === g.link).name)}</span>` : ''}</span>
    <span class="ch-ladder" aria-label="${g.known ? `Ступень: ${STEPS[g.stage] || 'закреплено'}` : 'Ступень неизвестна'}">${STEPS.map((st, i) => `<i class="${i < g.stage ? 'on' : ''} ${g.known && i === g.stage ? 'now' : ''}" title="${st}"></i>`).join('')}</span>
    <span class="g-small">${g.known ? esc(SYMPTOM[g.stage]) : '? не диагностирована'}</span></button>`).join('');
  const g = s.groups.find(x => x.id === s.selected);
  const panel = g ? `<section class="g-panel"><h3>${icon('users')} ${esc(g.name)}</h3><div class="g-choice"><button class="g-opt" data-act="diagnose" ${g.known || !s.ap ? 'disabled' : ''}><b>${icon('search')} Диагностика</b><span>Узнать, на какой ступени группа.</span></button>${ACTIONS.map(([id, name, st]) => `<button class="g-opt" data-act="${id}" ${!s.ap || done(g) ? 'disabled' : ''}><b>${esc(name)}</b><span>Помогает на ступени «${STEPS[st]}».</span></button>`).join('')}</div></section>` : `<section class="g-panel"><h3>${icon('bulb')} Модель ADKAR</h3><ol class="ch-adkar">${STEPS.map((st, i) => `<li><b>${st}</b> — ${esc(ACTIONS[i][1].toLowerCase())}</li>`).join('')}</ol></section>`;
  return `<div class="g-cols"><section class="g-panel"><h3>${icon('users')} Группы <small>шкала — ступени ADKAR</small></h3><div class="ch-groups">${groups}</div><button class="btn g-main-btn" style="margin-top:14px" data-act="endWave">${s.wave < WAVES ? `Завершить волну ${s.wave}` : 'Завершить последнюю волну'} ${icon('arrow')}</button></section>${panel}</div>`;
}

export function result(s) {
  const fixed = s.groups.filter(done).length;
  return {stars: fixed >= 5 ? 3 : fixed >= GOAL ? 2 : 1, title: fixed >= GOAL ? `Новая практика закрепилась в ${fixed} группах` : `Закрепили только ${fixed} из 6`,
    summary: 'Изменение идёт не одновременно: каждая группа застревает на своей ступени.',
    stats: [['Закрепили', `${fixed}/6`], ['Точных мер', String(s.hits)], ['Промахов', String(s.misses)]],
    lines: [[s.misses <= 2, s.misses <= 2 ? 'Почти все меры попали в нужную ступень.' : `Промахов: ${s.misses}. Обучение не лечит «не хочу», а объяснение — «нет времени».`], [s.regress === 0, s.regress === 0 ? 'Никто не откатился.' : `Откатов: ${s.regress}. Без закрепления новое быстро забывается.`], [s.groups.filter(g => g.link && g.stage >= 3).length > 0, 'Лидеры мнений помогают двигать соседние группы.']],
    lesson: 'Сначала поймите, где застрял человек: не понимает, не хочет, не знает, не может или не закрепил. Мера работает только на своей ступени. И не бросайте группу на полпути — без закрепления будет откат.'};
}
