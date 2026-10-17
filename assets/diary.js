// Quick diary: an entry is built from choices (topic, situation, outcome, factors, next step)
// with one optional line of text. Entries stay compatible with the journal format
// (title / situation / learning / action / rating) and keep structured fields alongside.
import {diaryTopics, diaryFactors, diaryOutcomes, diaryNextSteps} from '../content/diary-catalog.js';

if (typeof document !== 'undefined' && !document.querySelector('link[data-diary-style]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = new URL('./diary.css', import.meta.url); link.dataset.diaryStyle = '';
  document.head.append(link);
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const topicOf = id => diaryTopics.find(t => t.id === Number(id));
const MAX_FACTORS = 3;

function techniquesFor(topic) {
  const chapter = globalThis.HANDBOOK?.chapters?.find(c => c.id === Number(topic));
  return (chapter?.techniques || []).map(t => t.name);
}

// Builds the compatible journal entry from structured choices.
export function composeEntry(choice, existing = {}) {
  const t = topicOf(choice.topic);
  const situation = choice.situation || 'Другое';
  const helped = choice.helped || [], blocked = choice.blocked || [];
  // A legacy free-text entry keeps its original text when it is re-tagged with choices.
  const legacy = existing.id && !existing.quick ? {situation: existing.situation || '', learning: existing.learning || '', type: existing.type} : existing.quick?.legacy;
  const learning = [helped.length ? 'Помогло: ' + helped.join(', ') : '', blocked.length ? 'Мешало: ' + blocked.join(', ') : '', legacy?.learning || ''].filter(Boolean).join('. ');
  return {
    ...existing,
    date: choice.date || today(),
    type: legacy?.type || 'Наблюдение',
    title: (choice.note || '').trim() ? choice.note.trim().slice(0, 140) : situation,
    situation: `${t ? t.short + ': ' : ''}${situation}${legacy?.situation ? '\n' + legacy.situation : ''}`,
    learning,
    action: choice.next || '',
    rating: Math.min(5, Math.max(1, Number(choice.rating) || 3)),
    topic: t ? t.id : null,
    quick: {situation, helped, blocked, next: choice.next || '', note: (choice.note || '').trim(), ...(legacy ? {legacy} : {})},
    updatedAt: new Date().toISOString()
  };
}

// Aggregates for the visual summary. Legacy entries count by date and rating only.
export function summarize(entries, now = new Date()) {
  const byTopic = Object.fromEntries(diaryTopics.map(t => [t.id, 0]));
  const helped = {}, blocked = {};
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10);
  let week = 0, sum = 0;
  for (const e of entries) {
    if (e.topic && byTopic[e.topic] !== undefined) byTopic[e.topic]++;
    for (const f of e.quick?.helped || []) helped[f] = (helped[f] || 0) + 1;
    for (const f of e.quick?.blocked || []) blocked[f] = (blocked[f] || 0) + 1;
    if (e.date >= weekAgo) week++;
    sum += Number(e.rating) || 3;
  }
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const trend = [...entries].sort((a, b) => a.date.localeCompare(b.date) || String(a.createdAt).localeCompare(String(b.createdAt))).slice(-14).map(e => Number(e.rating) || 3);
  return {total: entries.length, week, average: entries.length ? sum / entries.length : 0, byTopic, helped: top(helped), blocked: top(blocked), trend};
}

function sparkline(values) {
  if (values.length < 2) return '<p class="dq-muted">Тренд появится после двух записей.</p>';
  const w = 280, h = 64, step = w / (values.length - 1), y = v => h - 6 - (v - 1) / 4 * (h - 12);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`);
  return `<svg class="dq-spark" viewBox="-6 0 ${w + 12} ${h}" role="img" aria-label="Оценки последних записей: ${values.join(', ')} из 5"><line x1="0" x2="${w}" y1="${y(3)}" y2="${y(3)}" class="mid"/><polyline points="${pts.join(' ')}"/>${values.map((v, i) => `<circle cx="${(i * step).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.5"/>`).join('')}</svg><div class="dq-spark-scale"><span>раньше</span><span>середина — «как ожидал»</span><span>сейчас</span></div>`;
}

function bars(list, max, empty) {
  if (!list.length) return `<p class="dq-muted">${empty}</p>`;
  return `<ul class="dq-bars">${list.map(([label, n]) => `<li><span>${esc(label)}</span><i style="--w:${Math.round(n / max * 100)}%"></i><b>${n}</b></li>`).join('')}</ul>`;
}

export function createDiary({root, store, active, notify = () => {}, onChange = () => {}}) {
  let choice = {topic: null, situation: null, rating: null, helped: [], blocked: [], next: '', note: '', date: today()};
  let editing = null, filter = 'all', query = '', profileId = null;
  const data = () => store.profile(active()).data;
  const blank = () => ({topic: null, situation: null, rating: null, helped: [], blocked: [], next: '', note: '', date: today()});
  // The unsaved choice survives navigation and reloads, separately for each profile.
  function saveDraft() { store.update(active(), d => { d.worksheets.diaryDraft = {kind: 'quick', ...choice, editing: editing || ''}; }); }
  function clearDraft() { store.update(active(), d => { delete d.worksheets.diaryDraft; }); }
  function loadDraft() {
    const d = data().worksheets?.diaryDraft;
    choice = blank(); editing = null;
    if (!d || typeof d !== 'object') return;
    if (d.kind === 'quick') {
      choice = {...choice, topic: topicOf(d.topic) ? Number(d.topic) : null, situation: typeof d.situation === 'string' ? d.situation : null, rating: Number(d.rating) || null,
        helped: Array.isArray(d.helped) ? d.helped.slice(0, MAX_FACTORS) : [], blocked: Array.isArray(d.blocked) ? d.blocked.slice(0, MAX_FACTORS) : [],
        next: typeof d.next === 'string' ? d.next : '', note: typeof d.note === 'string' ? d.note : '', date: /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') ? d.date : today()};
      editing = data().journal.some(e => e.id === d.editing) ? d.editing : null;
    } else if (typeof d.title === 'string') choice.note = d.title;
  }

  const chips = (name, options, selected, multi) => options.map(o => {
    const on = multi ? selected.includes(o) : selected === o;
    return `<button type="button" class="dq-chip" data-pick="${name}" data-value="${esc(o)}" aria-pressed="${on}">${esc(o)}</button>`;
  }).join('');

  function formHtml() {
    const t = topicOf(choice.topic);
    const nextOptions = t ? [...techniquesFor(t.id), ...diaryNextSteps] : diaryNextSteps;
    const ready = choice.topic && choice.situation && choice.rating;
    return `<form id="diaryForm" class="dq-form" novalidate>
      <div class="dq-form-head"><h3>${editing ? 'Изменить запись' : 'Запись за 30 секунд'}</h3><label class="dq-date">Дата<input type="date" name="date" value="${esc(choice.date)}" required></label></div>
      <fieldset class="dq-step"><legend><span>1</span> Тема</legend><div class="dq-chips">${diaryTopics.map(x => `<button type="button" class="dq-chip" data-pick="topic" data-value="${x.id}" aria-pressed="${choice.topic === x.id}">${esc(x.short)}</button>`).join('')}</div></fieldset>
      <fieldset class="dq-step" ${t ? '' : 'disabled'}><legend><span>2</span> Что произошло</legend><div class="dq-chips">${t ? chips('situation', [...t.situations, 'Другое'], choice.situation, false) : '<p class="dq-muted">Сначала выберите тему.</p>'}</div></fieldset>
      <fieldset class="dq-step"><legend><span>3</span> Как прошло</legend><div class="dq-scale" role="radiogroup" aria-label="Как прошло">${diaryOutcomes.map((o, i) => `<button type="button" role="radio" class="dq-scale-btn s${i + 1}" data-pick="rating" data-value="${i + 1}" aria-checked="${choice.rating === i + 1}" aria-label="${o}"><b>${i + 1}</b><span>${esc(o)}</span></button>`).join('')}</div></fieldset>
      <div class="dq-two">
        <fieldset class="dq-step"><legend><span>4</span> Что помогло <small>до ${MAX_FACTORS}</small></legend><div class="dq-chips is-good">${chips('helped', diaryFactors.helped, choice.helped, true)}</div></fieldset>
        <fieldset class="dq-step"><legend><span>5</span> Что мешало <small>до ${MAX_FACTORS}</small></legend><div class="dq-chips is-bad">${chips('blocked', diaryFactors.blocked, choice.blocked, true)}</div></fieldset>
      </div>
      <fieldset class="dq-step"><legend><span>6</span> Следующий шаг</legend><div class="dq-chips">${chips('next', nextOptions, choice.next, false)}</div></fieldset>
      <label class="dq-note">Заметка одной строкой <small>необязательно${choice.situation === 'Другое' ? ' — опишите, что произошло' : ''}</small><input name="title" maxlength="140" value="${esc(choice.note)}" placeholder="Например: договорились сверяться по средам"></label>
      <div class="dq-actions"><button class="button primary" type="submit" ${ready ? '' : 'aria-disabled="true"'}>${editing ? 'Сохранить изменения' : 'Сохранить запись'}</button>${editing ? '<button type="button" class="text-button" data-cancel>Отменить</button>' : ''}<span class="dq-hint">${ready ? '' : 'Нужно выбрать тему, ситуацию и оценку.'}</span></div>
    </form>`;
  }

  function summaryHtml(entries) {
    const s = summarize(entries);
    const maxTopic = Math.max(1, ...Object.values(s.byTopic));
    const maxFactor = Math.max(1, ...s.helped.map(x => x[1]), ...s.blocked.map(x => x[1]));
    return `<section class="dq-summary" aria-label="Обзор дневника">
      <div class="dq-kpis"><div><span>Записей</span><b>${s.total}</b></div><div><span>За 7 дней</span><b>${s.week}</b></div><div><span>Средний исход</span><b>${s.total ? s.average.toFixed(1).replace('.', ',') : '—'}<small>/5</small></b></div></div>
      <div class="dq-panel"><h4>Карта практики</h4><p class="dq-muted">Нажмите тему, чтобы оставить только её записи.</p><ul class="dq-topics">${diaryTopics.map(t => `<li><button type="button" data-filter-topic="${t.id}" aria-pressed="${String(filter) === String(t.id)}"><span>${esc(t.short)}</span><i style="--w:${Math.round(s.byTopic[t.id] / maxTopic * 100)}%"></i><b>${s.byTopic[t.id]}</b></button></li>`).join('')}</ul></div>
      <div class="dq-panel"><h4>Как идут дела</h4>${sparkline(s.trend)}</div>
      <div class="dq-panel dq-factors"><div><h4>Чаще мешает</h4>${bars(s.blocked, maxFactor, 'Пока не отмечено.')}</div><div><h4>Чаще помогает</h4>${bars(s.helped, maxFactor, 'Пока не отмечено.')}</div></div>
    </section>`;
  }

  function entryHtml(e) {
    const t = topicOf(e.topic), q = e.quick;
    const dots = `<span class="dq-dots" aria-label="Оценка ${e.rating} из 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= e.rating ? 'on' : ''}"></i>`).join('')}</span>`;
    const body = q
      ? `${q.note && q.note !== e.title ? `<p>${esc(q.note)}</p>` : ''}${q.situation && e.title !== q.situation ? `<p class="dq-muted">${esc(q.situation)}</p>` : ''}<div class="dq-tags">${q.helped.map(f => `<span class="good">+ ${esc(f)}</span>`).join('')}${q.blocked.map(f => `<span class="bad">− ${esc(f)}</span>`).join('')}</div>${q.next ? `<p class="dq-next">→ ${esc(q.next)}</p>` : ''}${q.legacy?.situation ? `<details class="dq-legacy"><summary>Исходный текст</summary><p>${esc(q.legacy.situation)}</p>${q.legacy.learning ? `<p>${esc(q.legacy.learning)}</p>` : ''}</details>` : ''}`
      : `<p>${esc(e.situation)}</p>${e.learning ? `<p><b>Заметил:</b> ${esc(e.learning)}</p>` : ''}${e.action ? `<p class="dq-next">→ ${esc(e.action)}</p>` : ''}`;
    return `<article class="diary-entry dq-entry"><div class="entry-meta"><span class="entry-type">${esc(t ? t.short : e.type)}</span><time datetime="${esc(e.date)}">${esc(e.date)}</time>${dots}</div><h3>${esc(e.title)}</h3>${body}<div class="entry-actions"><button class="text-button edit-entry" data-id="${esc(e.id)}">Изменить</button> <button class="text-button delete-entry" data-id="${esc(e.id)}">Удалить</button></div></article>`;
  }

  function listHtml(entries) {
    const shown = entries.filter(e => (filter === 'all' || String(e.topic) === String(filter)) && [e.title, e.situation, e.learning, e.action].join(' ').toLowerCase().includes(query))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)));
    const opts = `<option value="all">Все темы</option>${diaryTopics.map(t => `<option value="${t.id}" ${String(filter) === String(t.id) ? 'selected' : ''}>${esc(t.short)}</option>`).join('')}`;
    return `<div class="diary-controls"><label class="search-label">Поиск<input id="diarySearch" type="search" value="${esc(query)}" placeholder="Слово или тема"></label><select id="diaryFilter" aria-label="Фильтр по теме">${opts}</select></div>
      <div class="diary-list" id="diaryList">${shown.length ? shown.map(entryHtml).join('') : `<p class="empty-state">${entries.length ? 'По этому фильтру записей нет.' : 'Записей пока нет. Первая займёт полминуты.'}</p>`}</div>`;
  }

  function render() {
    if (profileId !== active()) { profileId = active(); filter = 'all'; query = ''; loadDraft(); }
    const entries = data().journal;
    const focus = document.activeElement?.id;
    root.innerHTML = `<div class="dq-layout"><div class="dq-left">${formHtml()}</div><div class="dq-right">${summaryHtml(entries)}${listHtml(entries)}</div></div>`;
    if (focus === 'diarySearch') { const i = root.querySelector('#diarySearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }

  function reset() { editing = null; choice = blank(); }

  root.addEventListener('click', e => {
    const pick = e.target.closest('[data-pick]');
    if (pick) {
      const name = pick.dataset.pick, value = pick.dataset.value;
      if (name === 'topic') { const id = Number(value); if (choice.topic !== id) { choice.topic = id; choice.situation = null; choice.next = ''; } }
      else if (name === 'rating') choice.rating = Number(value);
      else if (name === 'helped' || name === 'blocked') {
        const list = choice[name];
        if (list.includes(value)) choice[name] = list.filter(x => x !== value);
        else if (list.length < MAX_FACTORS) choice[name] = [...list, value];
        else notify(`Можно выбрать до ${MAX_FACTORS} пунктов.`);
      } else choice[name] = choice[name] === value ? (name === 'situation' ? null : '') : value;
      choice.note = root.querySelector('[name=title]')?.value || choice.note;
      choice.date = root.querySelector('[name=date]')?.value || choice.date;
      saveDraft(); render();
      root.querySelector(`[data-pick="${name}"][data-value="${CSS.escape(value)}"]`)?.focus();
      return;
    }
    const topicFilter = e.target.closest('[data-filter-topic]');
    if (topicFilter) { filter = String(filter) === topicFilter.dataset.filterTopic ? 'all' : topicFilter.dataset.filterTopic; render(); return; }
    if (e.target.closest('[data-cancel]')) { reset(); clearDraft(); render(); return; }
    const del = e.target.closest('.delete-entry');
    if (del) { if (!confirm('Удалить эту запись?')) return; store.update(active(), d => { d.journal = d.journal.filter(x => x.id !== del.dataset.id); }); if (editing === del.dataset.id) reset(); render(); onChange(); return; }
    const edit = e.target.closest('.edit-entry');
    if (edit) {
      const entry = data().journal.find(x => x.id === edit.dataset.id); if (!entry) return;
      editing = entry.id;
      const q = entry.quick || {};
      choice = {topic: entry.topic || null, situation: q.situation || null, rating: Number(entry.rating) || 3, helped: q.helped || [], blocked: q.blocked || [], next: q.next || entry.action || '', note: q.note ?? (entry.quick ? '' : entry.title), date: entry.date};
      saveDraft(); render(); root.querySelector('.dq-form').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth', block: 'start'});
    }
  });
  root.addEventListener('input', e => {
    if (e.target.id === 'diarySearch') { query = e.target.value.toLowerCase().trim(); render(); }
    else if (e.target.name === 'title') { choice.note = e.target.value; saveDraft(); }
    else if (e.target.name === 'date') { choice.date = e.target.value; saveDraft(); }
  });
  root.addEventListener('change', e => { if (e.target.id === 'diaryFilter') { filter = e.target.value; render(); } });
  root.addEventListener('submit', e => {
    e.preventDefault();
    if (!(choice.topic && choice.situation && choice.rating)) { notify('Выберите тему, что произошло и как прошло.'); return; }
    if (choice.situation === 'Другое' && !choice.note.trim()) { notify('Для «Другое» добавьте заметку одной строкой.'); root.querySelector('[name=title]').focus(); return; }
    const existing = editing ? data().journal.find(x => x.id === editing) : undefined;
    store.journal(active(), composeEntry(choice, existing || {}));
    const wasEditing = Boolean(editing);
    reset(); clearDraft(); render(); onChange();
    notify(wasEditing ? 'Запись обновлена.' : 'Запись сохранена.');
  });

  return {render, reset: () => { profileId = null; render(); }};
}
