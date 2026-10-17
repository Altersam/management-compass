// Shared UI helpers: escaping, icons, stars, toast, local progress.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const paths = {
  book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  game:'<rect x="2.5" y="7" width="19" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="15.5" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
  help:'<circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/>',
  home:'<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',
  star:'<path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor" stroke="none"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check:'<path d="m5 12.5 4.2 4.2L19 7"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  dot:'<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  clock:'<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>',
  target:'<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 20a6.5 6.5 0 0 0-3-5.5"/>',
  scale:'<path d="M12 3v18M5 21h14M4 7h16"/><path d="m4 7-2.5 6a3 3 0 0 0 5 0zM20 7l-2.5 6a3 3 0 0 0 5 0z"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  link:'<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 13 4.5a4 4 0 0 1 6.5 6.5L17.5 13M13 17.5 11 19.5a4 4 0 0 1-6.5-6.5L6.5 11"/>',
  doc:'<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5v4h4M9 12h6M9 15.5h6M9 9h3"/>',
  flow:'<rect x="2.5" y="9" width="5" height="6" rx="1.5"/><rect x="9.5" y="9" width="5" height="6" rx="1.5"/><rect x="16.5" y="9" width="5" height="6" rx="1.5"/><path d="M7.5 12h2M14.5 12h2"/>',
  rocket:'<path d="M12 15c-2-2-3-5-1.5-9.5C12 2 16 2 19.5 1.5c-.5 3.5-.5 7.5-4 9C11 12 12 15 12 15z"/><path d="M9.5 12.5 6 13l-2.5 3.5 4.5.5M11.5 14.5 11 18l-3.5 2.5-.5-4.5"/><circle cx="15" cy="7" r="1.5"/>',
  chart:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-7"/>',
  play:'<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  replay:'<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 3.5v5h5"/>',
  quote:'<path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  heart:'<path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 4 4 7.3 4 9.6 4 11 5.4 12 7c1-1.6 2.4-3 4.7-3C20 4 22.4 7.3 21.2 10.7 19.5 15.4 12 20 12 20z"/>',
  bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lock:'<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  coin:'<circle cx="12" cy="12" r="9.5"/><path d="M14.5 8.5h-3.5a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9.5M12 6.5v11"/>',
  calendar:'<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  shield:'<path d="M12 2.5 4 5.5v6c0 5 3.5 8.7 8 10 4.5-1.3 8-5 8-10v-6z"/>',
  map:'<path d="m3 6 6-2.5 6 2.5 6-2.5v14.5L15 21l-6-2.5L3 21z"/><path d="M9 3.5v15M15 6v15"/>',
  bag:'<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 12.5h18"/>',
  sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>'
};
export const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.dot}</svg>`;
export const stars = (n, total = 3) => `<span class="stars" role="img" aria-label="${n} из ${total} звёзд">${Array.from({length: total}, (_, i) => icon('star', i < n ? 'on' : '')).join('')}</span>`;

export const logoMark = `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#6c47ff"/><path d="M20 7 25 20 20 33 15 20z" fill="#ffc53d"/><path d="M20 7 25 20H15z" fill="#fff"/><circle cx="20" cy="20" r="2.6" fill="#1e1b3a"/></svg>`;

let toastTimer;
export function toast(text) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = text; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// Local progress: game stars and answered quiz questions. Nothing else is stored.
const KEY = 'almanac:v5';
function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function write(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }
export const progress = {
  all: read,
  stars(id) { return read().games?.[id]?.stars || 0; },
  total() { return Object.values(read().games || {}).reduce((n, g) => n + (g.stars || 0), 0); },
  saveGame(id, stars) {
    const d = read(); d.games ??= {}; const g = d.games[id] ??= {stars: 0, plays: 0};
    g.plays++; g.stars = Math.max(g.stars, stars); write(d); return g;
  },
  quiz(key, ok) { const d = read(); d.quiz ??= {}; if (ok) d.quiz[key] = true; write(d); },
  quizDone(prefix) { return Object.keys(read().quiz || {}).filter(k => k.startsWith(prefix)).length; }
};
