/* =========================================================
   Carestia Web — scene.js (Three.js da cdnjs)
   1. "Liquido di luce": sfondo in shader che cambia colore per sezione e filtro.
      Ha un tetto di luminosità, così il testo sopra resta sempre leggibile.
   2. "Vetrine sospese": pannelli di vetro con gli screenshot veri dei siti.
      Seguono mouse o giroscopio, volano verso la camera mentre scorri
      e poi atterrano esattamente sulle carte dei lavori.
   Più leggera sul telefono, si ferma quando non serve.
   ========================================================= */

import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js";

THREE.ColorManagement.enabled = false; // colori e immagini passano così come sono (sRGB)

const TINTS = {
  hero: ["#7B3CFF", "#2E5BFF", "#FF2E55"],
  trust: ["#FF2E55", "#7B3CFF", "#2E5BFF"],
  work: ["#7B3CFF", "#2E5BFF", "#FF2E55"],
  "work:ristoranti": ["#FF2E55", "#FF6A3D", "#7B3CFF"],
  "work:stabilimenti": ["#2E5BFF", "#1FC8FF", "#7B3CFF"],
  "work:bellezza": ["#9D5CFF", "#E04DFF", "#2E5BFF"],
  "work:negozi": ["#C9C2FF", "#7B3CFF", "#2E5BFF"],
  "work:palestre": ["#A8F000", "#2E5BFF", "#7B3CFF"],
  screens: ["#2E5BFF", "#1FC8FF", "#7B3CFF"],
  services: ["#A8F000", "#2E5BFF", "#9D5CFF"],
  process: ["#7B3CFF", "#FF2E55", "#2E5BFF"],
  about: ["#FF2E55", "#9D5CFF", "#2E5BFF"],
  contact: ["#A8F000", "#7B3CFF", "#2E5BFF"],
};

/* posizioni nell'hero: fx/fy sono coordinate dello schermo (-1…1), z la profondità */
const LAYOUT_COMPUTER = [
  { fx: 0.5, fy: 0.3, z: 1.2, rx: 0.06, ry: -0.36, rz: 0.02, s: 1.25 },
  { fx: 0.14, fy: -0.26, z: -1.6, rx: -0.05, ry: -0.22, rz: -0.03, s: 1.1 },
  { fx: 0.8, fy: -0.42, z: -0.4, rx: 0.04, ry: -0.5, rz: 0.03, s: 1.0 },
  { fx: 0.42, fy: 0.64, z: -5, rx: 0.1, ry: -0.16, rz: -0.02, s: 1.2 },
  { fx: 0.9, fy: 0.62, z: -3.5, rx: 0.05, ry: -0.55, rz: 0.02, s: 1.1 },
  { fx: 0.56, fy: -0.88, z: -4.6, rx: -0.12, ry: -0.3, rz: 0.03, s: 1.15 },
  { fx: -0.42, fy: 0.74, z: -9, rx: 0.08, ry: 0.25, rz: 0.02, s: 1.3 },
  { fx: 0.98, fy: -0.06, z: -12, rx: 0, ry: -0.4, rz: -0.03, s: 1.4 },
];
const LAYOUT_TELEFONO = [
  { fx: -0.46, fy: 0.42, z: 0.8, rx: 0.05, ry: 0.32, rz: -0.05, s: 1.0 },
  { fx: 0.46, fy: 0.5, z: -0.8, rx: 0.04, ry: -0.34, rz: 0.05, s: 0.95 },
  { fx: 0.0, fy: 0.27, z: -3.6, rx: 0.08, ry: 0.04, rz: 0.02, s: 1.0 },
  { fx: 0.8, fy: 0.21, z: -5.2, rx: 0, ry: -0.36, rz: -0.03, s: 1.0 },
  { fx: -0.84, fy: 0.23, z: -6.2, rx: 0.05, ry: 0.4, rz: 0.03, s: 1.0 },
  { fx: 0.04, fy: 0.62, z: -10, rx: 0.1, ry: 0.1, rz: -0.02, s: 1.1 },
  { fx: 0.6, fy: 0.9, z: -11, rx: 0, ry: -0.2, rz: 0.02, s: 1.0 },
  { fx: -0.6, fy: 0.9, z: -12, rx: 0, ry: 0.2, rz: -0.02, s: 1.0 },
];

const BG_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;

const BG_FRAG = /* glsl */ `
uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uScroll; uniform float uCap;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uBase;
varying vec2 vUv;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < OCT; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  p += uMouse * 0.05;
  float t = uTime * 0.045;
  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t)), fbm(p * 1.3 + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p * 1.1 + 2.2 * q + vec2(1.7, 9.2) + 0.12 * uScroll + t), fbm(p * 1.1 + 2.2 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.2 + 2.5 * r);
  vec3 col = uBase;
  col = mix(col, uA, smoothstep(0.22, 0.85, f));
  col = mix(col, uB, smoothstep(0.38, 0.98, length(q)) * 0.9);
  col = mix(col, uC, smoothstep(0.46, 0.9, r.y) * 0.85);
  float ridge = pow(1.0 - abs(sin(f * 10.0 + t * 3.0)), 8.0);
  col += ridge * 0.1 * (uA + uB);
  float v = smoothstep(1.3, 0.15, length(p * vec2(0.8, 1.0)));
  col = mix(uBase, col, 0.5 + 0.5 * v);
  vec3 lin = pow(max(col, 0.0), vec3(2.2));
  float L = dot(lin, vec3(0.2126, 0.7152, 0.0722));
  col *= pow(min(1.0, uCap / max(L, 1e-4)), 1.0 / 2.2);
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

const PANEL_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const PANEL_FRAG = /* glsl */ `
uniform sampler2D uMap; uniform vec2 uSize; uniform float uRadius; uniform float uOpacity;
uniform vec3 uTint; uniform float uCrop; uniform float uTime; uniform float uSeed; uniform float uReady;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  vec2 q = abs(p) - (uSize * 0.5 - uRadius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float aa = fwidth(d) * 1.2;
  float mask = 1.0 - smoothstep(-aa, aa, d);
  vec3 col = texture2D(uMap, vec2(vUv.x, 1.0 - (1.0 - vUv.y) * uCrop)).rgb;
  col = mix(vec3(0.09, 0.07, 0.2), col, uReady);
  float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
  float edge = 1.0 - smoothstep(0.0, 0.06 * min(uSize.x, uSize.y), -d);
  float sweep = smoothstep(0.1, 0.0, abs(vUv.x + vUv.y * 0.6 - fract(uTime * 0.07 + uSeed) * 2.8 + 0.4));
  col += uTint * edge * 0.6 + uTint * fres * 0.3 + vec3(sweep * 0.14);
  gl_FragColor = vec4(col, mask * uOpacity);
}`;

const HALO_FRAG = /* glsl */ `
uniform vec3 uTint; uniform float uOpacity; varying vec2 vUv;
void main() { float a = smoothstep(0.5, 0.0, length(vUv - 0.5)); gl_FragColor = vec4(uTint, a * a * uOpacity); }`;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const mix = (a, b, t) => a + (b - a) * t;
const fract = (x) => x - Math.floor(x);

export function start({ canvas, gl, CW }) {
  const html = document.documentElement;
  const lite = matchMedia("(pointer: coarse)").matches || innerWidth < 900;
  const phoneCards = matchMedia("(max-width: 719px)");
  const hero = document.querySelector(".hero");
  const footer = document.querySelector(".footer");
  const menu = document.getElementById("menu");

  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: false, alpha: false, powerPreference: "high-performance" });
  let dpr = Math.min(devicePixelRatio || 1, lite ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x0c0820, 1);
  const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const FOV = 30, D = 10, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
  camera.position.set(0, 0, D);

  /* ---------- sfondo ---------- */
  const tint = (name) => TINTS[name] || TINTS[String(name).split(":")[0]] || TINTS.hero;
  const startTint = tint(CW.tint);
  const bgU = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2() },
    uScroll: { value: 0 },
    uCap: { value: 0.085 },
    uA: { value: new THREE.Color(startTint[0]) },
    uB: { value: new THREE.Color(startTint[1]) },
    uC: { value: new THREE.Color(startTint[2]) },
    uBase: { value: new THREE.Color("#0C0820") },
  };
  const target = startTint.map((c) => new THREE.Color(c));
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ vertexShader: BG_VERT, fragmentShader: BG_FRAG, uniforms: bgU, depthTest: false, depthWrite: false, defines: { OCT: lite ? 3 : 4 } })
  );
  bg.frustumCulled = false;
  bg.renderOrder = -10;
  scene.add(bg);

  /* ---------- pannelli ---------- */
  const geo = new THREE.PlaneGeometry(1, 1);
  const loader = new THREE.TextureLoader();
  const blank = new THREE.DataTexture(new Uint8Array([23, 17, 47, 255]), 1, 1);
  blank.needsUpdate = true;
  let kind = phoneCards.matches ? "telefono" : "computer";

  const panels = CW.works.map((w, i) => {
    const u = {
      uMap: { value: blank },
      uSize: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 0.06 },
      uOpacity: { value: 0 },
      uTint: { value: new THREE.Color(w.colore) },
      uCrop: { value: 1 },
      uTime: { value: 0 },
      uSeed: { value: (i * 0.37) % 1 },
      uReady: { value: 0 },
    };
    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: PANEL_VERT, fragmentShader: PANEL_FRAG, uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    mesh.visible = false;
    scene.add(mesh);
    let halo = null;
    if (!lite) {
      halo = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: PANEL_VERT, fragmentShader: HALO_FRAG, uniforms: { uTint: u.uTint, uOpacity: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.visible = false;
      scene.add(halo);
    }
    const card = CW.cards[i];
    return {
      i, u, mesh, halo, card,
      mediaEl: card && card.querySelector(".card__media"),
      seed: fract(Math.sin(i * 91.7) * 43758.5),
      far: { fx: fract(i * 0.618 + 0.2) * 2 - 1, fy: fract(i * 0.382 + 0.5) * 2 - 1, z: -24 - (i % 4) * 3, rx: (fract(i * 0.71) - 0.5) * 1.2, ry: (fract(i * 0.53) - 0.5) * 1.6, rz: (fract(i * 0.29) - 0.5) * 0.6 },
      rect: null, last: { frame: -1, shot: -1 }, tex: null,
    };
  });

  const loadTextures = () =>
    Promise.all(
      panels.map((p) =>
        new Promise((resolve) => {
          const w = CW.works[p.i];
          loader.load(
            w.img[kind],
            (tex) => {
              tex.anisotropy = maxAniso;
              tex.minFilter = THREE.LinearMipmapLinearFilter;
              if (p.tex) p.tex.dispose();
              p.tex = tex;
              p.u.uMap.value = tex;
              p.texAspect = tex.image.width / tex.image.height;
              renderer.initTexture(tex);
              resolve();
            },
            undefined,
            () => resolve()
          );
        })
      )
    );

  /* ---------- misure (cache: niente letture del layout a ogni fotogramma) ---------- */
  let cw = 1, ch = 1, heroH = 1, footerTop = Infinity;
  const measure = () => {
    cw = canvas.clientWidth || innerWidth;
    ch = canvas.clientHeight || innerHeight;
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    bgU.uRes.value.set(cw, ch);
    heroH = hero.offsetHeight;
    footerTop = footer.getBoundingClientRect().top + scrollY;
    panels.forEach((p) => {
      if (!p.mediaEl) return;
      const r = p.mediaEl.getBoundingClientRect();
      p.rect = r.width ? { left: r.left, top: r.top + scrollY, width: r.width, height: r.height } : null;
    });
  };
  let measureQueued = false;
  const queueMeasure = () => {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(() => { measureQueued = false; measure(); });
  };
  new ResizeObserver(queueMeasure).observe(document.body);
  new ResizeObserver(queueMeasure).observe(canvas);
  if (document.fonts) document.fonts.ready.then(queueMeasure);
  phoneCards.addEventListener("change", () => {
    kind = phoneCards.matches ? "telefono" : "computer";
    loadTextures();
    queueMeasure();
  });
  measure();

  /* ---------- mouse, giroscopio o movimento automatico ---------- */
  let mx = 0, my = 0, tmx = 0, tmy = 0, hasMouse = false, gyro = false;
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    hasMouse = true;
    tmx = (e.clientX / innerWidth) * 2 - 1;
    tmy = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  addEventListener("deviceorientation", (e) => {
    if (e.gamma == null || e.beta == null) return;
    gyro = true;
    tmx = clamp(e.gamma / 28, -1, 1);
    tmy = clamp((e.beta - 45) / 28, -1, 1);
  }, { passive: true });

  /* ---------- stato ---------- */
  let handoff = false, arrived = false, arrivalT0 = 0, t = 0, last = performance.now(), raf = 0, lastScrollY = scrollY, lastScrollT = 0, skip = 0;
  let frames = 0, acc = 0, checks = 0;
  const setVar = (p, frame, shot) => {
    if (!p.card) return;
    if (Math.abs(frame - p.last.frame) > 0.004) { p.card.style.setProperty("--frame", frame.toFixed(3)); p.last.frame = frame; }
    if (Math.abs(shot - p.last.shot) > 0.004) { p.card.style.setProperty("--shot", shot.toFixed(3)); p.last.shot = shot; }
  };
  const stopHandoff = () => {
    handoff = false;
    html.classList.remove("has-handoff");
    panels.forEach((p) => { if (p.card) { p.card.style.removeProperty("--frame"); p.card.style.removeProperty("--shot"); } });
  };

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    const sy = scrollY;
    if (sy !== lastScrollY) { lastScrollY = sy; lastScrollT = now; }
    // niente da disegnare: scheda o menu aperti, oppure il footer copre tutto lo schermo
    if (CW.sheetOpen || (menu && !menu.hidden) || sy >= footerTop) return;
    const h = clamp(sy / (heroH * 0.95));
    let landing = false;
    for (const p of panels) if (handoff && p.rect && p.k > 0 && p.k < 1) landing = true;
    t += dt;
    // telefono: a 30 fps quando non succede niente
    const idle = lite && h >= 1 && !landing && now - lastScrollT > 400;
    if (idle) { skip ^= 1; if (skip) return; } else skip = 0;

    if (!hasMouse && !gyro) { tmx = Math.sin(t * 0.32) * 0.45; tmy = Math.cos(t * 0.25) * 0.25; }
    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;

    bgU.uTime.value = t;
    bgU.uMouse.value.set(mx, -my);
    bgU.uScroll.value = sy / ch;
    bgU.uA.value.lerp(target[0], 0.03);
    bgU.uB.value.lerp(target[1], 0.03);
    bgU.uC.value.lerp(target[2], 0.03);

    const aspect = cw / ch;
    const halfH = (z) => (D - z) * TAN;
    const H0 = 2 * D * TAN, W0 = H0 * aspect;
    const layout = kind === "telefono" ? LAYOUT_TELEFONO : LAYOUT_COMPUTER;
    const heroCount = lite ? 6 : 8;
    const baseH = kind === "telefono" ? 1.75 : 1.0;
    const he = Math.pow(h, 1.5);

    for (const p of panels) {
      const { u, mesh, halo } = p;
      u.uTime.value = t;
      let op = 0, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, w = 1, hh = 1;
      let k = 0;
      if (handoff && p.rect) {
        const top = p.rect.top - sy;
        k = clamp((ch * 1.02 - top) / (ch * 0.5));
      }
      p.k = k;

      if (k > 0) {
        // atterraggio sulla carta: dal fondo della scena alla posizione esatta della carta
        const e = easeOut(k);
        const r = p.rect;
        const cx = r.left + r.width / 2, cy = r.top - sy + r.height / 2;
        const f = p.far;
        x = mix(f.fx * halfH(f.z) * aspect, (cx / cw - 0.5) * W0, e);
        y = mix(f.fy * halfH(f.z), -(cy / ch - 0.5) * H0, e);
        z = mix(f.z, 0, e);
        rx = mix(f.rx, 0, e); ry = mix(f.ry, 0, e); rz = mix(f.rz, 0, e);
        w = (r.width / cw) * W0;
        hh = (r.height / ch) * H0;
        u.uCrop.value = Math.min(1, (r.height / r.width) * (p.texAspect || 1));
        u.uRadius.value = (17 / ch) * H0;
        op = smooth(0, 0.18, k) * (1 - smooth(0.93, 1, k));
        setVar(p, smooth(0.5, 0.88, k), smooth(0.9, 1, k));
      } else {
        if (handoff) setVar(p, 0, 0);
        const s = layout[p.i % layout.length];
        const arrive = !arrived ? 0 : easeOut(clamp((t - arrivalT0 - p.i * 0.09) / 1.6));
        z = s.z - (1 - arrive) * 26 + he * (D + 2.5 - s.z) * (0.92 + p.seed * 0.25);
        const fx = s.fx * (1 + he * 0.8) + mx * 0.035;
        const fy = s.fy * (1 + he * 0.35) + he * 0.25 - my * 0.03 + Math.sin(t * 0.7 + p.i * 1.7) * 0.012;
        x = fx * halfH(z) * aspect;
        y = fy * halfH(z);
        rx = s.rx + my * 0.12 + Math.sin(t * 0.5 + p.i) * 0.03;
        ry = s.ry + mx * 0.24 + Math.sin(t * 0.35 + p.i * 2.1) * 0.05;
        rz = s.rz + Math.sin(t * 0.4 + p.i * 0.9) * 0.015;
        hh = baseH * s.s;
        w = hh * (p.texAspect || (kind === "telefono" ? 0.46 : 1.6));
        u.uCrop.value = 1;
        u.uRadius.value = kind === "telefono" ? 0.12 : 0.05;
        op = p.i < heroCount && h < 1 ? arrive * (1 - smooth(D - 2.8, D - 0.4, z)) : 0;
      }

      u.uOpacity.value = op;
      u.uReady.value = Math.min(1, u.uReady.value + (p.tex ? dt * 2 : 0));
      u.uSize.value.set(w, hh);
      mesh.visible = op > 0.002;
      if (mesh.visible) {
        mesh.position.set(x, y, z);
        mesh.rotation.set(rx, ry, rz);
        mesh.scale.set(w, hh, 1);
      }
      if (halo) {
        halo.visible = mesh.visible && k === 0;
        if (halo.visible) {
          halo.position.set(x, y, z - 0.08);
          halo.rotation.copy(mesh.rotation);
          halo.scale.set(w * 1.5, hh * 1.6, 1);
          halo.material.uniforms.uOpacity.value = op * 0.32;
        }
      }
    }

    renderer.render(scene, camera);
    if (!canvas.classList.contains("is-ready")) canvas.classList.add("is-ready");

    // qualità automatica: se il dispositivo fatica, si abbassa la risoluzione
    if (t > 2 && checks < 3 && !idle) {
      frames++;
      acc += dt;
      if (frames >= 90) {
        if (acc / frames > 1 / 42 && dpr > 0.75) {
          dpr = Math.max(0.75, dpr - 0.25);
          renderer.setPixelRatio(dpr);
          measure();
        }
        frames = 0; acc = 0; checks++;
      }
    }
  };
  raf = requestAnimationFrame(frame);

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    stopHandoff();
    CW.handoff = false;
    html.classList.add("no3d");
  });

  CW.scene = {
    setTint(name) { tint(name).forEach((c, i) => target[i].set(c)); },
    stopHandoff,
  };
  CW.scene.setTint(CW.tint);

  // arrivo dei pannelli: dopo l'intro e quando gli screenshot sono pronti
  const ready = Promise.race([loadTextures(), new Promise((r) => setTimeout(r, 3500))]);
  Promise.all([ready, CW.introDone || Promise.resolve()]).then(() => {
    arrivalT0 = t;
    arrived = true;
    measure();
    if (CW.handoff !== false && CW.filter === "tutti") {
      handoff = true;
      CW.handoff = true;
      html.classList.add("has-handoff");
    }
  });
}
