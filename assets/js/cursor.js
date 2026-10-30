/* =========================================================
   Carestia Web — cursor.js
   Puntatore "goccia di luce", solo con il mouse (hover: hover e pointer: fine).
   - segue con un leggero ritardo, si allunga quando corre, cambia colore per sezione;
   - sulle carte dei lavori diventa un disco con "Apri" (o "Guarda" sui video);
   - su pulsanti e link si aggancia prendendone la forma, e il pulsante si avvicina al mouse;
   - sui testi diventa una linea sottile; al clic lascia un'onda di luce.
   Sul telefono resta il tocco normale, con una leggera onda dove si tocca.
   Se questo script non parte, resta il puntatore del sistema.
   ========================================================= */

(() => {
  const html = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const COLORS = { red: "#FF3B5C", violet: "#9D5CFF", blue: "#3E7BFF", green: "#C6FF3D" };
  const TONES = {
    hero: "violet", trust: "red", work: "blue", screens: "blue", services: "green",
    process: "violet", about: "red", contact: "green",
    "work:ristoranti": "red", "work:stabilimenti": "blue", "work:bellezza": "violet", "work:negozi": "violet", "work:palestre": "green",
  };
  const toneOf = (tint) => TONES[tint] || TONES[String(tint).split(":")[0]] || "violet";
  const currentTone = () => toneOf((window.CW && window.CW.tint) || "hero");

  const ripple = (x, y, tone, soft) => {
    const r = document.createElement("span");
    r.className = soft ? "cursor-ripple cursor-ripple--soft" : "cursor-ripple";
    r.setAttribute("aria-hidden", "true");
    r.style.cssText = `left:${x}px;top:${y}px;--c:${COLORS[tone]}`;
    r.addEventListener("animationend", () => r.remove());
    document.body.appendChild(r);
  };

  /* ---------- telefono e tablet: solo un'onda di luce sui tocchi veri (non quando si scorre) ---------- */
  if (!fine) {
    if (reduced) return;
    let down = null;
    addEventListener("pointerdown", (e) => { down = e.pointerType === "touch" ? { x: e.clientX, y: e.clientY, t: e.timeStamp } : null; }, { passive: true });
    addEventListener("pointercancel", () => { down = null; }, { passive: true });
    addEventListener("pointerup", (e) => {
      if (down && e.timeStamp - down.t < 450 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10) ripple(e.clientX, e.clientY, currentTone(), true);
      down = null;
    }, { passive: true });
    return;
  }

  const FIELD = "input, textarea, select, [contenteditable='true']";
  const root = document.createElement("div");
  root.className = "cursor is-off";
  root.setAttribute("aria-hidden", "true");

  /* ---------- "riduci movimento": un cerchio semplice, senza ritardo né deformazioni ---------- */
  if (reduced) {
    root.classList.add("cursor--simple");
    root.innerHTML = '<div class="cursor__ring"></div>';
    document.body.appendChild(root);
    html.classList.add("has-cursor");
    const ring = root.firstElementChild;
    let qx = 0, qy = 0, q = 0;
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      qx = e.clientX; qy = e.clientY;
      root.classList.remove("is-off");
      if (!q) q = requestAnimationFrame(() => { q = 0; ring.style.transform = `translate3d(${qx - 13}px, ${qy - 13}px, 0)`; });
    }, { passive: true });
    document.addEventListener("pointerover", (e) => root.classList.toggle("is-field", !!(e.target.closest && e.target.closest(FIELD))));
    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) root.classList.add("is-off"); });
    return;
  }

  root.innerHTML = `
    <div class="cursor__drop">
      <i class="cursor__glow" data-tone="red"></i><i class="cursor__glow" data-tone="violet"></i>
      <i class="cursor__glow" data-tone="blue"></i><i class="cursor__glow" data-tone="green"></i>
      <span class="cursor__body"></span><span class="cursor__fill"></span>
    </div>
    <div class="cursor__label"><span></span></div>
    <div class="cursor__frame"></div>
    <div class="cursor__dot"></div>`;
  document.body.appendChild(root);
  html.classList.add("has-cursor");
  const $ = (s) => root.querySelector(s);
  const drop = $(".cursor__drop"), label = $(".cursor__label"), labelText = $(".cursor__label span"), frame = $(".cursor__frame"), dot = $(".cursor__dot");

  /* ---------- cosa c'è sotto il mouse ---------- */
  const CARD = ".card__media, .card__tap, .devices, video";
  const ACTION = "a[href], button, [role='button'], summary";
  const TEXT = "p, h1, h2, h3, h4, h5, blockquote, figcaption, dd, dt, address, li:not(.card)";
  const NO_MAGNET = ".filter"; // la pillola dei filtri si allinea ai pulsanti: restano fermi
  const BASE = 96; // la goccia è disegnata grande e rimpicciolita: nitida anche quando cresce
  const SIZE = { default: 34 / BASE, big: 54 / BASE, card: 90 / BASE, button: 16 / BASE, field: 34 / BASE };
  const fontSizes = new WeakMap();
  const caretOf = (el) => {
    if (!fontSizes.has(el)) fontSizes.set(el, parseFloat(getComputedStyle(el).fontSize) || 16);
    return Math.min(90, Math.max(16, fontSizes.get(el) * 1.15));
  };
  const resolve = (el) => {
    if (!el || !el.closest) return { mode: "default" };
    if (el.closest(FIELD)) return { mode: "field" };
    const card = el.closest(CARD);
    const act = el.closest(ACTION);
    if (card && (!act || act.matches(".card__link, .card__tap"))) {
      return { mode: "card", label: card.matches(".devices, video") ? "Guarda" : "Apri" };
    }
    if (act) {
      const r = act.getBoundingClientRect();
      return r.width > 420 || r.height > 140 ? { mode: "big" } : { mode: "button", el: act };
    }
    const txt = el.closest(TEXT);
    return txt ? { mode: "text", el: txt } : { mode: "default" };
  };

  // righe vere del testo (coordinate della pagina): la linea compare solo sopra le parole, non nei margini
  const textLines = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return [...range.getClientRects()].filter((r) => r.width && r.height).map((r) => ({ l: r.left - 2, r: r.right + 2, t: r.top + scrollY, b: r.bottom + scrollY }));
  };

  /* ---------- stato ---------- */
  let x = -200, y = -200, dx = -200, dy = -200, on = false;
  let mode = "default", cur = null, btn = null, lines = [], shape = "";
  let sx = SIZE.default, sy = SIZE.default, vsx = 0, vsy = 0, tsx = sx, tsy = sy;
  let st = 1, ang = 0, fr = 0, vfr = 0, frX = 0, frY = 0, frW = 1, frH = 1;
  let raf = 0, last = 0, tint = null;
  const mags = new Map(); // pulsanti spostati dal magnete → offset attuale
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (k, dt) => 1 - Math.pow(1 - k, dt * 60); // stessa morbidezza a 60 o 120 Hz

  const setTone = (tone) => {
    root.dataset.tone = tone;
    root.style.setProperty("--tone", COLORS[tone]);
  };

  const setMode = (m) => {
    if (m.mode === mode && (m.el || null) === cur && (mode !== "card" || m.label === labelText.textContent)) return;
    mode = m.mode;
    cur = m.el || null;
    btn = mode === "button" ? cur : null;
    if (mode === "card") labelText.textContent = m.label;
    lines = mode === "text" ? textLines(cur) : [];
    shape = ""; // la forma si ricalcola al prossimo fotogramma
    if (btn) {
      // la cornice prende misure e raggio del pulsante; si anima solo con transform e opacity
      const r = btn.getBoundingClientRect();
      const pad = 5;
      frW = r.width + pad * 2;
      frH = r.height + pad * 2;
      frX = r.left - pad;
      frY = r.top - pad;
      const radius = parseFloat(getComputedStyle(btn).borderTopLeftRadius) || 0;
      frame.style.width = `${frW}px`;
      frame.style.height = `${frH}px`;
      frame.style.borderRadius = `${Math.min(radius + pad, frH / 2)}px`;
      if (!mags.has(btn)) mags.set(btn, { x: 0, y: 0, on: !btn.matches(NO_MAGNET) });
    }
    kick();
  };

  const loop = (now) => {
    raf = 0;
    const dt = clamp((now - last) / 1000, 0.001, 0.05);
    last = now;
    const tn = window.CW && window.CW.tint;
    if (tn !== tint) { tint = tn; setTone(toneOf(tn || "hero")); }
    const py = y + scrollY;
    const caret = mode === "text" && lines.some((l) => x >= l.l && x <= l.r && py >= l.t && py <= l.b);
    const sh = caret ? "text" : mode === "text" ? "default" : mode;
    if (sh !== shape) {
      shape = sh;
      root.dataset.mode = sh;
      if (caret) { tsx = 3 / BASE; tsy = caretOf(cur) / BASE; }
      else tsx = tsy = SIZE[sh];
    }

    // la goccia insegue il mouse; più rapida dove serve precisione
    const pdx = dx, pdy = dy;
    const k = ease(shape === "text" ? 0.5 : shape === "card" ? 0.3 : 0.2, dt);
    dx += (x - dx) * k;
    dy += (y - dy) * k;
    const vx = (dx - pdx) / dt, vy = (dy - pdy) / dt, speed = Math.hypot(vx, vy);
    if (speed > 40) ang = Math.atan2(vy, vx);
    // si allunga nella direzione del movimento, torna tonda da ferma
    const stT = shape === "text" || shape === "button" ? 1 : 1 + Math.min(speed / 2600, 0.65);
    st += (stT - st) * ease(0.22, dt);
    // molle con un piccolo rimbalzo per i cambi di forma
    vsx += ((tsx - sx) * 170 - vsx * 14) * dt; sx += vsx * dt;
    vsy += ((tsy - sy) * 170 - vsy * 14) * dt; sy += vsy * dt;
    const frT = btn ? 1 : 0;
    vfr += ((frT - fr) * 260 - vfr * 20) * dt; fr += vfr * dt;

    const h = BASE / 2;
    drop.style.transform =
      `translate3d(${(dx - h).toFixed(2)}px, ${(dy - h).toFixed(2)}px, 0) rotate(${ang.toFixed(4)}rad) ` +
      `scale(${st.toFixed(4)}, ${(1 / Math.sqrt(st)).toFixed(4)}) rotate(${(-ang).toFixed(4)}rad) scale(${Math.max(0.001, sx).toFixed(4)}, ${Math.max(0.001, sy).toFixed(4)})`;
    label.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    dot.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;

    // effetto magnetico: il pulsante si sposta un poco verso il mouse, poi torna al suo posto
    let busy = false;
    for (const [el, m] of mags) {
      const active = el === btn;
      let tx = 0, ty = 0;
      if (active && m.on) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - m.x, cy = r.top + r.height / 2 - m.y;
        tx = clamp((x - cx) * 0.22, -9, 9);
        ty = clamp((y - cy) * 0.3, -6, 6);
      }
      const km = ease(0.16, dt);
      m.x += (tx - m.x) * km;
      m.y += (ty - m.y) * km;
      if (!active && Math.abs(m.x) + Math.abs(m.y) < 0.05) {
        el.style.translate = "";
        mags.delete(el);
        continue;
      }
      if (m.on) el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      if (!active || Math.abs(tx - m.x) + Math.abs(ty - m.y) > 0.05) busy = true;
    }

    // cornice agganciata: nasce dalla goccia e si allarga fino alla forma del pulsante
    if (btn) {
      const r = btn.getBoundingClientRect();
      frX = r.left - 5;
      frY = r.top - 5;
    }
    if (btn || Math.abs(fr) > 0.002 || Math.abs(vfr) > 0.002) {
      const cx = frX + frW / 2, cy = frY + frH / 2;
      const s0x = 34 / frW, s0y = 34 / frH;
      frame.style.transform =
        `translate3d(${(frX + (1 - fr) * (dx - cx)).toFixed(2)}px, ${(frY + (1 - fr) * (dy - cy)).toFixed(2)}px, 0) ` +
        `scale(${(s0x + (1 - s0x) * fr).toFixed(4)}, ${(s0y + (1 - s0y) * fr).toFixed(4)})`;
      frame.style.opacity = clamp(fr * 1.6, 0, 1).toFixed(3);
    }

    const moving =
      Math.abs(x - dx) + Math.abs(y - dy) > 0.15 ||
      Math.abs(st - stT) > 0.002 ||
      Math.abs(tsx - sx) + Math.abs(tsy - sy) + Math.abs(vsx) + Math.abs(vsy) > 0.002 ||
      Math.abs(frT - fr) + Math.abs(vfr) > 0.002 ||
      busy;
    if (moving) raf = requestAnimationFrame(loop);
  };
  function kick() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  const hide = () => {
    on = false;
    root.classList.add("is-off");
    setMode({ mode: "default" });
  };

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX;
    y = e.clientY;
    if (!on) {
      on = true;
      dx = x; dy = y;
      root.classList.remove("is-off");
    }
    kick();
  }, { passive: true });
  document.addEventListener("pointerover", (e) => { if (e.pointerType === "mouse") setMode(resolve(e.target)); });
  document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) hide(); });
  addEventListener("blur", hide);
  addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") { hide(); return; } // schermo touch su un computer: niente goccia
    ripple(e.clientX, e.clientY, root.dataset.tone || currentTone());
    root.classList.add("is-down");
  }, { passive: true });
  addEventListener("pointerup", () => root.classList.remove("is-down"), { passive: true });

  // scorrendo con il mouse fermo cambia l'elemento sotto il puntatore
  let scrollTimer = 0;
  addEventListener("scroll", () => {
    if (!on) return;
    kick();
    if (scrollTimer) return;
    scrollTimer = setTimeout(() => {
      scrollTimer = 0;
      setMode(resolve(document.elementFromPoint(x, y)));
    }, 90);
  }, { passive: true });
})();
