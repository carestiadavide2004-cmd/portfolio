/* =========================================================
   Carestia Web — panels.js
   Pannelli dell'hero in CSS 3D: veri <img> degli screenshot (nitidi come una foto)
   dentro un contenitore con prospettiva, mossi solo con transform.
   - ogni pannello vaga su un suo percorso morbido e ben visibile, ruota un poco,
     si avvicina e si allontana; mouse o giroscopio aggiungono parallasse;
   - evitano titolo, sottotitolo e pulsanti (i più lontani ci passano dietro, attenuati)
     e tengono la distanza tra loro;
   - stanno sempre dietro il piano dello schermo: non vengono mai ingranditi, quindi restano nitidi;
   - si fermano quando l'hero non si vede; con "riduci movimento" composizione ferma.
   ========================================================= */

(() => {
  const CW = window.CW;
  const hero = document.querySelector(".hero");
  if (!CW || !CW.works || !hero) return;

  const reduced = CW.reduced;
  const stacked = matchMedia("(max-width: 899px)"); // telefono e tablet in verticale: testo in basso, pannelli sopra
  const nav = document.getElementById("nav");
  const zoneEls = [...hero.querySelectorAll("[data-hero-title], .hero__lead, .hero__actions .btn")];

  /* composizione di riposo, da cui ogni pannello parte a vagare.
     computer: u, v = centro (frazione dell'hero), w = larghezza a schermo (frazione della larghezza);
     telefono: u = centro orizzontale, v e h = centro e altezza dentro lo spazio libero sopra il titolo;
     z = profondità in px (sempre dietro lo schermo); a = ampiezza del vagare [x, y] in frazione dello schermo;
     wmax = larghezza massima (frazione della larghezza); rx, ry = rotazione in gradi */
  const DESKTOP = [
    { u: 0.79, v: 0.5, w: 0.27, z: -110, a: [0.08, 0.05], rx: 3, ry: -16 },
    { u: 0.86, v: 0.17, w: 0.16, z: -300, a: [0.1, 0.045], rx: 4, ry: -20 },
    { u: 0.84, v: 0.8, w: 0.17, z: -260, a: [0.1, 0.045], rx: -4, ry: -18 },
    { u: 0.62, v: 0.14, w: 0.12, z: -480, a: [0.12, 0.04], rx: 5, ry: -10 },
    { u: 0.6, v: 0.86, w: 0.12, z: -440, a: [0.12, 0.04], rx: -5, ry: -12 },
    { u: 0.3, v: 0.12, w: 0.1, z: -760, a: [0.15, 0.035], rx: 4, ry: 12 },
    { u: 0.14, v: 0.86, w: 0.1, z: -700, a: [0.14, 0.035], rx: -4, ry: 14 },
  ];
  const PHONE = [
    { u: 0.27, v: 0.5, h: 0.8, wmax: 0.4, z: -130, a: [0.15, 0.04], rx: 3, ry: 14 },
    { u: 0.73, v: 0.53, h: 0.74, wmax: 0.37, z: -190, a: [0.15, 0.04], rx: 3, ry: -15 },
    { u: 0.5, v: 0.34, h: 0.52, wmax: 0.26, z: -420, a: [0.18, 0.045], rx: 4, ry: 4 },
    { u: 0.98, v: 0.3, h: 0.48, wmax: 0.25, z: -540, a: [0.12, 0.05], rx: 0, ry: -18 },
    { u: 0.02, v: 0.64, h: 0.48, wmax: 0.25, z: -560, a: [0.12, 0.05], rx: 2, ry: 18 },
  ];

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const fract = (x) => x - Math.floor(x);

  const box = document.createElement("div");
  box.className = "hero__panels";
  box.setAttribute("aria-hidden", "true");
  hero.prepend(box);

  // titolo e sottotitolo riga per riga: i pannelli possono stare accanto alle righe corte
  const lineRects = (el) => {
    if (!el.matches("[data-hero-title], .hero__lead")) return [el.getBoundingClientRect()];
    const range = document.createRange();
    range.selectNodeContents(el);
    const lines = [];
    for (const r of range.getClientRects()) {
      if (!r.width || !r.height) continue;
      const line = lines.find((l) => Math.min(l.bottom, r.bottom) - Math.max(l.top, r.top) > Math.min(l.bottom - l.top, r.height) * 0.5);
      if (line) {
        line.left = Math.min(line.left, r.left); line.right = Math.max(line.right, r.right);
        line.top = Math.min(line.top, r.top); line.bottom = Math.max(line.bottom, r.bottom);
      } else lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width });
    }
    return lines.length ? lines : [el.getBoundingClientRect()];
  };

  /* ---------- stato ---------- */
  let panels = [], phone = stacked.matches;
  let W = 1, H = 1, P = 1000, zone = [], navH = 0;
  let t = 0, introT = reduced ? 0 : -1, last = performance.now(), raf = 0, visible = true;
  let mx = 0, my = 0, tmx = 0, tmy = 0, hasMouse = false, gyro = false;

  const build = () => {
    phone = stacked.matches;
    const kind = phone ? "telefono" : "computer";
    const L = phone ? PHONE : DESKTOP;
    box.textContent = "";
    panels = CW.works.slice(0, L.length).map((w, i) => {
      const el = document.createElement("figure");
      el.className = "hpanel";
      el.style.setProperty("--c", w.colore);
      const img = document.createElement("img");
      img.alt = "";
      img.width = phone ? 480 : 1200;
      img.height = phone ? 1040 : 750;
      img.decoding = "async";
      img.setAttribute("fetchpriority", i < 2 ? "high" : "low");
      const shade = document.createElement("i");
      shade.className = "hpanel__shade";
      el.append(img, shade);
      box.append(el);
      const r = (n) => fract(Math.sin((i + 1) * n) * 43758.5453);
      const p = {
        el, img, shade, slot: L[i], w,
        srcset: `${w.img[kind]} ${phone ? 480 : 1200}w, ${w.img3d[kind]} ${phone ? 780 : 2048}w`,
        // percorso personale: frequenze e fasi diverse per ogni pannello
        // sul telefono lo spazio è poco: percorsi più corti ma un po' più rapidi, così il movimento si vede
        f: [0.42, 0.67, 0.36, 0.55, 0.3].map((f, k) => f * (0.85 + 0.3 * r(12.9 + k * 7.1)) * (phone ? 1.25 : 1)),
        ph: [0, 1, 2, 3, 4, 5, 6].map((k) => r(78.2 + k * 3.7) * Math.PI * 2),
        ready: false, readyT: 0, rank: 0, home: null,
        ox: 0, oy: 0, cx: 0, cy: 0, sx: 0, sy: 0, hx: 0, hy: 0, z: 0, rx: 0, ry: 0, rz: 0, e: 0,
        cover: 0, shown: -1, dimmed: -1,
      };
      const ok = () => { if (!p.ready) { p.ready = true; p.readyT = t; kick(); } };
      img.addEventListener("load", () => img.decode().then(ok, ok), { once: true });
      return p;
    });
    layout();
    // misura nota: ora il browser sceglie lo screenshot giusto per la densità dello schermo
    panels.forEach((p) => {
      p.img.sizes = `${Math.ceil(p.home.w)}px`;
      p.img.srcset = p.srcset;
      p.img.src = p.w.img[phone ? "telefono" : "computer"];
    });
  };

  const layout = () => {
    const hr = hero.getBoundingClientRect();
    W = hero.clientWidth;
    H = hero.clientHeight;
    P = phone ? 800 : 1100;
    box.style.perspective = `${P}px`;
    navH = nav ? nav.getBoundingClientRect().height : 0;
    const pad = Math.max(14, Math.min(W, innerHeight) * 0.025);
    zone = zoneEls
      .flatMap(lineRects)
      .filter((r) => r.width)
      .map((r) => ({ l: r.left - hr.left - pad, r: r.right - hr.left + pad, t: r.top - hr.top - pad, b: r.bottom - hr.top + pad }));
    // telefono: la composizione occupa lo spazio libero tra la barra in alto e il titolo
    const top = navH + 10;
    const bottom = zone.length ? Math.min(...zone.map((r) => r.t)) : H * 0.5;
    const band = Math.max(160, bottom - top);
    panels.forEach((p) => {
      const s = p.slot;
      const ta = phone ? 780 / 1688 : 1.6; // proporzioni degli screenshot
      let sw, sh;
      if (phone) {
        sh = s.h * band;
        sw = sh * ta;
        if (sw > s.wmax * W) { sw = s.wmax * W; sh = sw / ta; }
      } else {
        sw = s.w * W;
        sh = sw / ta;
      }
      const grow = (P - s.z) / P; // misura reale = misura a schermo riportata alla sua profondità
      const az = Math.min(phone ? 90 : 60 + 0.25 * -s.z, -s.z - 30); // si avvicina e si allontana
      p.home = {
        x: s.u * W,
        y: phone ? top + s.v * band : s.v * H,
        w: sw * grow, h: sh * grow, z: s.z, az,
        ax: s.a[0] * W, ay: s.a[1] * H,
        rx: s.rx, ry: s.ry,
        base: clamp((-s.z - 300) / 900) * 0.3, // i lontani un po' meno luminosi, mai sfocati
      };
      p.el.style.width = `${p.home.w}px`;
      p.el.style.height = `${p.home.h}px`;
      p.el.style.setProperty("--r", `${Math.round(p.home.w * (phone ? 0.09 : 0.022))}px`);
    });
    [...panels].sort((a, b) => b.slot.z - a.slot.z).forEach((p, n) => {
      p.rank = n;
      p.el.style.zIndex = String(panels.length - n);
    });
    if (reduced) settle();
  };

  /* i pannelli vicini escono dalla zona del testo dalla parte più corta; quelli lontani ci passano dietro
     attenuati. Tra loro tengono una distanza minima. Le spinte sono molle morbide. */
  const avoid = (dt, list, sy) => {
    const rects = zone.concat({ l: -1e5, r: 1e5, t: -1e5, b: sy + navH + 6 });
    const nearZ = phone ? -300 : -360;
    for (const p of list) {
      p.cx = 0; p.cy = 0; p.cover = 0;
      const near = p.z > nearZ;
      for (const r of rects) {
        const ox = Math.min(p.sx + p.hx, r.r) - Math.max(p.sx - p.hx, r.l);
        const oy = Math.min(p.sy + p.hy, r.b) - Math.max(p.sy - p.hy, r.t);
        if (ox <= 0 || oy <= 0) continue;
        p.cover += (ox * oy) / (4 * p.hx * p.hy);
        if (!near) continue;
        const exits = [[r.l - (p.sx + p.hx), 0], [r.r - (p.sx - p.hx), 0], [0, r.t - (p.sy + p.hy)], [0, r.b - (p.sy - p.hy)]];
        let best = exits[0];
        for (const e of exits) if (Math.abs(e[0]) + Math.abs(e[1]) < Math.abs(best[0]) + Math.abs(best[1])) best = e;
        p.cx += best[0];
        p.cy += best[1];
      }
      if (near) {
        // dentro lo schermo (al massimo un pezzetto fuori dal bordo)
        const out = (phone ? 0.4 : 0.24) * p.hx;
        const over = p.sx + p.hx - (W + out), under = -out - (p.sx - p.hx);
        if (over > 0) p.cx -= over;
        else if (under > 0) p.cx += under;
      }
    }
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        const A = list[a], B = list[b];
        // a profondità diverse possono sovrapporsi appena (quello davanti copre l'altro), altrimenti c'è sempre aria
        const deep = Math.abs(A.z - B.z) > (phone ? 50 : 220);
        const ox = A.hx + B.hx + (deep ? -0.18 * Math.min(A.hx, B.hx) : 16) - Math.abs(A.sx - B.sx);
        const oy = A.hy + B.hy + (deep ? -0.18 * Math.min(A.hy, B.hy) : 16) - Math.abs(A.sy - B.sy);
        if (ox <= 0 || oy <= 0) continue;
        const wa = B.hy / (A.hy + B.hy); // si sposta di più il pannello più piccolo
        if (ox < oy) {
          const s = Math.sign(A.sx - B.sx) || 1;
          A.cx += s * ox * wa; B.cx -= s * ox * (1 - wa);
        } else {
          const s = Math.sign(A.sy - B.sy) || 1;
          A.cy += s * oy * wa; B.cy -= s * oy * (1 - wa);
        }
      }
    }
    const kp = Math.min(1, dt * 4.5), kb = Math.min(1, dt * 0.45);
    for (const p of list) {
      p.ox = clamp(p.ox + p.cx * kp - p.ox * kb, -W * 0.5, W * 0.5);
      p.oy = clamp(p.oy + p.cy * kp - p.oy * kb, -H * 0.5, H * 0.5);
    }
  };

  /* posizione di ogni pannello per l'istante t */
  const pose = (p, sy, still) => {
    const s = p.home, f = p.f, ph = p.ph;
    const near = 1 - clamp(-s.z / 800);
    p.e = still ? 1 : easeOut(clamp((t - Math.max(introT, p.readyT) - p.rank * 0.12) / 1.4));
    const go = still ? 0 : 1;
    const wx = go * s.ax * (0.62 * Math.sin(t * f[0] + ph[0]) + 0.38 * Math.sin(t * f[1] + ph[1]));
    const wy = go * s.ay * (0.6 * Math.sin(t * f[2] + ph[2]) + 0.4 * Math.cos(t * f[3] + ph[3]));
    const hp = clamp(sy / H);
    let z = s.z + go * s.az * Math.sin(t * f[4] + ph[4]);
    z = Math.min(-20, mix(-2400, z, p.e) + hp * 140);
    const amp = phone ? 0.6 : 1;
    p.sx = s.x + wx + mx * (10 + 26 * near) * amp + p.ox;
    p.sy = s.y + wy + my * (6 + 16 * near) * amp + p.oy + sy * (0.1 + 0.35 * (1 - near));
    p.z = z;
    const k = P / (P - z);
    p.hx = (s.w / 2) * k;
    p.hy = (s.h / 2) * k;
    p.rx = s.rx - my * 4 + go * 2.5 * Math.sin(t * f[2] * 1.3 + ph[5]);
    p.ry = s.ry + mx * 7 + go * 5 * Math.sin(t * f[0] * 1.1 + ph[6]);
    p.rz = go * 1.2 * Math.sin(t * f[1] + ph[2]);
  };

  const paint = (p) => {
    const s = p.home;
    const k = P / (P - p.z);
    // punto 3D che, visto in prospettiva, cade esattamente nella posizione voluta sullo schermo
    const X = W / 2 + (p.sx - W / 2) / k - s.w / 2;
    const Y = H / 2 + (p.sy - H / 2) / k - s.h / 2;
    p.el.style.transform = `translate3d(${X.toFixed(1)}px, ${Y.toFixed(1)}px, ${p.z.toFixed(1)}px) rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg)`;
    const op = p.e >= 0.999 ? 1 : clamp(p.e * 1.6);
    if (op !== p.shown) { p.el.style.opacity = op === 1 ? "1" : op.toFixed(3); p.shown = op; }
    const dim = Math.max(s.base, Math.min(1, p.cover) * (p.z > -360 ? 0.35 : 0.55));
    if (Math.abs(dim - p.dimmed) > 0.03) { p.shade.style.opacity = dim.toFixed(2); p.dimmed = dim; }
  };

  // "riduci movimento": composizione ferma, già sistemata attorno al testo
  function settle() {
    const list = panels.filter((p) => p.ready && p.home);
    list.forEach((p) => { p.ox = 0; p.oy = 0; });
    for (let n = 0; n < 160; n++) {
      list.forEach((p) => pose(p, 0, true));
      avoid(1 / 30, list, 0);
    }
    list.forEach((p) => { pose(p, 0, true); paint(p); });
  }

  const frame = (now) => {
    raf = 0;
    if (!visible || reduced) return;
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    t += dt;
    if (!hasMouse && !gyro) { tmx = Math.sin(t * 0.3) * 0.4; tmy = Math.cos(t * 0.23) * 0.25; }
    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;
    const sy = scrollY;
    const list = panels.filter((p) => p.ready && p.home && introT >= 0);
    list.forEach((p) => pose(p, sy, false));
    avoid(dt, list.filter((p) => p.e > 0.05), sy);
    list.forEach(paint);
    raf = requestAnimationFrame(frame);
  };
  function kick() {
    if (reduced) { settle(); return; }
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- eventi ---------- */
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    hasMouse = true;
    tmx = (e.clientX / innerWidth) * 2 - 1;
    tmy = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  addEventListener("deviceorientation", (e) => {
    if (e.gamma == null || e.beta == null) return;
    gyro = true;
    tmx = clamp(e.gamma / 25, -1, 1);
    tmy = clamp((e.beta - 45) / 25, -1, 1);
  }, { passive: true });
  // si ferma quando l'hero non si vede
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) kick();
  }).observe(hero);
  let resizeQueued = false;
  new ResizeObserver(() => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      if (stacked.matches !== phone) build();
      else layout();
    });
  }).observe(hero);
  if (document.fonts) document.fonts.ready.then(() => layout());
  (CW.introDone || Promise.resolve()).then(() => {
    if (introT < 0) introT = t;
    setTimeout(layout, 1600); // il titolo ha finito di entrare: zona libera definitiva
    kick();
  });

  build();
  kick();
})();
