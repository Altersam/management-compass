// «Карта влияния»: доведите решение до директора. Формальный канал не работает —
// директор решает по рекомендации того, кому доверяет. Связи нужно разведать, носителей — подготовить.
import {esc, icon} from '../ui.js';
import {clone} from './kit.js';

export const intro = {
  story: 'Вы предлагаете новый порядок закупок. Ваше письмо ушло наверх по формальной цепочке и застряло. Директор решает, но не так, как нарисовано в оргсхеме.',
  goal: 'Довести решение до директора по дороге, которой он доверяет, — за 8 ходов.',
  rules: ['Нажмите на человека на карте. «Разведать» открывает его связи и интересы (1 ход).', '«Подготовить» делает человека союзником (1 ход и 1 жетон капитала).', '«Передать решение» двигает маркер по открытой связи к союзнику или к директору.']
};
export const levels = ['10 ходов, капитал 4', '8 ходов, капитал 3', '8 ходов, капитал 2, без подсказок'];
export const scenarios = [{name: 'Порядок закупок'}, {name: 'Новая система оценки'}];

const MAPS = [
  {nodes: [
    ['me', 'Вы', 'Инициатор', 12, 78], ['boss', 'Руководитель', 'Ваш начальник', 30, 46], ['deputy', 'Замдиректора', 'Формальная вертикаль', 52, 22], ['dir', 'Директор', 'Принимает решение', 84, 14],
    ['expert', 'Методолог', 'Эксперт по закупкам', 40, 80], ['advisor', 'Советник', 'Ему доверяет директор', 72, 56], ['fin', 'Финдиректор', 'Против изменений', 88, 84]
  ], edges: [['me', 'boss', 'formal'], ['me', 'expert', 'access'], ['boss', 'deputy', 'formal'], ['deputy', 'dir', 'formal'], ['expert', 'advisor', 'trust'], ['advisor', 'dir', 'trust'], ['fin', 'dir', 'access'], ['boss', 'expert', 'access']],
  interests: {boss: 'Хочет меньше жалоб на сроки, но рисковать не будет.', deputy: 'Передаёт наверх только то, что уже согласовано.', dir: 'Не решает без независимого заключения и рекомендации доверенного человека.', expert: 'Давно видит проблему. Подготовит заключение, если его спросить.', advisor: 'Доверяет экспертам, а не начальникам. Слушает методолога.', fin: 'Боится потерять контроль над расходами.'},
  need: 'expert'},
  {nodes: [
    ['me', 'Вы', 'Инициатор', 12, 78], ['boss', 'Руководитель', 'Ваш начальник', 30, 46], ['deputy', 'Проректор', 'Формальная вертикаль', 52, 22], ['dir', 'Ректор', 'Принимает решение', 84, 14],
    ['expert', 'Профсоюз', 'Голос сотрудников', 40, 80], ['advisor', 'Совет кафедр', 'Ему доверяет ректор', 72, 56], ['fin', 'HR‑директор', 'Своя система оценки', 88, 84]
  ], edges: [['me', 'boss', 'formal'], ['me', 'expert', 'access'], ['boss', 'deputy', 'formal'], ['deputy', 'dir', 'formal'], ['expert', 'advisor', 'trust'], ['advisor', 'dir', 'trust'], ['fin', 'dir', 'access'], ['boss', 'expert', 'access']],
  interests: {boss: 'Поддержит, если не придётся спорить с HR.', deputy: 'Передаёт наверх только согласованное.', dir: 'Не меняет оценку без поддержки сотрудников и совета кафедр.', expert: 'Готов поддержать, если систему обсудят с людьми.', advisor: 'Слушает профсоюз. Без него — против.', fin: 'Защищает свою систему.'},
  need: 'expert'}
];
let MOVES = 8, CAPITAL = 3;

export function create(scenario = 0, level = 1) { MOVES = [10, 8, 8][level] ?? 8; CAPITAL = [4, 3, 2][level] ?? 3;
  const m = MAPS[scenario];
  return {scenario, token: 'me', from: null, moves: MOVES, capital: CAPITAL, selected: null,
    known: m.edges.map(([a, b]) => a === 'me' || b === 'me'), revealed: ['me'], support: ['me'], visible: ['me', 'boss', 'expert', 'dir', 'deputy'],
    log: [], hint: 'Нажмите на человека рядом с вами. Начните с разведки.', done: false};
}
const nodeOf = (s, id) => MAPS[s.scenario].nodes.find(n => n[0] === id);
const edgeIdx = (s, a, b) => MAPS[s.scenario].edges.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
const linked = (s, a, b) => { const i = edgeIdx(s, a, b); return i >= 0 && s.known[i]; };

export function act(state, a) {
  const s = clone(state); s.flash = null; const m = MAPS[s.scenario];
  if (a.type === 'select') { if (!s.visible.includes(a.arg)) return state; s.selected = a.arg; return s; }
  const id = s.selected, name = id && nodeOf(s, id)[1];
  if (!id || s.moves <= 0) return state;
  if (a.type === 'scout') {
    if (s.revealed.includes(id)) return state;
    s.revealed.push(id); s.moves--;
    m.edges.forEach(([x, y], i) => { if (x === id || y === id) { s.known[i] = true; for (const n of [x, y]) if (!s.visible.includes(n)) s.visible.push(n); } });
    s.flash = {tone: 'info', text: `${name}: ${m.interests[id]}`};
  } else if (a.type === 'prepare') {
    if (id === 'dir' || s.support.includes(id) || !s.revealed.includes(id) || s.capital < 1) return state;
    if (!s.support.some(x => linked(s, x, id))) { s.flash = {tone: 'bad', text: `До ${name} нет открытой дороги от вас или ваших союзников.`}; return s; }
    if (id === 'fin') { s.moves--; s.capital--; s.flash = {tone: 'bad', text: `${name} выслушал, но остался против. Капитал потрачен.`}; return endIfOut(s); }
    s.support.push(id); s.moves--; s.capital--; s.flash = {tone: 'good', text: `${name} готов поддержать решение.`};
  } else if (a.type === 'pass') {
    if (!linked(s, s.token, id)) { s.flash = {tone: 'bad', text: 'По этой связи пока нельзя: она не открыта или её нет.'}; return s; }
    if (id !== 'dir' && !s.support.includes(id)) { s.flash = {tone: 'bad', text: `${name} не готов нести решение. Сначала подготовьте.`}; return s; }
    s.moves--; s.from = s.token; s.token = id; s.log.push(id);
    if (id === 'dir') {
      const via = m.edges[edgeIdx(s, s.from, 'dir')][2];
      s.success = via === 'trust' && s.support.includes(m.need);
      s.reason = s.success ? 'Директор получил решение от человека, которому доверяет, вместе с заключением эксперта.' : via !== 'trust' ? 'Решение пришло по формальной цепочке. Директор отложил его: «Нужно независимое заключение».' : 'Рекомендация есть, но без заключения эксперта директор не решится.';
      s.done = true; return s;
    }
    s.flash = {tone: 'good', text: `Решение у: ${name}.`};
  } else return state;
  s.hint = s.moves ? `Ходов осталось: ${s.moves}.` : '';
  return endIfOut(s);
}
function endIfOut(s) { if (s.moves <= 0 && s.token !== 'dir') { s.success = false; s.reason = 'Ходы закончились, решение не дошло до директора.'; s.done = true; } return s; }

export function hud(s) {
  return [['Ходы', `${s.moves} из ${MOVES}`, s.moves <= 2 ? 'warn' : '', s.moves / MOVES * 100], ['Капитал', `${s.capital} из ${CAPITAL}`, '', s.capital / CAPITAL * 100], ['Решение у', esc(nodeOf(s, s.token)[1]), ''], ['Союзники', String(s.support.length - 1), '']];
}

export function board(s) {
  const m = MAPS[s.scenario];
  const lines = m.edges.map(([a, b, type], i) => { if (!s.known[i]) return ''; const [, , , x1, y1] = nodeOf(s, a), [, , , x2, y2] = nodeOf(s, b); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="in-edge ${type}"/>`; }).join('');
  const nodes = m.nodes.filter(n => s.visible.includes(n[0])).map(([id, name, role, x, y]) => `<button class="in-node ${s.support.includes(id) ? 'is-ally' : ''} ${s.selected === id ? 'is-sel' : ''} ${id === 'dir' ? 'is-dir' : ''} ${s.revealed.includes(id) ? '' : 'is-fog'}" style="left:${x}%;top:${y}%" data-act="select" data-arg="${id}" aria-pressed="${s.selected === id}">${s.token === id ? `<span class="in-token">${icon('doc')} решение</span>` : ''}<b>${esc(name)}</b><small>${esc(role)}</small></button>`).join('');
  const sel = s.selected, sn = sel && nodeOf(s, sel);
  const panel = sel ? `<section class="g-panel"><h3>${icon('users')} ${esc(sn[1])} <small>${esc(sn[2])}</small></h3>${s.revealed.includes(sel) ? `<p style="margin-bottom:12px">${esc(m.interests[sel] || 'Это вы.')}</p>` : '<p class="g-small" style="margin-bottom:12px">Интересы и связи неизвестны.</p>'}<div class="g-choice">
      <button class="g-opt" data-act="scout" ${s.revealed.includes(sel) ? 'disabled' : ''}><b>${icon('eye')} Разведать · 1 ход</b><span>Открыть связи и узнать, чего хочет.</span></button>
      ${sel !== 'me' && sel !== 'dir' ? `<button class="g-opt" data-act="prepare" ${s.support.includes(sel) || !s.revealed.includes(sel) || !s.capital ? 'disabled' : ''}><b>${icon('heart')} Подготовить · 1 ход, 1 капитал</b><span>${s.support.includes(sel) ? 'Уже союзник.' : !s.revealed.includes(sel) ? 'Сначала разведайте.' : 'Обсудить, учесть интересы, получить поддержку.'}</span></button>` : ''}
      ${sel !== s.token ? `<button class="g-opt" data-act="pass"><b>${icon('arrow')} Передать решение · 1 ход</b><span>По открытой связи от «${esc(nodeOf(s, s.token)[1])}».</span></button>` : ''}
    </div></section>` : `<section class="g-panel"><h3>${icon('bulb')} Как читать карту</h3><p>Сплошная линия — формальный канал. Пунктир — доверие. Тонкая — доступ. Связи появляются после разведки.</p></section>`;
  return `<div class="g-cols"><section class="g-panel"><h3>${icon('map')} Карта</h3><div class="in-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${nodes}</div><p class="g-small in-legend"><i class="formal"></i> формальный канал <i class="trust"></i> доверие <i class="access"></i> доступ</p></section>${panel}</div>`;
}

export function result(s) {
  const scouted = s.revealed.length - 1, ally = s.support.includes(MAPS[s.scenario].need);
  return {stars: s.success ? (s.moves >= 1 ? 3 : 2) : 1, title: s.success ? 'Директор принял решение' : 'Решение не принято',
    summary: s.reason, stats: [['Ходов осталось', String(s.moves)], ['Разведано', String(scouted)], ['Союзников', String(s.support.length - 1)]],
    lines: [[scouted >= 2, scouted >= 2 ? 'Сначала разобрались, кто на что влияет.' : 'Мало разведки — действовали вслепую.'], [ally, ally ? 'Заручились поддержкой эксперта.' : 'Без эксперта решение выглядит как личная инициатива.'], [!s.log.includes('deputy'), s.log.includes('deputy') ? 'Решение ушло по формальной цепочке — там оно и застряло.' : 'Не тратили ходы на формальную цепочку.']],
    lesson: 'Формальная схема показывает, кто подписывает, но не всегда — кто влияет. Разведайте реальные связи, подготовьте людей, которым доверяет решающий, и приходите с заключением эксперта.'};
}
