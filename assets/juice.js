// «Тактильный» слой игр: мягкие синтезированные звуки (без файлов), лёгкая вибрация,
// круги от нажатий, частицы и плавные переходы чисел. Всё уважает prefers-reduced-motion и выключатель звука.
const PREF = 'almanac:sound';
let ctx = null, master = null;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const enabled = () => { try { return localStorage.getItem(PREF) !== 'off'; } catch { return true; } };

function ac() {
  if (typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) return null;
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = .35;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    master.connect(lp); lp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
// One soft voice: sine/triangle with a quick attack and a long, gentle tail.
function tone(freq, {type = 'sine', dur = .18, vol = .25, delay = 0, slide = 0} = {}) {
  const c = ac(); if (!c || !enabled()) return;
  const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
}
// Filtered noise: paper rustle, soft "whoosh" between days and rounds.
function rustle({dur = .22, vol = .12, from = 900, to = 2600, delay = 0} = {}) {
  const c = ac(); if (!c || !enabled()) return;
  const t = c.currentTime + delay, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t);
}
const buzz = ms => { try { if (enabled() && navigator.vibrate) navigator.vibrate(ms); } catch {} };
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

export const sfx = {
  on: enabled,
  toggle() { try { localStorage.setItem(PREF, enabled() ? 'off' : 'on'); } catch {} },
  tap() { tone(1800, {type: 'sine', dur: .045, vol: .09}); tone(900, {type: 'triangle', dur: .06, vol: .06}); buzz(6); },
  pick() { tone(660, {type: 'triangle', dur: .12, vol: .14, slide: 1.25}); buzz(8); },
  place() { tone(196, {type: 'sine', dur: .16, vol: .22, slide: .8}); rustle({dur: .08, vol: .05, from: 2400, to: 1200}); buzz(10); },
  step() { rustle({dur: .35, vol: .1}); tone(392, {dur: .3, vol: .07, delay: .05}); },
  good() { [0, 2, 4].forEach((k, i) => tone(PENTA[k], {type: 'sine', dur: .5, vol: .12, delay: i * .06})); buzz(12); },
  bad() { tone(220, {type: 'triangle', dur: .28, vol: .16, slide: .7}); buzz([10, 40, 10]); },
  event() { tone(587, {dur: .5, vol: .1}); tone(880, {dur: .7, vol: .07, delay: .12}); },
  star(i = 0) { tone(PENTA[i * 2] * 1.5, {dur: .9, vol: .12}); tone(PENTA[i * 2] * 3, {dur: .5, vol: .04}); buzz(14); },
  win() { [0, 2, 4, 5].forEach((k, i) => tone(PENTA[k], {dur: 1.1, vol: .1, delay: i * .09})); }
};

// Visual feedback. Elements live in a fixed overlay, so they survive board re-renders.
let layer = null;
function overlay() { if (!layer || !layer.isConnected) { layer = document.createElement('div'); layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true'); document.body.append(layer); } return layer; }
export function ripple(x, y) {
  if (reduced()) return;
  const r = document.createElement('span'); r.className = 'fx-ripple'; r.style.left = x + 'px'; r.style.top = y + 'px';
  overlay().append(r); setTimeout(() => r.remove(), 650);
}
export function burst(x, y, {n = 14, color = 'var(--accent)'} = {}) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'), a = Math.PI * 2 * i / n + Math.random() * .4, d = 34 + Math.random() * 46;
    p.className = 'fx-dot'; p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = color;
    p.style.setProperty('--dx', `${Math.cos(a) * d}px`); p.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    overlay().append(p); setTimeout(() => p.remove(), 900);
  }
}
export function floatText(x, y, text) {
  const t = document.createElement('span'); t.className = 'fx-float'; t.textContent = text; t.style.left = x + 'px'; t.style.top = y + 'px';
  overlay().append(t); setTimeout(() => t.remove(), 1400);
}
// Re-rendered boards lose CSS transitions; replay bar widths and number changes from their previous values.
export function animateFrom(root, prev) {
  const bars = [...root.querySelectorAll('.g-bar>i, .g-meter>i, .bar>i')], nums = [...root.querySelectorAll('.g-stat b')];
  const next = {bars: bars.map(b => b.style.width), nums: nums.map(n => n.textContent)};
  if (prev && !reduced()) {
    bars.forEach((b, i) => { if (prev.bars[i] !== undefined && prev.bars[i] !== next.bars[i]) { b.style.transition = 'none'; b.style.width = prev.bars[i]; b.getBoundingClientRect(); b.style.transition = ''; b.style.width = next.bars[i]; } });
    nums.forEach((n, i) => { if (prev.nums[i] !== undefined && prev.nums[i] !== next.nums[i]) { n.classList.remove('fx-tick'); n.getBoundingClientRect(); n.classList.add('fx-tick'); } });
  }
  return next;
}
