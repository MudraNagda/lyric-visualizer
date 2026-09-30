/* ================================================================
   World kit: the stage a world's scene is performed on.

   A world is { mood, streetY, paintBack, paintFront, between, lights,
   items }. The stage paints its two still layers once, then every
   frame draws: back → behind-items → front → lights → items →
   street reflection → rain → colour of the mood → titles.

   Each item is one song: { song, label, hit, mood, behind, draw }.
   Hovering (or selecting) an item eases its activation `a` to 1 and
   pulls the whole scene's mood toward the item's own.
   ================================================================ */
const WORLDS = {};
const WW = 1600, WH = 1100;

function seeded(a) {
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgbCache = {};
function rgba(hex, a) {
  const c = rgbCache[hex] || (rgbCache[hex] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(','));
  return `rgba(${c},${Math.max(0, Math.min(1, a))})`;
}

/* soft light: a radial glow that adds to whatever is under it */
function glow(g, x, y, r, color, alpha) {
  if (alpha <= 0.005 || r <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(color, alpha));
  gr.addColorStop(1, rgba(color, 0));
  g.save();
  g.globalCompositeOperation = 'screen';
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

/* the watercolor brush set, for painting still layers */
function makeBrush(g, rand, K) {
  const rr = (a, b) => a + rand() * (b - a);
  function blob(cx, cy, r, color, alpha, layers = 3, squishY = 1) {
    for (let L = 0; L < layers; L++) {
      const rad = r * (1 - L * 0.16);
      const n = 14, pts = [];
      const phase = rand() * Math.PI * 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const wob = 1 + 0.22 * Math.sin(a * 3 + phase) * rand() + 0.12 * Math.sin(a * 7 + phase * 2);
        pts.push([cx + Math.cos(a) * rad * wob, cy + Math.sin(a) * rad * wob * squishY]);
      }
      g.save();
      g.globalAlpha = alpha * (0.5 + L * 0.18);
      g.fillStyle = color;
      g.filter = `blur(${Math.max(1, rad * 0.10) * K}px)`;
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n];
        g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      g.closePath();
      g.fill();
      g.restore();
    }
  }
  /* a rectangle whose edges wander a little, like a loaded brush */
  function slab(x, y, w, h, color, alpha = 1, j = 2.5, blur = 0.8) {
    const pts = [];
    const edge = (x1, y1, x2, y2) => {
      const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 70));
      for (let i = 0; i < n; i++) pts.push([x1 + (x2 - x1) * i / n + rr(-j, j), y1 + (y2 - y1) * i / n + rr(-j, j)]);
    };
    edge(x, y, x + w, y); edge(x + w, y, x + w, y + h); edge(x + w, y + h, x, y + h); edge(x, y + h, x, y);
    g.save();
    g.globalAlpha = alpha; g.fillStyle = color;
    if (blur) g.filter = `blur(${blur * K}px)`;
    g.beginPath();
    pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.closePath(); g.fill();
    g.restore();
  }
  function poly(pts, color, alpha = 1, blur = 0.8) {
    g.save();
    g.globalAlpha = alpha; g.fillStyle = color;
    if (blur) g.filter = `blur(${blur * K}px)`;
    g.beginPath();
    pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.closePath(); g.fill();
    g.restore();
  }
  function stroke(pts, color, alpha, width) {
    g.save();
    g.globalAlpha = alpha; g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.stroke();
    g.restore();
  }
  function grain(n = 9000) {
    g.save();
    for (let i = 0; i < n; i++) {
      g.globalAlpha = rr(0.02, 0.06);
      g.fillStyle = rand() < 0.5 ? '#1a1a2a' : '#ffffff';
      g.fillRect(rr(0, WW), rr(0, WH), rr(0.6, 1.8), rr(0.6, 1.8));
    }
    g.restore();
  }
  return { g, K, rand, rr, blob, slab, poly, stroke, grain };
}

class WorldStage {
  /* opts: pick(songId), title(songId) */
  constructor(canvas, opts) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.opts = opts;
    this.world = null;
    this.mouseId = this.hotId = this.selId = null;
    this.raf = 0;
    canvas.addEventListener('mousemove', e => {
      this.mouseId = this.hit(e);
      canvas.style.cursor = this.mouseId ? 'pointer' : 'default';
    });
    canvas.addEventListener('mouseleave', () => { this.mouseId = null; });
    canvas.addEventListener('click', e => { const id = this.hit(e); if (id) opts.pick(id); });
  }

  hit(e) {
    if (!this.world) return null;
    const r = this.cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * WW, y = (e.clientY - r.top) / r.height * WH;
    for (const it of this.world.items) {
      for (const [hx, hy, hw, hh] of it.hit) if (x >= hx && x <= hx + hw && y >= hy && y <= hy + hh) return it.song;
    }
    return null;
  }
  hot(id) { this.hotId = id; }
  select(id) { this.selId = id; }

  show(world) {
    clearTimeout(this.stopTimer);
    if (!world) {
      if (this.world) this.stopTimer = setTimeout(() => { cancelAnimationFrame(this.raf); this.raf = 0; this.world = null; }, 900);
      return;
    }
    if (world === this.world) return;
    this.world = world;
    this.K = Math.max(1, Math.min(1.5, this.cv.clientWidth * (window.devicePixelRatio || 1) / WW));
    this.cv.width = WW * this.K; this.cv.height = WH * this.K;
    if (!world.layers) {
      world.layers = ['paintBack', 'paintFront'].map((fn, i) => {
        const c = document.createElement('canvas');
        c.width = WW * 1.5; c.height = WH * 1.5;
        const g = c.getContext('2d');
        g.scale(1.5, 1.5);
        world[fn](makeBrush(g, seeded(world.seed + i), 1.5), g);
        return c;
      });
    }
    this.mood = { ...world.mood };
    for (const it of world.items) it.a = 0;
    this.drops = Array.from({ length: 340 }, () => ({ x: Math.random() * (WW + 200), y: Math.random() * WH, l: 14 + Math.random() * 22, v: 900 + Math.random() * 700 }));
    this.ripples = [];
    this.t0 = this.last = performance.now();
    this.mouseId = null;
    if (!this.raf) this.raf = requestAnimationFrame(n => this.frame(n));
  }

  frame(now) {
    const w = this.world, g = this.g, K = this.K, m = this.mood;
    const t = (now - this.t0) / 1000, dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
    this.last = now;

    const focus = this.mouseId || this.hotId || this.selId;
    const target = { ...w.mood, ...((w.items.find(i => i.song === focus) || {}).mood || {}) };
    for (const k in m) m[k] += (target[k] - m[k]) * 0.05;
    for (const it of w.items) it.a += ((it.song === focus ? 1 : 0) - it.a) * 0.08;

    g.setTransform(K, 0, 0, K, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(w.layers[0], 0, 0, WW, WH);
    w.between(g, t, m);
    for (const it of w.items) if (it.behind) it.draw(g, t, it.a, m, K);
    g.drawImage(w.layers[1], 0, 0, WW, WH);
    w.lights(g, t, m);
    for (const it of w.items) if (!it.behind) it.draw(g, t, it.a, m, K);

    // the wet street mirrors everything standing above it
    const Y = w.streetY, h = WH - Y;
    g.save();
    g.translate(0, Y); g.scale(1, -1);
    g.globalAlpha = 0.34;
    g.drawImage(this.cv, 0, (Y - h) * K, WW * K, h * K, 0, -h, WW, h);
    g.restore();
    const fade = g.createLinearGradient(0, Y, 0, WH);
    fade.addColorStop(0, 'rgba(20,22,48,0)'); fade.addColorStop(1, 'rgba(20,22,48,0.55)');
    g.fillStyle = fade; g.fillRect(0, Y, WW, h);

    // rain, and the rings it leaves on the street
    const n = Math.floor(this.drops.length * m.rain);
    g.save();
    g.strokeStyle = 'rgba(214,226,255,0.3)'; g.lineWidth = 1.3; g.lineCap = 'round';
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const d = this.drops[i];
      d.y += d.v * dt; d.x -= d.v * dt * 0.14;
      if (d.y > WH) { d.y = -30; d.x = Math.random() * (WW + 200); }
      g.moveTo(d.x, d.y); g.lineTo(d.x - d.l * 0.14, d.y + d.l);
    }
    g.stroke();
    if (Math.random() < m.rain * 0.7) this.ripples.push({ x: Math.random() * WW, y: Y + 10 + Math.random() * (h - 20), age: 0 });
    this.ripples = this.ripples.filter(r => (r.age += dt) < 0.9);
    for (const r of this.ripples) {
      g.strokeStyle = rgba('#d6e2ff', 0.35 * (1 - r.age / 0.9));
      g.beginPath(); g.ellipse(r.x, r.y, 4 + r.age * 26, 1.2 + r.age * 7, 0, 0, Math.PI * 2); g.stroke();
    }
    g.restore();

    // the colour of the mood
    g.save();
    g.globalCompositeOperation = 'soft-light';
    if (m.dawn > 0.01) { g.fillStyle = rgba('#ffbe6e', 0.7 * m.dawn); g.fillRect(0, 0, WW, WH); }
    if (m.pink > 0.01) { g.fillStyle = rgba('#ff50aa', 0.55 * m.pink); g.fillRect(0, 0, WW, WH); }
    if (m.red > 0.01) { g.fillStyle = rgba('#96142f', 0.8 * m.red); g.fillRect(0, 0, WW, WH); }
    g.restore();
    const vg = g.createRadialGradient(WW / 2, WH * 0.55, WH * 0.45, WW / 2, WH * 0.55, WW * 0.72);
    vg.addColorStop(0, 'rgba(12,13,32,0)'); vg.addColorStop(1, 'rgba(12,13,32,0.5)');
    g.fillStyle = vg; g.fillRect(0, 0, WW, WH);

    // titles: all of them on arrival, then only the one in focus
    const intro = Math.max(0, Math.min(1, (t - 1) / 0.8)) * Math.max(0, Math.min(1, 1 - (t - 6) / 1.5));
    g.save();
    g.font = '600 32px Caveat, cursive';
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    for (const it of w.items) {
      const a = Math.max(intro, it.a);
      if (a < 0.02) continue;
      const title = this.opts.title(it.song);
      g.globalAlpha = a;
      g.strokeStyle = 'rgba(16,17,40,0.75)'; g.lineWidth = 6;
      g.strokeText(title, it.label[0], it.label[1]);
      g.fillStyle = '#fbf3dc';
      g.fillText(title, it.label[0], it.label[1]);
    }
    g.restore();

    this.raf = requestAnimationFrame(n2 => this.frame(n2));
  }
}
