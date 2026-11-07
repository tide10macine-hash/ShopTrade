/* Makho – Grafik: Hintergrund, Partikel-Kugel mit Zuständen, Globus. Alles auf Canvas. */
(function (root) {
  "use strict";
  const reduce = root.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = () => Math.min(2, root.devicePixelRatio || 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);

  function fit(c) {
    const r = c.getBoundingClientRect(), d = DPR();
    const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return d;
  }

  /* ================= Bühne (Hintergrund + Kugel) ================= */
  const FX = {
    mode: "sleep", speech: 0, mic: 0, slot: null, bursts: [], t0: 0,
    setMode(m) { if (m !== this.mode) { this.mode = m; this.modeAt = performance.now(); } },
    burst(strength = 1) { this.bursts.push({ t: performance.now(), s: strength }); },
    modeAt: 0
  };
  let cv, g, PTS = [], DUST = [];
  const orb = { x: 0, y: 0, r: 0, glow: 0, ready: false };
  let speechSm = 0, micSm = 0, wakeAmt = 0;

  function initPoints() {
    const N = 1100;
    PTS = [];
    for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996; PTS.push([Math.cos(th) * r, y, Math.sin(th) * r, Math.random() * 6.283, 0.6 + Math.random() * 0.8]); }
    DUST = [];
    for (let i = 0; i < 70; i++) DUST.push([Math.random(), Math.random(), 0.2 + Math.random() * 0.8, Math.random() * 6.28]);
  }

  function slotRect() {
    const el = FX.slot; if (!el) return null;
    const r = el.getBoundingClientRect(); if (!r.width) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.min(r.width, r.height) / 2 };
  }

  function drawBackground(t, W, H, d) {
    g.clearRect(0, 0, W, H);
    const bg = g.createRadialGradient(orb.x * d, orb.y * d, 0, orb.x * d, orb.y * d, Math.max(W, H) * 0.9);
    bg.addColorStop(0, `rgba(255,80,30,${0.07 + wakeAmt * 0.07 + speechSm * 0.05})`); bg.addColorStop(1, "rgba(10,6,5,0)");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // feines Raster mit Lauflinie
    if (wakeAmt > 0.01) {
      g.strokeStyle = `rgba(255,122,64,${0.045 * wakeAmt})`; g.lineWidth = d;
      const step = 34 * d, off = reduce ? 0 : ((t / 60) % step);
      g.beginPath();
      for (let x = -step + off; x < W; x += step) { g.moveTo(x, 0); g.lineTo(x, H); }
      for (let y = -step + off; y < H; y += step) { g.moveTo(0, y); g.lineTo(W, y); }
      g.stroke();
      const sy = reduce ? H * 0.3 : ((t / 9) % (H + 200 * d)) - 100 * d;
      const sl = g.createLinearGradient(0, sy - 60 * d, 0, sy + 60 * d);
      sl.addColorStop(0, "rgba(255,122,64,0)"); sl.addColorStop(0.5, `rgba(255,122,64,${0.05 * wakeAmt})`); sl.addColorStop(1, "rgba(255,122,64,0)");
      g.fillStyle = sl; g.fillRect(0, sy - 60 * d, W, 120 * d);
    }
    // Staub
    for (const p of DUST) {
      if (!reduce) { p[1] -= 0.00012 * p[2]; if (p[1] < -0.02) { p[1] = 1.02; p[0] = Math.random(); } }
      const a = (0.08 + 0.18 * p[2]) * (0.4 + wakeAmt * 0.6) * (0.6 + 0.4 * Math.sin(t / 900 + p[3]));
      g.fillStyle = `rgba(255,150,90,${a})`; g.fillRect(p[0] * W, p[1] * H, 1.4 * d * p[2], 1.4 * d * p[2]);
    }
  }

  function drawOrb(t, d) {
    const cx = orb.x * d, cy = orb.y * d, R = orb.r * d * 0.62;
    if (R < 2) return;
    const since = (t - FX.modeAt) / 1000;
    const m = FX.mode;
    const dim = m === "sleep" ? 0.5 + 0.12 * Math.sin(t / 1400) : 1;
    const spin = reduce ? 0 : t / (m === "think" ? 1500 : 4200);
    const ca = Math.cos(spin), sa = Math.sin(spin), ct = Math.cos(0.38), st = Math.sin(0.38);
    let amp = speechSm * 0.42 + micSm * 0.22;
    let expand = 1;
    for (const b of FX.bursts) { const k = (t - b.t) / 900; if (k < 1) expand += Math.sin(k * Math.PI) * 0.35 * b.s; }
    FX.bursts = FX.bursts.filter(b => t - b.t < 2200);

    // Leuchten
    const gl = g.createRadialGradient(cx, cy, 0, cx, cy, R * 2.1);
    gl.addColorStop(0, `rgba(255,96,40,${(0.18 + speechSm * 0.45 + micSm * 0.2) * dim})`); gl.addColorStop(0.55, `rgba(255,70,25,${0.06 * dim})`); gl.addColorStop(1, "rgba(255,60,20,0)");
    g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, R * 2.1, 0, 7); g.fill();

    // Ringe je nach Zustand
    g.lineWidth = 1.2 * d;
    if (m === "listen") {
      for (let i = 0; i < 3; i++) {
        const k = reduce ? 0.5 : ((t / 1800 + i / 3) % 1);
        g.strokeStyle = `rgba(255,140,80,${(1 - k) * (0.18 + micSm * 0.6)})`;
        g.beginPath(); g.arc(cx, cy, R * (1.08 + k * 0.55 + micSm * 0.2), 0, 7); g.stroke();
      }
    }
    if (m === "think") {
      for (let i = 0; i < 3; i++) {
        const a0 = (reduce ? 0 : t / (500 + i * 220)) * (i % 2 ? -1 : 1) + i * 2;
        g.strokeStyle = `rgba(255,${120 + i * 30},70,${0.55 - i * 0.12})`; g.lineWidth = (2.2 - i * 0.5) * d;
        g.beginPath(); g.arc(cx, cy, R * (1.18 + i * 0.12), a0, a0 + 1.2 + i * 0.4); g.stroke();
      }
    }
    if (m === "speak") {
      g.strokeStyle = `rgba(255,120,60,${0.15 + speechSm * 0.5})`; g.lineWidth = 1.4 * d;
      g.beginPath();
      for (let i = 0; i <= 120; i++) { const a = i / 120 * 6.283; const rr = R * (1.2 + speechSm * 0.18 * Math.sin(a * 6 + t / 90) + 0.03 * Math.sin(a * 13 - t / 160)); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.closePath(); g.stroke();
    }
    // Schockwelle beim Aufwachen
    for (const b of FX.bursts) { const k = (t - b.t) / 1600; if (k < 1) { g.strokeStyle = `rgba(255,150,90,${(1 - k) * 0.6})`; g.lineWidth = (3 - k * 2) * d; g.beginPath(); g.arc(cx, cy, R * (1 + ease(k) * 2.4), 0, 7); g.stroke(); } }

    // Punkte
    g.globalCompositeOperation = "lighter";
    const breathe = reduce ? 0 : 0.025 * Math.sin(t / 700);
    for (const p of PTS) {
      const x = p[0] * ca - p[2] * sa; let z = p[0] * sa + p[2] * ca; const y = p[1];
      const y2 = y * ct - z * st; z = y * st + z * ct;
      let n = expand + breathe + amp * Math.sin(p[3] * 3 + t / 160) * p[4];
      if (m === "think") n += 0.05 * Math.sin(p[3] * 5 + t / 120);
      const rr = R * n, s = (z + 1.5) * 0.85 * d * (m === "sleep" ? 0.85 : 1);
      const hot = speechSm * 40 * (z + 1);
      g.fillStyle = `rgba(255,${Math.min(255, 105 + (z + 1) * 55 + hot) | 0},${(45 + (z + 1) * 28) | 0},${(0.1 + (z + 1) * 0.34) * dim})`;
      g.fillRect(cx + x * rr, cy + y2 * rr, s, s);
    }
    g.globalCompositeOperation = "source-over";
  }

  function frame(t) {
    const d = fit(cv), W = cv.width, H = cv.height;
    const s = slotRect();
    if (s) {
      if (!orb.ready) { orb.x = s.x; orb.y = s.y; orb.r = s.r; orb.ready = true; }
      const k = reduce ? 1 : 0.09;
      orb.x = lerp(orb.x, s.x, k); orb.y = lerp(orb.y, s.y, k); orb.r = lerp(orb.r, s.r, k);
    }
    speechSm = lerp(speechSm, FX.speech, 0.3);
    micSm = lerp(micSm, FX.mic, 0.25);
    wakeAmt = lerp(wakeAmt, FX.mode === "sleep" ? 0 : 1, 0.04);
    drawBackground(t, W, H, d);
    drawOrb(t, d);
    for (const fn of FX.hooks) fn(t);
    requestAnimationFrame(frame);
  }
  FX.hooks = [];
  FX.start = function (canvas, slot) {
    cv = canvas; g = cv.getContext("2d"); FX.slot = slot; initPoints(); requestAnimationFrame(frame);
  };
  FX.setSlot = el => { FX.slot = el; };

  /* ================= Globus ================= */
  let LAND = [];
  fetch("land.json").then(r => r.json()).then(a => { LAND = a; }).catch(() => {});
  function Globe(canvas, focus, marks) {
    this.c = canvas; this.g = canvas.getContext("2d"); this.focus = focus; this.marks = marks || [];
    this.rot = { lon: focus.lon - 140, lat: 10 }; this.born = performance.now();
  }
  Globe.prototype.draw = function (t) {
    const c = this.c; if (!c.isConnected) return false;
    const g = this.g, d = fit(c), W = c.width, H = c.height, cx = W / 2, cy = H / 2;
    const age = Math.min(1, (t - this.born) / 1400);
    const R = Math.min(W, H) * (0.2 + 0.24 * ease(age));
    const f = this.focus;
    const dl = ((f.lon - this.rot.lon + 540) % 360) - 180;
    this.rot.lon += dl * (reduce ? 1 : 0.045); this.rot.lat += (f.lat * 0.7 - this.rot.lat) * (reduce ? 1 : 0.045);
    if (f.spin && !reduce) f.lon += 0.06;
    const rl0 = this.rot.lon, p0 = this.rot.lat * Math.PI / 180, cp = Math.cos(p0), sp = Math.sin(p0);
    const P = (lat, lon) => { const rl = (lon - rl0) * Math.PI / 180, la = lat * Math.PI / 180, cl = Math.cos(la); return [cx + cl * Math.sin(rl) * R, cy - (cp * Math.sin(la) - sp * cl * Math.cos(rl)) * R, sp * Math.sin(la) + cp * cl * Math.cos(rl)]; };
    g.clearRect(0, 0, W, H);
    const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R * 1.2); gr.addColorStop(0, "rgba(255,110,50,.16)"); gr.addColorStop(1, "rgba(10,6,5,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 1.2, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,122,64,.4)"; g.lineWidth = d; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    // Breitengrade
    g.strokeStyle = "rgba(255,122,64,.07)";
    for (let la = -60; la <= 60; la += 30) { g.beginPath(); let on = false; for (let lo = -180; lo <= 180; lo += 5) { const [x, y, z] = P(la, lo); if (z > 0) { on ? g.lineTo(x, y) : g.moveTo(x, y); on = true; } else on = false; } g.stroke(); }
    const ds = Math.max(1, R / 230);
    for (let i = 0; i < LAND.length; i += 2) { const [x, y, z] = P(LAND[i], LAND[i + 1]); if (z <= 0) continue; g.fillStyle = `rgba(255,${(120 + z * 50) | 0},${(60 + z * 30) | 0},${0.15 + z * 0.7})`; g.fillRect(x - ds, y - ds, ds * 2, ds * 2); }
    const [fx, fy, fz] = P(f.lat, f.lon);
    const seen = new Set();
    this.marks.forEach((m, i) => {
      if (seen.has(m.name) || m.name === f.name) return; seen.add(m.name);
      const [x, y, z] = P(m.lat, m.lon); if (z <= 0.05) return;
      const pop = Math.min(1, Math.max(0, (t - this.born - 700 - i * 160) / 500));
      if (pop <= 0) return;
      if (fz > 0) { g.strokeStyle = `rgba(255,122,61,${0.45 * pop})`; g.lineWidth = d; g.beginPath(); g.moveTo(fx, fy); const k = ease(pop); const tx = fx + (x - fx) * k, ty = fy + (y - fy) * k; g.quadraticCurveTo((fx + tx) / 2, (fy + ty) / 2 - Math.hypot(fx - tx, fy - ty) * 0.35, tx, ty); g.stroke(); }
      g.fillStyle = "#ff7a3d"; g.beginPath(); g.arc(x, y, 2.6 * d * pop, 0, 7); g.fill();
      g.fillStyle = `rgba(244,231,223,${0.85 * pop})`; g.font = `${10 * d}px "IBM Plex Mono",monospace`; g.fillText(m.name.toUpperCase(), x + 6 * d, y - 5 * d);
    });
    if (fz > 0 && f.name) {
      const p = reduce ? 0.5 : (Math.sin(t / 380) + 1) / 2;
      g.strokeStyle = `rgba(255,74,47,${0.85 - p * 0.6})`; g.lineWidth = 1.6 * d; g.beginPath(); g.arc(fx, fy, 9 * d + p * 12 * d, 0, 7); g.stroke();
      g.fillStyle = "#ffd2b8"; g.beginPath(); g.arc(fx, fy, 4 * d, 0, 7); g.fill();
      g.fillStyle = "#f4e7df"; g.font = `600 ${12 * d}px "Oxanium",sans-serif`; g.fillText(f.name.toUpperCase(), fx + 12 * d, fy + 4 * d);
    }
    return true;
  };
  let globes = [];
  FX.hooks.push(t => { globes = globes.filter(gl => gl.draw(t)); });
  FX.globe = (canvas, focus, marks) => { const gl = new Globe(canvas, focus, marks); globes = [gl]; return gl; };

  /* ================= Wetter-Animation ================= */
  FX.weatherIcon = function (canvas, kind, isDay) {
    const g = canvas.getContext("2d"); const born = performance.now();
    const drops = Array.from({ length: 26 }, () => [Math.random(), Math.random(), 0.6 + Math.random() * 0.6]);
    FX.hooks.push(function hook(t) {
      if (!canvas.isConnected) { FX.hooks.splice(FX.hooks.indexOf(hook), 1); return; }
      const d = fit(canvas), W = canvas.width, H = canvas.height, s = Math.min(W, H);
      const k = ease(Math.min(1, (t - born) / 900));
      g.clearRect(0, 0, W, H); g.save(); g.translate(W / 2, H / 2); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.globalAlpha = k;
      const sunR = s * 0.17;
      const sun = (x, y) => {
        if (!isDay) { g.fillStyle = "#ffd9b0"; g.beginPath(); g.arc(x, y, sunR, 0, 7); g.fill(); g.fillStyle = "#0a0605"; g.beginPath(); g.arc(x + sunR * 0.45, y - sunR * 0.3, sunR * 0.85, 0, 7); g.fill(); return; }
        const rot = reduce ? 0 : t / 4000;
        g.strokeStyle = "#ffb347"; g.lineWidth = 3 * d; g.lineCap = "round";
        for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5; g.beginPath(); g.moveTo(x + Math.cos(a) * sunR * 1.35, y + Math.sin(a) * sunR * 1.35); g.lineTo(x + Math.cos(a) * sunR * 1.75, y + Math.sin(a) * sunR * 1.75); g.stroke(); }
        const sg = g.createRadialGradient(x, y, 0, x, y, sunR); sg.addColorStop(0, "#ffe3a3"); sg.addColorStop(1, "#ff8a3d"); g.fillStyle = sg; g.beginPath(); g.arc(x, y, sunR, 0, 7); g.fill();
      };
      const cloud = (x, y, sc, a) => {
        g.fillStyle = `rgba(230,205,192,${a})`; g.beginPath();
        g.arc(x - s * 0.12 * sc, y, s * 0.1 * sc, 0, 7); g.arc(x, y - s * 0.06 * sc, s * 0.14 * sc, 0, 7); g.arc(x + s * 0.14 * sc, y, s * 0.1 * sc, 0, 7); g.rect(x - s * 0.12 * sc, y, s * 0.26 * sc, s * 0.1 * sc); g.fill();
      };
      const drift = reduce ? 0 : Math.sin(t / 1800) * s * 0.03;
      if (kind === "sun") sun(0, 0);
      if (kind === "partly") { sun(-s * 0.1, -s * 0.08); cloud(s * 0.06 + drift, s * 0.08, 1, 0.95); }
      if (kind === "cloud" || kind === "fog") { cloud(-s * 0.1 + drift, -s * 0.04, 0.8, 0.55); cloud(s * 0.05 - drift, s * 0.05, 1, 0.95); }
      if (kind === "fog") { g.strokeStyle = "rgba(230,205,192,.5)"; g.lineWidth = 3 * d; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-s * 0.3 + drift * (i % 2 ? 1 : -1), s * (0.2 + i * 0.07)); g.lineTo(s * 0.3, s * (0.2 + i * 0.07)); g.stroke(); } }
      if (kind === "rain" || kind === "sleet" || kind === "storm" || kind === "snow") {
        cloud(drift, -s * 0.08, 1.05, 0.95);
        for (const p of drops) {
          if (!reduce) { p[1] += 0.012 * p[2]; if (p[1] > 1) { p[1] = 0; p[0] = Math.random(); } }
          const x = (p[0] - 0.5) * s * 0.5, y = s * 0.02 + p[1] * s * 0.32;
          if (kind === "snow") { g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(x, y, 2.2 * d, 0, 7); g.fill(); }
          else { g.strokeStyle = "rgba(140,190,255,.8)"; g.lineWidth = 2 * d; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3 * d, y + 9 * d); g.stroke(); }
        }
        if (kind === "storm" && !reduce && (t % 2600) < 140) { g.fillStyle = "rgba(255,240,180,.9)"; g.beginPath(); g.moveTo(0, -s * 0.02); g.lineTo(-s * 0.05, s * 0.12); g.lineTo(s * 0.01, s * 0.12); g.lineTo(-s * 0.03, s * 0.26); g.lineTo(s * 0.07, s * 0.07); g.lineTo(s * 0.01, s * 0.07); g.closePath(); g.fill(); }
      }
      g.restore();
    });
  };

  /* ================= Denk-Netzwerk ================= */
  FX.neural = function (canvas) {
    const g = canvas.getContext("2d"), born = performance.now();
    const N = 34, nodes = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0016, vy: (Math.random() - 0.5) * 0.0016, p: Math.random() * 6.28 }));
    const pulses = [];
    FX.hooks.push(function hook(t) {
      if (!canvas.isConnected) { FX.hooks.splice(FX.hooks.indexOf(hook), 1); return; }
      const d = fit(canvas), W = canvas.width, H = canvas.height;
      g.clearRect(0, 0, W, H);
      const fade = Math.min(1, (t - born) / 600);
      for (const n of nodes) { if (!reduce) { n.x += n.vx; n.y += n.vy; if (n.x < 0.03 || n.x > 0.97) n.vx *= -1; if (n.y < 0.05 || n.y > 0.95) n.vy *= -1; } }
      const link = 0.28;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = nodes[i], b = nodes[j], dx = (a.x - b.x) * W / Math.max(W, H), dy = (a.y - b.y) * H / Math.max(W, H), dist = Math.hypot(dx, dy);
        if (dist < link) {
          g.strokeStyle = `rgba(255,122,64,${(1 - dist / link) * 0.35 * fade})`; g.lineWidth = d;
          g.beginPath(); g.moveTo(a.x * W, a.y * H); g.lineTo(b.x * W, b.y * H); g.stroke();
          if (!reduce && Math.random() < 0.004) pulses.push({ a, b, t });
        }
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k], q = (t - p.t) / 700; if (q > 1) { pulses.splice(k, 1); continue; }
        const x = (p.a.x + (p.b.x - p.a.x) * q) * W, y = (p.a.y + (p.b.y - p.a.y) * q) * H;
        g.fillStyle = "rgba(255,220,180,.95)"; g.beginPath(); g.arc(x, y, 2.4 * d, 0, 7); g.fill();
      }
      for (const n of nodes) { const r = (2 + 1.4 * Math.sin(t / 400 + n.p)) * d; g.fillStyle = `rgba(255,${150 + 60 * Math.sin(t / 500 + n.p) | 0},90,${0.85 * fade})`; g.beginPath(); g.arc(n.x * W, n.y * H, r, 0, 7); g.fill(); }
    });
  };

  /* ================= Konfetti ================= */
  FX.confetti = function () {
    if (reduce) return;
    const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
    const g = c.getContext("2d"), born = performance.now(), cols = ["#ff7a3d", "#ffd2b8", "#6fd39a", "#ffb347", "#ff4a2f", "#f4e7df"];
    const parts = Array.from({ length: 140 }, () => ({ x: 0.5, y: 0.45, vx: (Math.random() - 0.5) * 0.03, vy: -Math.random() * 0.03 - 0.008, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, c: cols[Math.random() * cols.length | 0], s: 0.6 + Math.random() * 0.8 }));
    FX.hooks.push(function hook(t) {
      const age = t - born; if (age > 2600) { FX.hooks.splice(FX.hooks.indexOf(hook), 1); c.remove(); return; }
      const d = fit(c), W = c.width, H = c.height; g.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.0007; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr;
        g.save(); g.translate(p.x * W, p.y * H); g.rotate(p.r); g.globalAlpha = Math.max(0, 1 - age / 2600); g.fillStyle = p.c; g.fillRect(-4 * d * p.s, -2 * d * p.s, 8 * d * p.s, 4 * d * p.s); g.restore();
      }
    });
  };

  /* ================= Hilfen ================= */
  FX.countUp = function (el, to, fmt, ms = 1100) {
    el.textContent = fmt(0);
    if (reduce || !isFinite(to)) { el.textContent = fmt(to); return; }
    let t0 = null, tries = 0;
    (function step(t) {
      if (!el.isConnected) { if (++tries < 120) requestAnimationFrame(step); else el.textContent = fmt(to); return; }
      if (t0 == null) t0 = t;
      const k = Math.min(1, (t - t0) / ms);
      el.textContent = fmt(to * ease(k));
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  };
  FX.reduce = reduce;
  root.MakhoFX = FX;
})(window);
