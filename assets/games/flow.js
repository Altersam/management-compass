// «Бутылочное горлышко»: поток заявок через пять этапов. Три раунда по пять дней,
// перед каждым — одно вмешательство. Узкое место после улучшения «переезжает».
import {esc, icon} from '../ui.js';
import {clone} from './kit.js';

export const intro = {
  story: 'Приёмная комиссия обрабатывает заявления. Каждый день приходит 6 новых, а очередь только растёт. Все заняты, все устали.',
  goal: 'Сделать так, чтобы поток успевал за входом и заявления не копились.',
  rules: ['Перед каждым раундом — одно вмешательство: усилить этап или ограничить вход.', 'Раунд — пять рабочих дней. Смотрите, где копятся заявления.', 'Помните: скорость всей цепочки равна скорости самого медленного этапа.']
};
export const scenarios = [{name: 'Приёмная комиссия'}, {name: 'Отдел кадров'}];

const CONFIGS = [
  {demand: 6, stages: [['in', 'Приём', 9], ['check', 'Проверка', 7], ['prep', 'Подготовка', 4], ['sign', 'Подпись', 6], ['out', 'Выдача', 9]]},
  {demand: 5, stages: [['in', 'Приём', 8], ['check', 'Проверка', 3], ['prep', 'Оформление', 6], ['sign', 'Подпись', 4], ['out', 'Выдача', 8]]}
];
const ROUNDS = 3, DAYS = 5;
const ACTIONS = [
  {id: 'person', name: 'Добавить человека на этап', detail: '+2 заявления в день на выбранном этапе.', needsStage: true},
  {id: 'lean', name: 'Убрать лишнюю работу на этапе', detail: '+1 в день: лишние визы, повторный ввод.', needsStage: true},
  {id: 'limit', name: 'Не запускать больше, чем можем закончить', detail: 'Вход в процесс ограничен мощностью самого медленного этапа.'}
];

export function create(scenario = 0) {
  const cfg = CONFIGS[scenario];
  const s = {scenario, demand: cfg.demand, round: 0, stages: cfg.stages.map(([id, name, cap]) => ({id, name, cap, queue: 4})), backlog: 0, limit: false, history: [], picks: [], stage: null, action: null, hint: 'Посмотрите на мощности этапов и выберите вмешательство на первый раунд.', done: false};
  s.firstBottleneck = bottleneck(s);
  return s;
}
export const bottleneck = s => s.stages.reduce((a, b) => b.cap < a.cap ? b : a).id;

export function simulateRound(s) {
  const days = [];
  for (let d = 0; d < DAYS; d++) {
    const minCap = Math.min(...s.stages.map(x => x.cap));
    const intake = s.limit ? Math.min(s.demand + s.backlog, minCap) : s.demand + s.backlog;
    s.backlog = s.demand + s.backlog - intake;
    let finished = 0;
    for (let i = s.stages.length - 1; i >= 0; i--) {
      const st = s.stages[i], moved = Math.min(st.cap, st.queue);
      st.queue -= moved;
      if (i === s.stages.length - 1) finished += moved; else s.stages[i + 1].queue += moved;
    }
    s.stages[0].queue += intake;
    days.push(finished);
  }
  const wip = s.stages.reduce((n, x) => n + x.queue, 0);
  const through = days.reduce((a, b) => a + b, 0) / DAYS;
  return {days, through, wip, lead: through ? (wip + s.backlog) / through : 99};
}

export function act(state, a) {
  const s = clone(state); s.flash = null;
  if (a.type === 'action') { s.action = a.arg; const def = ACTIONS.find(x => x.id === a.arg); s.hint = def.needsStage ? 'Теперь нажмите на этап.' : 'Готово. Запустите раунд.'; return s; }
  if (a.type === 'stage') { s.stage = a.arg; s.hint = 'Запустите раунд — пять дней.'; return s; }
  if (a.type === 'run') {
    const def = ACTIONS.find(x => x.id === s.action); if (!def || (def.needsStage && !s.stage)) return state;
    if (def.id === 'limit') s.limit = true; else s.stages.find(x => x.id === s.stage).cap += def.id === 'person' ? 2 : 1;
    s.picks.push({action: def.id, stage: def.needsStage ? s.stage : null, bottleneck: bottleneck(state)});
    const r = simulateRound(s); s.history.push(r); s.round++; s.wipTrend = (s.wipTrend || []).concat(r.wip + s.backlog);
    const neck = bottleneck(s), name = s.stages.find(x => x.id === neck).name;
    s.flash = {tone: r.through >= s.demand - .01 ? 'good' : 'info', text: `Раунд ${s.round}: выходило ${r.through.toFixed(1).replace('.', ',')} в день при входе ${s.demand}. Самый медленный этап сейчас — «${name}».`};
    s.action = null; s.stage = null;
    if (s.round >= ROUNDS) { s.done = true; return s; }
    s.hint = 'Выберите следующее вмешательство.';
    return s;
  }
  return state;
}

export function hud(s) {
  const last = s.history[s.history.length - 1], wip = s.stages.reduce((n, x) => n + x.queue, 0) + s.backlog;
  return [['Раунд', `${Math.min(s.round + 1, ROUNDS)} / ${ROUNDS}`, '', s.round / ROUNDS * 100], ['Вход в день', `${s.demand}`, ''], ['Выход в день', last ? last.through.toFixed(1).replace('.', ',') : '—', last ? (last.through >= s.demand - .01 ? 'good' : 'bad') : ''], ['В очереди', `${wip}`, wip > 25 ? 'bad' : wip > 12 ? 'warn' : 'good']];
}

export function board(s) {
  const def = ACTIONS.find(x => x.id === s.action), pickStage = def?.needsStage;
  const maxCap = Math.max(...s.stages.map(x => x.cap));
  const stages = s.stages.map((st, i) => `<button class="fl-stage ${s.stage === st.id ? 'is-picked' : ''} ${pickStage ? 'is-target' : ''}" data-act="stage" data-arg="${st.id}" ${pickStage ? '' : 'aria-disabled="true"'}><b>${esc(st.name)}</b><span class="fl-cap" aria-label="Мощность ${st.cap} в день">${st.cap}<small>/день</small></span><span class="g-meter"><i style="width:${st.cap / maxCap * 100}%"></i></span><span class="fl-queue" aria-label="Очередь ${st.queue}">${Array.from({length: Math.min(st.queue, 24)}, () => '<i></i>').join('')}${st.queue > 24 ? `<em>+${st.queue - 24}</em>` : ''}</span><span class="g-small">очередь ${st.queue}</span></button>${i < s.stages.length - 1 ? '<span class="fl-arrow">→</span>' : ''}`).join('');
  const chart = s.history.length ? `<section class="g-panel"><h3>${icon('chart')} Выход по дням <small>линия — вход ${s.demand}/день</small></h3><div class="fl-chart" style="--d:${s.demand}">${s.history.flatMap((r, ri) => r.days.map((d, di) => `<span class="fl-col ${d >= s.demand ? 'ok' : ''}" style="--h:${d / 12 * 100}%" title="Раунд ${ri + 1}, день ${di + 1}: ${d}"></span>`)).join('')}<i class="fl-line" style="bottom:${s.demand / 12 * 100}%"></i></div></section>` : '';
  return `<section class="g-panel"><h3>${icon('flow')} Поток <small>${pickStage ? 'нажмите этап' : 'квадратики — заявления в очереди'}</small></h3><div class="fl-line-wrap"><span class="fl-in">${icon('arrow')}<b>+${s.demand}</b>${s.backlog ? `<small>ждут входа: ${s.backlog}</small>` : ''}</span>${stages}</div></section>
    <div class="g-cols"><section class="g-panel"><h3>${icon('bolt')} Вмешательство на раунд ${s.round + 1}</h3><div class="g-choice">${ACTIONS.map(x => `<button class="g-opt" data-act="action" data-arg="${x.id}" aria-pressed="${s.action === x.id}" ${x.id === 'limit' && s.limit ? 'disabled' : ''}><b>${esc(x.name)}</b><span>${esc(x.detail)}</span></button>`).join('')}</div><button class="btn g-main-btn" style="margin-top:12px" data-act="run" ${def && (!def.needsStage || s.stage) ? '' : 'disabled'}>${icon('play')} Прожить 5 дней</button></section>${chart || `<section class="g-panel"><h3>${icon('bulb')} Подсказка</h3><p>Найдите этап с самой маленькой мощностью. Пока его не усилить, остальное почти не важно.</p></section>`}</div>`;
}

export function result(s) {
  const last = s.history[s.history.length - 1], first = s.picks[0];
  const hitFirst = first.stage === s.firstBottleneck, keeps = last.through >= s.demand - .01;
  const wasted = s.picks.filter(p => p.stage && p.stage !== p.bottleneck).length;
  const stars = Math.max(1, (hitFirst ? 1 : 0) + (keeps ? 1 : 0) + (keeps && wasted === 0 ? 1 : 0));
  return {stars, title: keeps ? 'Поток успевает за входом' : 'Очередь продолжает расти',
    summary: `Последний раунд: выход ${last.through.toFixed(1).replace('.', ',')} в день при входе ${s.demand}, в очереди ${last.wip + s.backlog}.`,
    stats: [['Выход/день', last.through.toFixed(1).replace('.', ',')], ['В очереди', String(last.wip + s.backlog)], ['Мимо узкого места', String(wasted)]],
    lines: [[hitFirst, hitFirst ? 'Первым ходом усилили самый медленный этап.' : `Первым ходом усилили не тот этап: узким местом была «${s.stages.find(x => x.id === s.firstBottleneck).name}».`], [wasted === 0, wasted === 0 ? 'Ни одного усиления «мимо» узкого места.' : `Вмешательств мимо узкого места: ${wasted}. Они не ускорили поток.`], [s.limit, s.limit ? 'Ограничили вход — очередь перестала разбухать внутри процесса.' : 'Вход не ограничивали — всё, что не успели, копилось внутри.']],
    lesson: 'Усиливать нужно только самый медленный этап. После улучшения узкое место «переезжает» — ищите его снова. И не запускайте больше работы, чем процесс способен закончить.'};
}
