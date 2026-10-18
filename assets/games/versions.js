// «Версия 7_final_точно2»: пять файлов «итоговый», действует один. Четыре улики из шести,
// выбор действующей версии и того, что сделать, чтобы путаница не повторилась.
import {esc, icon} from '../ui.js';
import {clone} from './kit.js';

export const intro = {
  story: 'Отдел месяц работал по порядку согласования, а сегодня юрист сказал: «Это не та версия». В общей папке пять файлов, и каждый называется «итоговым».',
  goal: 'Найти действующую версию по реквизитам, а не по названию, и навести порядок.',
  rules: ['Улик шесть, открыть можно четыре.', 'Название и дата изменения файла ничего не гарантируют. Смотрите на подпись, регистрацию и рассылку.', 'Нажмите на файл, который считаете действующим, и выберите, что сделать дальше.']
};
export const scenarios = [{name: 'Порядок согласования'}, {name: 'Положение о премировании'}];

const SETS = [
  {doc: 'Порядок', files: ['v1', 'final', 'approved', 'final2', 'copy'], current: 'final', names: {v1: 'Порядок_v1.doc', final: 'Порядок_final.doc', approved: 'Порядок_утверждённый.doc', final2: 'Порядок_final_точно2.doc', copy: 'Порядок (копия Ирины).doc'},
    clues: {dates: 'Изменены последними: «точно2» (вчера), «копия Ирины» (неделю назад), «final» (12.03).', sign: 'Электронная подпись ректора — у «final» и у «v1». У остальных подписи нет.', registry: '№ 98 — «v1», утратил силу с 12.03. № 145 — «final», действует с 12.03.', mail: '12.03 всем отделам разослан «Порядок_final.doc» со ссылкой на систему.', chat: '«Ирина говорит, что "точно2" — самый последний, работаем по нему».', order: 'Приказ № 145 утверждает порядок на 7 страницах. «Утверждённый» — 6 страниц: это черновик до правок юристов.'}},
  {doc: 'Положение', files: ['v1', 'final', 'approved', 'final2', 'copy'], current: 'approved', names: {v1: 'Положение_старое.doc', final: 'Положение_FINAL.doc', approved: 'Положение_2026.doc', final2: 'Положение_FINAL_новое.doc', copy: 'Положение (правки Олега).doc'},
    clues: {dates: 'Изменены последними: «правки Олега» (сегодня), «FINAL_новое» (вчера), «2026» (01.02).', sign: 'Подпись ректора — у «2026» и у «старое». У «FINAL» и «FINAL_новое» подписи нет.', registry: '№ 31 — «старое», утратило силу с 01.02. № 207 — «2026», действует с 01.02.', mail: '01.02 разослано «Положение_2026.doc». Файлы FINAL никуда не рассылались.', chat: '«Берите FINAL — это же окончательный вариант».', order: 'Приказ № 207 утверждает положение с приложением о шкале. Шкала есть только в «2026» и «правках Олега».'}}
];
const CLUE_NAMES = [['dates', 'Даты изменения файлов', 'calendar'], ['sign', 'Подписи', 'shield'], ['registry', 'Реестр в системе', 'doc'], ['mail', 'Рассылка исполнителям', 'chat'], ['chat', 'Чат отдела', 'users'], ['order', 'Текст приказа', 'flag']];
const AFTER = [['notify', 'Разослать ссылку на версию из системы, попросить удалить копии и подтвердить', true], ['rename', 'Переименовать файл в «ДЕЙСТВУЮЩИЙ_НЕ_ТРОГАТЬ.doc»', false], ['nothing', 'Сказать коллегам устно', false]];
const MAXCLUES = 4;
const KEY = ['sign', 'registry', 'mail', 'order'];

export function create(scenario = 0) { return {scenario, opened: [], pick: null, after: null, hint: 'Откройте улики. Их можно открыть четыре.', done: false}; }

export function act(state, a) {
  const s = clone(state);
  if (a.type === 'clue') { if (s.opened.includes(a.arg) || s.opened.length >= MAXCLUES) return state; s.opened.push(a.arg); s.hint = s.opened.length < MAXCLUES ? `Можно открыть ещё ${MAXCLUES - s.opened.length}.` : 'Улики открыты. Нажмите на действующий файл.'; return s; }
  if (a.type === 'pick') { s.pick = a.arg; s.hint = 'Что сделать, чтобы путаница не повторилась?'; return s; }
  if (a.type === 'after') { s.after = a.arg; return s; }
  if (a.type === 'confirm' && s.pick && s.after) { s.done = true; return s; }
  return state;
}

export function hud(s) { return [['Улики', `${MAXCLUES - s.opened.length} из ${MAXCLUES}`, '', (MAXCLUES - s.opened.length) / MAXCLUES * 100], ['Файлов «итоговых»', '5', 'warn'], ['Выбран', s.pick ? esc(SETS[s.scenario].names[s.pick]) : '—', '']]; }

export function board(s) {
  const set = SETS[s.scenario];
  const files = set.files.map((f, i) => `<button class="vr-file ${s.pick === f ? 'is-picked' : ''}" data-act="pick" data-arg="${f}" aria-pressed="${s.pick === f}" style="--r:${(i - 2) * 2}deg">${icon('doc')}<b>${esc(set.names[f])}</b>${s.pick === f ? `<span class="g-tag good">${icon('check')} действующий?</span>` : ''}</button>`).join('');
  const clues = CLUE_NAMES.map(([id, name, ic]) => { const open = s.opened.includes(id); return `<button class="g-opt" data-act="clue" data-arg="${id}" aria-pressed="${open}" ${open || s.opened.length >= MAXCLUES ? 'disabled' : ''} style="${open ? 'opacity:1' : ''}"><b>${icon(ic)} ${esc(name)}</b><span>${open ? esc(set.clues[id]) : 'Открыть улику'}</span></button>`; }).join('');
  const after = s.pick ? `<section class="g-panel"><h3>${icon('flag')} Что сделать дальше?</h3><div class="g-choice">${AFTER.map(([id, name]) => `<button class="g-opt" data-act="after" data-arg="${id}" aria-pressed="${s.after === id}"><b>${esc(name)}</b></button>`).join('')}</div><button class="btn g-main-btn" style="margin-top:12px" data-act="confirm" ${s.after ? '' : 'disabled'}>${icon('check')} Готово</button></section>` : '';
  return `<section class="g-panel"><h3>${icon('doc')} Общая папка «${esc(set.doc)}» <small>нажмите на действующий файл</small></h3><div class="vr-files">${files}</div></section><div class="g-cols"><section class="g-panel"><h3>${icon('search')} Улики</h3><div class="g-choice vr-clues">${clues}</div></section>${after || `<section class="g-panel"><h3>${icon('bulb')} Признаки действующей версии</h3><ul class="why-list"><li>${icon('check')}<span>Подписана уполномоченным лицом</span></li><li>${icon('check')}<span>Зарегистрирована в системе</span></li><li>${icon('check')}<span>Указана дата вступления в силу</span></li><li>${icon('check')}<span>Доведена до исполнителей</span></li></ul></section>`}</div>`;
}

export function result(s) {
  const set = SETS[s.scenario], right = s.pick === set.current, afterOk = AFTER.find(a => a[0] === s.after)[2], keys = s.opened.filter(id => KEY.includes(id)).length;
  return {stars: 1 + (right ? 1 : 0) + (right && afterOk ? 1 : 0), title: right ? 'Действующая версия найдена' : 'Это не действующая версия',
    summary: right ? `Действует «${set.names[set.current]}»: подписана, зарегистрирована, разослана.` : `Действует «${set.names[set.current]}». «${set.names[s.pick]}» — ${s.pick === 'v1' ? 'утратившая силу редакция' : 'неутверждённый файл без подписи'}.`,
    stats: [['Улики по реквизитам', `${keys}/4`], ['Версия', right ? 'верно' : 'мимо']],
    lines: [[keys >= 2, keys >= 2 ? 'Смотрели на подпись, реестр и рассылку.' : 'Опирались на даты и разговоры — это ненадёжно.'], [!s.opened.includes('chat') || right, s.opened.includes('chat') ? 'Мнение из чата — не реквизит.' : 'Не тратили улику на слухи.'], [afterOk, afterOk ? 'Одна точка правды: ссылка на систему и подтверждение от исполнителей.' : 'Переименование и устные договорённости путаницу не лечат.']],
    lesson: 'Действует та версия, у которой есть подпись, регистрационный номер, дата вступления и рассылка исполнителям. Название файла и «последнее изменение» ничего не значат. Держите одну точку правды — систему документооборота.'};
}
