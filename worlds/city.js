/* ================================================================
   The city: one rainy block at dusk.
   Four buildings across the street, a cross street between the
   second and third running off to the horizon. Every song in the
   city is a thing on this block.
   ================================================================ */
(() => {
const BASE = 800;      // where buildings meet the sidewalk
const STREET = 860;    // where the sidewalk meets the wet street
const WARM = ['#f6d98a', '#f2bf6e', '#f9e2a8', '#eec27a'];
const rand = seeded(13);

/* ---- windows: painted dark in the still layer, lit live ---- */
const windows = [];
function rows(x0, cols, dx, ys, w, h, skip = []) {
  ys.forEach((y, r) => {
    for (let c = 0; c < cols; c++) {
      if (skip.includes(r + '-' + c)) continue;
      const tv = rand() < 0.06;
      windows.push({ x: x0 + c * dx, y, w, h, on: rand() < 0.62, level: 0, phase: rand() * 6.28,
                     tv, color: tv ? '#a9c8ee' : WARM[Math.floor(rand() * WARM.length)] });
    }
  });
}
rows(95, 3, 105, [300, 450], 68, 100, ['1-2']);            // brownstone (the dinner window takes 1-2)
rows(92, 1, 0, [662], 68, 96); rows(322, 1, 0, [662], 68, 96);
rows(482, 3, 95, [205, 320, 485], 60, 88);                 // apartment block
rows(985, 3, 92, [340, 450], 58, 84);                      // the bar's upstairs
rows(1312, 3, 85, [260, 375, 490], 56, 86);                // above the café
windows.push({ x: 596, y: 640, w: 130, h: 78, on: true, level: 0, phase: 0, color: '#f2bf6e' });
windows.push({ x: 980, y: 668, w: 150, h: 102, on: true, always: true, level: 0, phase: 0, color: '#d9964a', dim: 0.62 });
windows.push({ x: 1330, y: 692, w: 190, h: 98, on: true, always: true, level: 0, phase: 0, color: '#f6d08a', dim: 0.8 });
let nextFlip = 2;

const rRect = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };

function box(g, x, base, w, h, color) {
  g.fillStyle = color; g.fillRect(x, base - h, w, h);
  g.fillStyle = 'rgba(40,24,12,0.22)'; g.fillRect(x + w * 0.72, base - h, w * 0.28, h);
  g.fillStyle = 'rgba(240,226,190,0.7)'; g.fillRect(x + w * 0.33, base - h, w * 0.1, h);
  g.strokeStyle = 'rgba(30,20,14,0.55)'; g.lineWidth = 1.5; g.strokeRect(x, base - h, w, h);
}

WORLDS.city = {
  seed: 1989,
  streetY: STREET,
  mood: { rain: 0.55, dawn: 0, pink: 0, red: 0, lights: 0 },

  /* ---------- still layer 1: the sky ---------- */
  paintBack(b, g) {
    const sky = g.createLinearGradient(0, 0, 0, BASE);
    sky.addColorStop(0, '#1b1f45'); sky.addColorStop(0.45, '#393b76');
    sky.addColorStop(0.78, '#7b658f'); sky.addColorStop(1, '#d6977c');
    g.fillStyle = sky; g.fillRect(0, 0, WW, WH);
    for (let i = 0; i < 14; i++) b.blob(b.rr(0, WW), b.rr(40, 300), b.rr(90, 190), i % 2 ? '#55568f' : '#262957', 0.22, 3, 0.4);
    g.save(); g.fillStyle = '#fff6d8';
    for (let i = 0; i < 60; i++) { g.globalAlpha = b.rr(0.15, 0.6); circle(g, b.rr(0, WW), b.rr(0, 190), b.rr(0.5, 1.4)); g.fill(); }
    g.restore();
    b.grain(5000);
  },

  /* ---------- still layer 2: the block ---------- */
  paintFront(b, g) {
    // far end of the cross street
    [[768, 640, 36], [802, 690, 26], [826, 724, 16], [872, 716, 18], [888, 664, 24], [910, 618, 34]]
      .forEach(([x, top, w]) => {
        b.slab(x, top, w, BASE - top, '#2c2f5c', 1, 1.5);
        g.save(); g.fillStyle = '#f6d98a';
        for (let y = top + 8; y < BASE - 50; y += 11) for (let wx = x + 4; wx < x + w - 5; wx += 8) {
          if (b.rand() < 0.4) { g.globalAlpha = b.rr(0.3, 0.7); g.fillRect(wx, y, 3, 4); }
        }
        g.restore();
      });
    b.poly([[842, 752], [872, 752], [935, BASE + 4], [778, BASE + 4]], '#2b2e55', 1);

    const facade = (x0, x1, top, color, dark) => {
      const w = x1 - x0;
      b.slab(x0, top, w, BASE - top + 3, color, 1);
      g.save();
      g.beginPath(); g.rect(x0, top, w, BASE - top); g.clip();
      for (let i = 0; i < 9; i++) b.blob(b.rr(x0, x1), b.rr(top, BASE), b.rr(60, 130), i % 3 ? dark : '#ffffff', i % 3 ? 0.28 : 0.06, 2);
      g.restore();
      b.slab(x0 - 7, top - 12, w + 14, 17, dark, 1, 1.5);                      // cornice
      b.stroke([[x0, top], [x0, BASE]], '#15172e', 0.35, 2);
      b.stroke([[x1, top], [x1, BASE]], '#15172e', 0.35, 2);
    };
    facade(60, 430, 250, '#8a4e44', '#5e3230');       // brownstone
    facade(450, 760, 170, '#566190', '#39426e');      // apartment block
    facade(950, 1260, 300, '#2f5f58', '#1f423f');     // the bar
    facade(1280, 1560, 220, '#77588a', '#523c66');    // the café

    // window frames and dark glass
    for (const w of windows.concat([{ x: 292, y: 440, w: 118, h: 118 }])) {
      b.slab(w.x - 6, w.y - 6, w.w + 12, w.h + 12, '#e9dcc4', 0.32, 1, 0.5);
      b.slab(w.x, w.y, w.w, w.h, '#171a36', 1, 0.8, 0.4);
      b.slab(w.x - 8, w.y + w.h + 4, w.w + 16, 7, '#e9dcc4', 0.45, 1, 0.5);
    }

    // brownstone: door and stoop
    b.slab(198, 648, 84, 152, '#e9dcc4', 0.3, 1.5);
    b.slab(205, 655, 70, 145, '#47231f', 1, 1);
    b.slab(186, 790, 108, 12, '#b9a394', 1, 1.5);
    b.slab(176, 800, 128, 10, '#a08d82', 1, 1.5);

    // apartment block: fire escapes, door
    [413, 578].forEach(y => {
      b.stroke([[462, y], [750, y]], '#14162c', 0.85, 4);
      b.stroke([[462, y - 26], [750, y - 26]], '#14162c', 0.7, 2);
      for (let x = 462; x <= 750; x += 24) b.stroke([[x, y - 26], [x, y]], '#14162c', 0.6, 1.5);
    });
    b.stroke([[560, 578], [640, 413]], '#14162c', 0.75, 3);
    b.stroke([[572, 578], [652, 413]], '#14162c', 0.75, 3);
    b.slab(500, 668, 60, 132, '#262b4a', 1, 1);
    b.slab(494, 655, 72, 12, '#39426e', 1, 1);

    // the bar: fascia, door
    b.slab(968, 642, 230, 18, '#162f2c', 1, 1.5);
    b.slab(1142, 672, 44, 128, '#38261f', 1, 1);

    // the café: awning
    for (let i = 0; i < 11; i++) b.slab(1310 + i * 20.5, 642, 20.5, 36, i % 2 ? '#efe3cc' : '#b4423b', 1, 0.8, 0.4);
    for (let i = 0; i < 11; i++) { g.fillStyle = i % 2 ? '#efe3cc' : '#b4423b'; circle(g, 1320.2 + i * 20.5, 678, 10.2); g.fill(); }

    // sidewalk and street
    b.slab(-10, BASE, WW + 20, STREET - BASE + 4, '#65637a', 1, 2);
    b.slab(782, BASE - 2, 150, STREET - BASE + 6, '#2b2e55', 1, 2);
    b.slab(-10, STREET, WW + 20, WH - STREET + 10, '#22254a', 1, 2);
    for (let i = 0; i < 12; i++) b.blob(b.rr(0, WW), b.rr(STREET + 30, WH), b.rr(80, 180), i % 2 ? '#2f3362' : '#171a38', 0.3, 2, 0.35);
    b.stroke([[0, STREET], [782, STREET]], '#c9c6d6', 0.35, 2.5);
    b.stroke([[932, STREET], [WW, STREET]], '#c9c6d6', 0.35, 2.5);

    // a street tree
    b.stroke([[1271, 842], [1269, 700], [1262, 640]], '#1a1526', 0.9, 8);
    b.stroke([[1269, 720], [1296, 662], [1300, 622]], '#1a1526', 0.9, 4);
    b.stroke([[1268, 690], [1240, 640], [1232, 606]], '#1a1526', 0.9, 4);
    b.stroke([[1262, 640], [1268, 596]], '#1a1526', 0.9, 3);
    for (let i = 0; i < 9; i++) b.blob(b.rr(1222, 1310), b.rr(585, 660), b.rr(10, 20), i % 2 ? '#b8664a' : '#d29a4a', 0.55, 2);

    // night settles on everything painted so far
    g.save();
    g.globalCompositeOperation = 'source-atop';
    const night = g.createLinearGradient(0, 150, 0, WH);
    night.addColorStop(0, 'rgba(24,26,64,0.5)'); night.addColorStop(0.7, 'rgba(24,26,64,0.3)'); night.addColorStop(1, 'rgba(24,26,64,0.45)');
    g.fillStyle = night; g.fillRect(0, 0, WW, WH);
    g.restore();
    b.grain(7000);
  },

  /* ---------- live: what happens to the sky ---------- */
  between(g, t, m) {
    if (m.dawn < 0.01) return;
    const d = g.createLinearGradient(0, 0, 0, BASE);
    d.addColorStop(0, rgba('#8fb0e6', 0.35 * m.dawn));
    d.addColorStop(0.55, rgba('#ffc89a', 0.6 * m.dawn));
    d.addColorStop(1, rgba('#ffdc8a', 0.95 * m.dawn));
    g.fillStyle = d; g.fillRect(0, 0, WW, BASE);
  },

  /* ---------- live: lit windows ---------- */
  lights(g, t, m) {
    if (t > nextFlip) {
      const w = windows[Math.floor(Math.random() * windows.length)];
      if (!w.always) w.on = !w.on;
      nextFlip = t + 0.5 + Math.random() * 1.6;
    }
    for (const w of windows) {
      let target = w.on ? 1 : 0;
      if (m.lights > 0) target += (1 - target) * m.lights;
      else target *= 1 + m.lights * (w.always ? 0.45 : 1);
      w.level += (target - w.level) * 0.05;
      if (w.level < 0.02) continue;
      const fl = w.tv ? 0.72 + 0.28 * Math.sin(t * 9 + w.phase) * Math.sin(t * 2.3 + w.phase) : 1;
      const lv = w.level * (w.dim || 1);
      g.fillStyle = rgba(w.color, 0.11 * lv); g.fillRect(w.x - 8, w.y - 8, w.w + 16, w.h + 16);
      g.fillStyle = rgba(w.color, 0.9 * lv * fl); g.fillRect(w.x, w.y, w.w, w.h);
      g.strokeStyle = 'rgba(26,20,30,0.75)'; g.lineWidth = 2.5;
      g.beginPath();
      for (let x = w.x + (w.w > 100 ? w.w / 3 : w.w / 2); x < w.x + w.w - 4; x += (w.w > 100 ? w.w / 3 : w.w)) { g.moveTo(x, w.y); g.lineTo(x, w.y + w.h); }
      g.moveTo(w.x, w.y + w.h * 0.45); g.lineTo(w.x + w.w, w.y + w.h * 0.45);
      g.stroke();
    }
    // bottles along the bar window
    g.fillStyle = 'rgba(30,18,14,0.7)';
    for (let i = 0; i < 9; i++) { const x = 990 + i * 15.5, h = 20 + (i * 7) % 12; g.fillRect(x, 770 - h, 7, h); g.fillRect(x + 2, 770 - h - 8, 3, 8); }
  },

  /* ---------- the ten songs ---------- */
  items: [
    { song: 'cornelia-street', label: [850, 534], hit: [[768, 542, 156, 52], [752, 452, 84, 126], [760, 594, 26, 214]],
      mood: { lights: 0.2 },
      draw(g, t, a) {
        const flick = 0.78 + 0.06 * Math.sin(t * 9) + 0.22 * a;
        g.strokeStyle = '#121428'; g.lineWidth = 7; g.lineCap = 'round';
        g.beginPath(); g.moveTo(772, BASE + 8); g.lineTo(772, 506); g.quadraticCurveTo(772, 470, 806, 470); g.stroke();
        g.fillStyle = '#121428'; g.beginPath(); g.ellipse(812, 473, 19, 8, 0, 0, Math.PI * 2); g.fill();
        glow(g, 812, 488, 120 + 50 * a, '#ffd98a', 0.55 * flick);
        g.fillStyle = rgba('#fff1c4', 0.95); g.beginPath(); g.ellipse(812, 481, 12, 5, 0, 0, Math.PI * 2); g.fill();
        g.save();
        g.translate(776, 568);
        g.rotate(0.018 * Math.sin(t * 1.3) + a * 0.09 * Math.sin(t * 5));
        g.fillStyle = '#2f7a4f'; rRect(g, 0, -17, 142, 34, 4); g.fill();
        g.strokeStyle = '#eaf3e6'; g.lineWidth = 1.5; rRect(g, 3.5, -13.5, 135, 27, 3); g.stroke();
        g.fillStyle = '#ffffff'; g.font = '700 16px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('CORNELIA ST', 71, 1);
        g.restore();
      } },

    { song: 'how-you-get-the-girl', label: [240, 618], hit: [[172, 628, 138, 186]],
      mood: { rain: 1 },
      draw(g, t, a) {
        if (a > 0.01) {                                   // the door opens
          g.fillStyle = rgba('#ffd98a', 0.92 * a); g.fillRect(207, 657, 66, 143);
          g.fillStyle = rgba('#ffd98a', 0.2 * a);
          g.beginPath(); g.moveTo(207, 800); g.lineTo(273, 800); g.lineTo(340, STREET); g.lineTo(140, STREET); g.closePath(); g.fill();
          glow(g, 240, 730, 150, '#ffcf7a', 0.4 * a);
        }
        g.fillStyle = '#14162b';
        g.beginPath(); g.moveTo(224, 804); g.lineTo(223, 748); g.quadraticCurveTo(240, 732, 257, 748); g.lineTo(256, 804); g.closePath(); g.fill();
        circle(g, 240, 731, 10.5); g.fill();
        g.save();
        g.translate(244, 748);
        g.rotate(-0.05 + 0.03 * Math.sin(t * 1.1) - 0.2 * a);
        g.strokeStyle = '#14162b'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -64); g.stroke();
        g.fillStyle = '#c8453c';
        g.beginPath(); g.moveTo(-56, -58);
        g.quadraticCurveTo(-56, -104, 0, -104); g.quadraticCurveTo(56, -104, 56, -58);
        for (let i = 3; i >= 0; i--) g.quadraticCurveTo(-56 + i * 28 + 14, -70, -56 + i * 28, -58);
        g.closePath(); g.fill();
        g.strokeStyle = 'rgba(20,22,43,0.35)'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(0, -104); g.lineTo(-28, -58); g.moveTo(0, -104); g.lineTo(0, -58); g.moveTo(0, -104); g.lineTo(28, -58); g.stroke();
        g.restore();
      } },

    { song: 'i-look-in-peoples-windows', label: [351, 432], hit: [[286, 434, 130, 130]],
      mood: { lights: -0.88, rain: 0.35 },
      draw(g, t, a) {
        const x = 292, y = 440, w = 118, h = 118;
        const person = (cx, cy) => {
          circle(g, cx, cy, 10); g.fill();
          g.beginPath(); g.moveTo(cx - 17, y + 93); g.quadraticCurveTo(cx - 17, cy + 12, cx, cy + 12);
          g.quadraticCurveTo(cx + 17, cy + 12, cx + 17, y + 93); g.closePath(); g.fill();
        };
        glow(g, x + w / 2, y + h / 2, 130 + 80 * a, '#ffd27a', 0.22 + 0.4 * a);
        g.fillStyle = rgba('#f8d684', 0.8 + 0.2 * a + 0.025 * Math.sin(t * 7)); g.fillRect(x, y, w, h);
        g.fillStyle = 'rgba(42,26,22,0.85)';
        g.fillRect(x + 58, y, 2.5, 20);
        g.beginPath(); g.moveTo(x + 47, y + 32); g.lineTo(x + 72, y + 32); g.lineTo(x + 65, y + 19); g.lineTo(x + 54, y + 19); g.closePath(); g.fill();
        const lean = 1.5 * Math.sin(t * 0.8) + 5 * a;
        person(x + 32 + lean * 0.5, y + 60);
        person(x + 88 - lean, y + 62);
        g.fillRect(x + 12, y + 92, 94, 6);
        g.strokeStyle = 'rgba(26,20,30,0.85)'; g.lineWidth = 3;
        g.strokeRect(x, y, w, h);
        g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke();
      } },

    { song: 'maroon', label: [362, 158], hit: [[304, 162, 124, 96]],
      mood: { red: 0.75, rain: 0.4 },
      draw(g, t, a) {
        const by = 239;
        const len = 16 + 150 * a;
        g.fillStyle = rgba('#7a1830', 0.9);
        rRect(g, 388, by + 2, 7, len, 3.5); g.fill();
        rRect(g, 400, by + 2, 5, len * 0.55, 2.5); g.fill();
        g.beginPath(); g.ellipse(392, by + 1, 24, 4.5, 0, 0, Math.PI * 2); g.fill();
        glow(g, 362, by - 30, 90, '#d23a58', 0.3 * a);
        g.fillStyle = '#1d3a2b'; rRect(g, 322, by - 54, 21, 54, 4); g.fill();
        g.fillRect(328.5, by - 76, 8, 24);
        g.fillStyle = '#e8dcc0'; g.fillRect(324, by - 36, 17, 15);
        g.save();
        g.translate(372, by);
        g.rotate(0.55 * a + 0.02 * Math.sin(t * 1.7));
        g.fillStyle = 'rgba(232,238,245,0.3)';
        g.beginPath(); g.moveTo(-13, -50); g.lineTo(13, -50); g.quadraticCurveTo(13, -26, 0, -24); g.quadraticCurveTo(-13, -26, -13, -50); g.closePath(); g.fill();
        g.fillStyle = '#8a1f33';
        g.beginPath(); g.moveTo(-12, -39); g.lineTo(12, -39); g.quadraticCurveTo(11, -27, 0, -25); g.quadraticCurveTo(-11, -27, -12, -39); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(232,238,245,0.85)'; g.lineWidth = 1.8; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-13, -50); g.quadraticCurveTo(-13, -26, 0, -24); g.quadraticCurveTo(13, -26, 13, -50);
        g.moveTo(0, -24); g.lineTo(0, -2); g.moveTo(-10, -1); g.lineTo(10, -1); g.stroke();
        g.restore();
      } },

    { song: 'lover', label: [606, 412], hit: [[455, 418, 302, 60]],
      mood: { lights: 0.4, rain: 0.3 },
      draw(g, t, a) {
        const cols = ['#ffd76a', '#ff8fa3', '#8fe0c0', '#9fb8ff', '#ffb36a'];
        const sag = 34;
        g.strokeStyle = 'rgba(14,15,34,0.9)'; g.lineWidth = 1.6;
        g.beginPath();
        [[462, 606], [606, 750]].forEach(([x0, x1]) => { g.moveTo(x0, 424); g.quadraticCurveTo((x0 + x1) / 2, 424 + sag * 2, x1, 424); });
        g.stroke();
        let i = 0;
        for (const [x0, x1] of [[462, 606], [606, 750]]) for (const u of [0.1, 0.3, 0.5, 0.7, 0.9]) {
          const x = x0 + (x1 - x0) * u, y = 424 + sag * 4 * u * (1 - u) + 6;
          const br = Math.min(1, 0.55 + 0.25 * Math.sin(t * 2 + i * 1.7) + a * (0.3 + 0.45 * Math.max(0, Math.sin(t * 6 - i * 0.8))));
          glow(g, x, y, 20 + 22 * a, cols[i % 5], 0.55 * br);
          g.fillStyle = rgba(cols[i % 5], 0.35 + 0.65 * br);
          g.beginPath(); g.ellipse(x, y, 4.5, 6.5, 0, 0, Math.PI * 2); g.fill();
          i++;
        }
      } },

    { song: 'welcome-to-new-york', label: [700, 708], hit: [[612, 716, 176, 126]],
      mood: { lights: 1, rain: 0.25 },
      draw(g, t, a) {
        box(g, 622, 838, 94, 62, '#a97c4c');
        box(g, 724, 838, 58, 44, '#b98c58');
        const hop = -8 * a * Math.abs(Math.sin(t * 5));
        const flap = 0.35 + 0.5 * a * (0.5 + 0.5 * Math.sin(t * 5));
        g.save(); g.translate(0, hop);
        g.fillStyle = '#4f8a5a';                                      // a houseplant riding in the top box
        [[-0.5, 30], [0.05, 38], [0.6, 28]].forEach(([r, l]) => {
          g.save(); g.translate(670, 736); g.rotate(r + 0.05 * Math.sin(t * 1.4 + r));
          g.beginPath(); g.ellipse(0, -l / 2, 6.5, l / 2, 0, 0, Math.PI * 2); g.fill(); g.restore();
        });
        box(g, 640, 776, 62, 42, '#c49a66');
        g.fillStyle = '#d4ad7c'; g.strokeStyle = 'rgba(30,20,14,0.55)'; g.lineWidth = 1.5;
        [[640, -1], [702, 1]].forEach(([px, dir]) => {
          g.save(); g.translate(px, 734); g.rotate(dir * (-flap - 0.5));
          g.beginPath(); g.rect(dir > 0 ? 0 : -26, -5, 26, 5); g.fill(); g.stroke(); g.restore();
        });
        g.restore();
      } },

    { song: 'holy-ground', label: [1405, 736], hit: [[1334, 744, 146, 100]],
      mood: { rain: 0.18, lights: 0.15 },
      draw(g, t, a) {
        g.strokeStyle = '#14162b'; g.lineWidth = 3.5; g.lineCap = 'round';
        g.beginPath();
        g.moveTo(1405, 794); g.lineTo(1405, 840); g.moveTo(1390, 841); g.lineTo(1420, 841);           // table
        g.moveTo(1346, 770); g.lineTo(1348, 840); g.moveTo(1348, 810); g.lineTo(1372, 810); g.lineTo(1373, 840);   // chairs
        g.moveTo(1464, 770); g.lineTo(1462, 840); g.moveTo(1462, 810); g.lineTo(1438, 810); g.lineTo(1437, 840);
        g.stroke();
        g.fillStyle = '#23263f'; g.beginPath(); g.ellipse(1405, 793, 38, 6.5, 0, 0, Math.PI * 2); g.fill();
        glow(g, 1405, 780, 60 + 30 * a, '#ffd98a', 0.18 + 0.3 * a);
        [1391, 1419].forEach((x, i) => {
          g.fillStyle = '#f4ede0'; rRect(g, x - 7, 778, 14, 12, 2.5); g.fill();
          g.strokeStyle = rgba('#f4ede0', 0.25 + 0.55 * a); g.lineWidth = 1.6;
          const hgt = 22 + 26 * a;
          g.beginPath();
          for (let k = 0; k <= 10; k++) {
            const y = 774 - hgt * k / 10, sx = x + 4 * Math.sin(k * 0.9 + t * 2.2 + i * 2) * (k / 10);
            k ? g.lineTo(sx, y) : g.moveTo(sx, y);
          }
          g.stroke();
        });
      } },

    { song: 'delicate', label: [1056, 548], hit: [[1000, 554, 112, 92]],
      mood: { rain: 0.32, lights: -0.45 },
      draw(g, t, a, m, K) {
        const stutter = Math.sin(t * 13) + Math.sin(t * 7.3) > 1.55 ? 0.3 : 1;      // a tube that isn't quite right
        const br = 0.78 * stutter + (1 - 0.78 * stutter) * a;
        glow(g, 1056, 600, 130 + 40 * a, '#ff6fae', 0.2 * br + 0.2 * a);
        glow(g, 1056, 830, 170, '#ff6fae', 0.08 + 0.2 * a);
        g.save();
        g.lineCap = 'round'; g.lineJoin = 'round';
        const tube = (color, core, path) => {
          g.shadowColor = color; g.shadowBlur = 20 * K;
          g.strokeStyle = rgba(color, br); g.lineWidth = 5; g.beginPath(); path(); g.stroke();
          g.shadowBlur = 0;
          g.strokeStyle = rgba(core, 0.85 * br); g.lineWidth = 1.6; g.beginPath(); path(); g.stroke();
        };
        tube('#ff5aa5', '#ffe0ee', () => {
          g.moveTo(1022, 566); g.lineTo(1090, 566); g.lineTo(1056, 606); g.closePath();
          g.moveTo(1056, 606); g.lineTo(1056, 636); g.moveTo(1036, 637); g.lineTo(1076, 637);
        });
        tube('#6fcbff', '#e6f6ff', () => { g.moveTo(1040, 556); g.lineTo(1066, 584); g.moveTo(1079, 580); g.arc(1072, 580, 7, 0, Math.PI * 2); });
        g.restore();
      } },

    { song: 'cruel-summer', label: [1224, 676], hit: [[1186, 682, 76, 132]],
      mood: { pink: 0.85, rain: 0, lights: 0.25 },
      draw(g, t, a) {
        const x = 1196, y = 690, w = 56, h = 116;
        const p = Math.min(1, 0.68 + 0.12 * Math.sin(t * 2.2) + 0.3 * a * (0.6 + 0.4 * Math.sin(t * 8)));
        glow(g, x + w / 2, y + 46, 95 + 70 * a, '#ff7fb8', 0.25 + 0.35 * a);
        glow(g, x + w / 2, 838, 120, '#7fd6ff', 0.1 + 0.18 * a);
        g.fillStyle = '#19203c'; rRect(g, x, y, w, h, 5); g.fill();
        const gr = g.createLinearGradient(0, y + 8, 0, y + 80);
        gr.addColorStop(0, rgba('#ff7fb8', p)); gr.addColorStop(1, rgba('#7fd6ff', p));
        g.fillStyle = gr; rRect(g, x + 6, y + 8, w - 12, 72, 3); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.6)';
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.fillRect(x + 10 + c * 10, y + 13 + r * 17, 6, 10);
        g.fillStyle = '#0b1024'; g.fillRect(x + 10, y + 90, w - 20, 12);
      } },

    { song: 'daylight', behind: true, label: [857, 612], hit: [[790, 596, 140, 206]],
      mood: { dawn: 1, rain: 0, lights: -0.75 },
      draw(g, t, a) {
        const y = 776 - 132 * a;
        glow(g, 857, y, 110 + 330 * a, '#ffd27a', 0.4 + 0.55 * a);
        g.fillStyle = rgba('#fff0b8', 0.6 + 0.4 * a);
        circle(g, 857, y, 20 + 9 * a); g.fill();
      } }
  ]
};
})();
