/* =========================================================
   Carestia Web — scene.js (Three.js da cdnjs)
   1. "Liquido di luce": sfondo in shader che cambia colore per sezione e filtro.
      Si disegna a risoluzione ridotta (è morbido, non serve di più) e ha un tetto
      di luminosità, così il testo sopra resta sempre leggibile.
   2. "Vetrine sospese": pannelli con gli screenshot veri dei siti, a piena risoluzione.
      Vagano lenti per la scena, girano attorno al testo dell'hero e tengono la distanza
      tra loro; scorrendo volano verso la camera e poi atterrano sulle carte dei lavori.
   Sul telefono meno pannelli (mai meno qualità); il movimento si ferma fuori dall'hero.
   ========================================================= */

import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js";

THREE.ColorManagement.enabled = false; // sfondo e tinte lavorano in sRGB, come il CSS

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

/* composizione di riposo dell'hero, da cui ogni pannello parte a vagare.
   fx/fy: centro a schermo (-1…1); z: profondità; size: altezza a schermo (frazione della finestra);
   wmax: larghezza massima a schermo (frazione della finestra) */
const LAYOUT_COMPUTER = [
  { fx: 0.6, fy: -0.06, z: 2.2, size: 0.3, wmax: 0.32, rx: 0.04, ry: -0.3, rz: 0.015 },
  { fx: 0.82, fy: 0.62, z: -1, size: 0.15, wmax: 0.17, rx: 0.06, ry: -0.42, rz: 0.02 },
  { fx: 0.8, fy: -0.66, z: -0.4, size: 0.16, wmax: 0.18, rx: -0.05, ry: -0.36, rz: -0.02 },
  { fx: 0.38, fy: 0.67, z: -6, size: 0.12, wmax: 0.15, rx: 0.08, ry: -0.18, rz: -0.02 },
  { fx: 0.3, fy: -0.78, z: -4, size: 0.11, wmax: 0.14, rx: -0.08, ry: -0.2, rz: 0.02 },
  { fx: -0.42, fy: 0.72, z: -10, size: 0.09, wmax: 0.12, rx: 0.06, ry: 0.22, rz: 0.02 },
  { fx: -0.72, fy: -0.84, z: -9, size: 0.1, wmax: 0.13, rx: -0.06, ry: 0.25, rz: -0.02 },
  { fx: 0.05, fy: 0.8, z: -13, size: 0.08, wmax: 0.1, rx: 0, ry: -0.1, rz: -0.02 },
];
/* telefono: testo in basso, composizione nello spazio libero tra la barra in alto e il titolo */
const LAYOUT_TELEFONO = [
  { fx: -0.48, fy: 0.42, z: 1.2, size: 0.36, wmax: 0.4, rx: 0.05, ry: 0.3, rz: -0.04 },
  { fx: 0.5, fy: 0.46, z: -0.6, size: 0.32, wmax: 0.36, rx: 0.04, ry: -0.32, rz: 0.04 },
  { fx: 0.02, fy: 0.3, z: -5, size: 0.17, wmax: 0.2, rx: 0.08, ry: 0.04, rz: 0.02 },
  { fx: 0.97, fy: 0.62, z: -8, size: 0.17, wmax: 0.2, rx: 0, ry: -0.36, rz: -0.03 },
  { fx: -0.98, fy: 0.2, z: -9, size: 0.16, wmax: 0.19, rx: 0.05, ry: 0.38, rz: 0.03 },
  { fx: 0.0, fy: 0.74, z: -11, size: 0.1, wmax: 0.13, rx: 0.1, ry: 0.1, rz: -0.02 },
  { fx: 0.6, fy: 0.12, z: -12, size: 0.1, wmax: 0.13, rx: 0, ry: -0.2, rz: 0.02 },
  { fx: -0.6, fy: 0.8, z: -12, size: 0.1, wmax: 0.13, rx: 0, ry: 0.2, rz: -0.02 },
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
  gl_FragColor = vec4(col, 1.0);
}`;

/* lo sfondo a bassa risoluzione viene allargato qui, con una grana finissima contro le bande */
const OUT_FRAG = /* glsl */ `
uniform sampler2D uBg; uniform float uTime; varying vec2 vUv;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  vec3 col = texture2D(uBg, vUv).rgb + (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
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
uniform float uBias; uniform float uDim; uniform float uGlass;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  vec2 q = abs(p) - (uSize * 0.5 - uRadius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float aa = fwidth(d);
  float mask = 1.0 - smoothstep(-aa, aa, d);
  // screenshot letto così com'è: texture sRGB con mipmap, il bias sfoca solo i pannelli lontani
  vec3 col = sRGBTransferOETF(texture2D(uMap, vec2(vUv.x, (1.0 - vUv.y) * uCrop), uBias)).rgb;
  col = mix(vec3(0.09, 0.07, 0.2), col, uReady);
  // bordo acceso sottile + riflesso a vetro leggerissimo che non copre il sito
  float rim = 1.0 - smoothstep(aa, aa * 3.0 + 0.004 * min(uSize.x, uSize.y), -d);
  float band = smoothstep(0.07, 0.0, abs(vUv.x + vUv.y * 0.55 - fract(uTime * 0.045 + uSeed) * 3.4 + 0.7));
  float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
  col += uTint * rim * 0.8 + vec3(band * 0.05 + fres * 0.08) * uGlass;
  col = mix(col, vec3(0.047, 0.031, 0.125), uDim);
  gl_FragColor = vec4(col, mask * uOpacity);
}`;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const mix = (a, b, t) => a + (b - a) * t;
const fract = (x) => x - Math.floor(x);

export function start({ canvas, gl, CW }) {
  const html = document.documentElement;
  const lite = matchMedia("(pointer: coarse)").matches || innerWidth < 900;
  const phoneCards = matchMedia("(max-width: 719px)");
  const stacked = matchMedia("(max-width: 899px)"); // testo dell'hero in basso, pannelli sopra
  const hero = document.querySelector(".hero");
  const footer = document.querySelector(".footer");
  const menu = document.getElementById("menu");
  const nav = document.getElementById("nav");
  const zoneEls = [...hero.querySelectorAll("[data-hero-title], .hero__lead, .hero__actions .btn")];

  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: false, alpha: false, powerPreference: "high-performance" });
  // pannelli sempre alla risoluzione dello schermo: la canvas non viene mai ingrandita dal CSS
  renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio || 1, lite ? 1.5 : 1), 2));
  renderer.setClearColor(0x0c0820, 1);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const FOV = 30, D = 10, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const halfH = (z) => (D - z) * TAN;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
  camera.position.set(0, 0, D);

  /* ---------- sfondo: disegnato piccolo in una texture, poi allargato ---------- */
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
  const quad = new THREE.PlaneGeometry(2, 2);
  const bgScene = new THREE.Scene();
  const bg = new THREE.Mesh(quad, new THREE.ShaderMaterial({ vertexShader: BG_VERT, fragmentShader: BG_FRAG, uniforms: bgU, depthTest: false, depthWrite: false, defines: { OCT: lite ? 3 : 4 } }));
  bg.frustumCulled = false;
  bgScene.add(bg);
  let bgScale = 0.5;
  const bgRT = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const backdrop = new THREE.Mesh(quad, new THREE.ShaderMaterial({ vertexShader: BG_VERT, fragmentShader: OUT_FRAG, uniforms: { uBg: { value: bgRT.texture }, uTime: bgU.uTime }, depthTest: false, depthWrite: false }));
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -10;
  scene.add(backdrop);

  /* ---------- pannelli ---------- */
  const geo = new THREE.PlaneGeometry(1, 1);
  const blank = new THREE.DataTexture(new Uint8Array([23, 17, 47, 255]), 1, 1);
  blank.needsUpdate = true;
  let kind = phoneCards.matches ? "telefono" : "computer";
  let drop = 0; // pannelli tolti se il dispositivo fatica
  const heroCount = () => (stacked.matches ? 5 : lite ? 6 : 7) - drop;
  const layout = () => (stacked.matches ? LAYOUT_TELEFONO : LAYOUT_COMPUTER);

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
      uBias: { value: 0 },
      uDim: { value: 0 },
      uGlass: { value: 1 },
    };
    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: PANEL_VERT, fragmentShader: PANEL_FRAG, uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    mesh.visible = false;
    scene.add(mesh);
    const card = CW.cards[i];
    const r = (n) => fract(Math.sin((i + 1) * n) * 43758.5453);
    return {
      i, u, mesh, card,
      mediaEl: card && card.querySelector(".card__media"),
      seed: r(91.7),
      // percorso personale: frequenze e fasi diverse per ogni pannello
      wf: [0.21, 0.34, 0.17, 0.29, 0.13].map((f, k) => f * (0.8 + 0.4 * r(12.9 + k * 7.1))),
      wp: [0, 1, 2, 3, 4, 5, 6].map((k) => r(78.2 + k * 3.7) * Math.PI * 2),
      far: { fx: fract(i * 0.618 + 0.2) * 2 - 1, fy: fract(i * 0.382 + 0.5) * 2 - 1, z: -24 - (i % 4) * 3, rx: (fract(i * 0.71) - 0.5) * 1.2, ry: (fract(i * 0.53) - 0.5) * 1.6, rz: (fract(i * 0.29) - 0.5) * 0.6 },
      home: null, rank: 0, rect: null, last: { frame: -1, shot: -1 }, tex: null, texAspect: 0, readyT: -1,
      ox: 0, oy: 0, cx: 0, cy: 0, sx: 0, sy: 0, hx: 0, hy: 0, zc: 0, cover: 0, live: false, k: 0,
      op: 0, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, w: 1, hh: 1, bias: 0, dim: 0, glass: 1,
    };
  });

  /* ---------- screenshot: prima quelli in primo piano, decodificati fuori dal thread principale ---------- */
  let gen = 0, t = 0;
  const decode = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url);
    const blob = await res.blob();
    try { return await createImageBitmap(blob); }
    catch (e) { const img = new Image(); img.src = URL.createObjectURL(blob); await img.decode(); return img; }
  };
  const loadTexture = async (p, k, g) => {
    const w = CW.works[p.i];
    for (const url of [w.img3d[k], w.img[k]]) {
      try {
        const image = await decode(url);
        if (g !== gen) return;
        const tex = new THREE.Texture(image);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false; // l'immagine arriva dritta, lo shader la legge dall'alto
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = maxAniso;
        tex.needsUpdate = true;
        renderer.initTexture(tex);
        if (p.tex) p.tex.dispose();
        p.tex = tex;
        p.u.uMap.value = tex;
        p.texAspect = image.width / image.height;
        if (p.readyT < 0) p.readyT = t;
        layoutHome();
        return;
      } catch (e) { /* prova l'immagine successiva */ }
    }
  };
  const loadTextures = async () => {
    const g = ++gen;
    const L = layout();
    const key = (p) => (p.i < heroCount() ? 0 : 100) - L[p.i % L.length].z;
    const queue = [...panels].sort((a, b) => key(a) - key(b));
    const worker = async () => { while (queue.length) await loadTexture(queue.shift(), kind, g); };
    await Promise.all([worker(), worker()]);
  };

  /* ---------- misure (cache: niente letture del layout a ogni fotogramma) ---------- */
  let cw = 1, ch = 1, heroH = 1, footerTop = Infinity, navB = 0;
  let zone = []; // rettangoli di titolo, sottotitolo e pulsanti (px della pagina): i pannelli li evitano

  const layoutHome = () => {
    const L = layout();
    const aspect = cw / ch;
    // telefono: la composizione si adatta allo spazio tra la barra in alto e il titolo
    let top = 0.85, bottom = 0.02;
    if (stacked.matches && zone.length) {
      top = 1 - (navB / ch) * 2 - 0.02;
      bottom = 1 - (Math.min(...zone.map((r) => r.t)) / ch) * 2 + 0.03;
    }
    const fit = stacked.matches ? clamp((top - bottom) / 0.83, 0.55, 1.15) : 1;
    panels.forEach((p) => {
      const s = L[p.i % L.length];
      const ta = p.texAspect || (kind === "telefono" ? 0.462 : 1.6);
      let hN = s.size * 2 * fit;
      const wN = (hN * ta) / aspect;
      if (wN > s.wmax * 2) hN *= (s.wmax * 2) / wN;
      p.home = { ...s, fy: stacked.matches ? bottom + ((s.fy - 0.02) / 0.83) * (top - bottom) : s.fy, hh: hN * halfH(s.z) };
    });
    panels.filter((p) => p.i < heroCount()).sort((a, b) => b.home.z - a.home.z).forEach((p, n) => { p.rank = n; });
  };

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

  const measure = () => {
    cw = canvas.clientWidth || innerWidth;
    ch = canvas.clientHeight || innerHeight;
    renderer.setSize(cw, ch, false);
    bgRT.setSize(Math.max(2, Math.round(cw * bgScale)), Math.max(2, Math.round(ch * bgScale)));
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    bgU.uRes.value.set(cw, ch);
    heroH = hero.offsetHeight;
    footerTop = footer.getBoundingClientRect().top + scrollY;
    navB = nav ? nav.getBoundingClientRect().bottom : 0;
    const pad = Math.max(14, Math.min(cw, ch) * 0.025);
    zone = zoneEls
      .flatMap(lineRects)
      .filter((r) => r.width)
      .map((r) => ({ l: r.left - pad, r: r.right + pad, t: r.top + scrollY - pad, b: r.bottom + scrollY + pad }));
    layoutHome();
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
  let handoff = false, introT = -1, ht = 0, last = performance.now(), raf = 0, lastScrollY = scrollY, lastScrollT = 0, skip = 0;
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

  /* i pannelli vicini escono dalla zona del testo dalla parte più corta; quelli lontani ci passano
     dietro attenuati. Tra loro tengono una distanza minima. Le spinte sono morbide (molle). */
  const avoid = (dt, sy, aspect) => {
    const live = panels.filter((p) => p.live);
    const rects = zone.map((r) => ({ l: (r.l / cw) * 2 - 1, r: (r.r / cw) * 2 - 1, t: 1 - ((r.t - sy) / ch) * 2, b: 1 - ((r.b - sy) / ch) * 2 }));
    if (navB) rects.push({ l: -2, r: 2, t: 2, b: 1 - (navB / ch) * 2 });
    const gx = 24 / cw, gy = 24 / ch;
    for (const p of live) {
      p.cx = 0; p.cy = 0; p.cover = 0;
      const near = p.zc > -3.5;
      for (const r of rects) {
        const ox = Math.min(p.sx + p.hx, r.r) - Math.max(p.sx - p.hx, r.l);
        const oy = Math.min(p.sy + p.hy, r.t) - Math.max(p.sy - p.hy, r.b);
        if (ox <= 0 || oy <= 0) continue;
        p.cover += (ox * oy) / (4 * p.hx * p.hy);
        if (!near) continue;
        const exits = [[r.l - (p.sx + p.hx), 0], [r.r - (p.sx - p.hx), 0], [0, r.b - (p.sy + p.hy)], [0, r.t - (p.sy - p.hy)]];
        let best = exits[0], bestPx = Infinity;
        for (const e of exits) {
          const px = Math.abs(e[0]) * cw + Math.abs(e[1]) * ch;
          if (px < bestPx) { best = e; bestPx = px; }
        }
        p.cx += best[0];
        p.cy += best[1];
      }
      // i pannelli vicini restano dentro lo schermo
      if (near) {
        const over = p.sx + p.hx - 0.98, under = -0.98 - (p.sx - p.hx), low = -0.97 - (p.sy - p.hy);
        if (over > 0) p.cx -= over;
        else if (under > 0) p.cx += under;
        if (low > 0) p.cy += low;
      }
    }
    for (let a = 0; a < live.length; a++) {
      for (let b = a + 1; b < live.length; b++) {
        const P = live[a], Q = live[b];
        // molto distanti in profondità possono sfiorarsi appena, altrimenti c'è sempre un po' di aria
        const deep = Math.abs(P.zc - Q.zc) > 4;
        const ox = P.hx + Q.hx + (deep ? -0.18 * Math.min(P.hx, Q.hx) : gx) - Math.abs(P.sx - Q.sx);
        const oy = P.hy + Q.hy + (deep ? -0.18 * Math.min(P.hy, Q.hy) : gy) - Math.abs(P.sy - Q.sy);
        if (ox <= 0 || oy <= 0) continue;
        const wp = Q.hy / (P.hy + Q.hy); // si sposta di più il pannello più piccolo
        if (ox * cw < oy * ch) {
          const s = Math.sign(P.sx - Q.sx) || 1;
          P.cx += s * ox * wp; Q.cx -= s * ox * (1 - wp);
        } else {
          const s = Math.sign(P.sy - Q.sy) || 1;
          P.cy += s * oy * wp; Q.cy -= s * oy * (1 - wp);
        }
      }
    }
    const kp = Math.min(1, dt * 3), kb = Math.min(1, dt * 0.45);
    for (const p of live) {
      p.ox = clamp(p.ox + p.cx * kp - p.ox * kb, -0.8, 0.8);
      p.oy = clamp(p.oy + p.cy * kp - p.oy * kb, -0.8, 0.8);
      const c = Math.min(1, p.cover);
      if (c > 0) {
        p.op *= 1 - c * (p.zc > -3.5 ? 0.5 : 0.65);
        p.dim = Math.max(p.dim, c * 0.45);
        p.bias += c * 0.8;
      }
    }
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
    const inHero = h < 1;
    let landing = false;
    for (const p of panels) if (handoff && p.rect && p.k > 0 && p.k < 1) landing = true;
    t += dt;
    // fuori dall'hero e senza scorrimento: 30 fps, pannelli fermi
    const idle = !inHero && !landing && now - lastScrollT > 400;
    if (idle) { skip ^= 1; if (skip) return; } else skip = 0;
    const calm = stacked.matches ? 0.5 : 1; // telefono: movimento più calmo
    if (inHero) ht += dt * (stacked.matches ? 0.75 : 1);

    if (!hasMouse && !gyro) { tmx = Math.sin(t * 0.32) * 0.3; tmy = Math.cos(t * 0.25) * 0.2; }
    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;

    bgU.uTime.value = t;
    bgU.uMouse.value.set(mx, -my);
    bgU.uScroll.value = sy / ch;
    bgU.uA.value.lerp(target[0], 0.03);
    bgU.uB.value.lerp(target[1], 0.03);
    bgU.uC.value.lerp(target[2], 0.03);

    const aspect = cw / ch;
    const H0 = 2 * D * TAN, W0 = H0 * aspect;
    const he = Math.pow(h, 1.5);
    const count = heroCount();

    for (const p of panels) {
      p.u.uTime.value = t;
      p.op = 0; p.bias = 0; p.dim = 0; p.glass = 1; p.live = false;
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
        p.x = mix(f.fx * halfH(f.z) * aspect, (cx / cw - 0.5) * W0, e);
        p.y = mix(f.fy * halfH(f.z), -(cy / ch - 0.5) * H0, e);
        p.z = mix(f.z, 0, e);
        p.rx = mix(f.rx, 0, e); p.ry = mix(f.ry, 0, e); p.rz = mix(f.rz, 0, e);
        p.w = (r.width / cw) * W0;
        p.hh = (r.height / ch) * H0;
        p.u.uCrop.value = Math.min(1, (r.height / r.width) * (p.texAspect || 1));
        p.u.uRadius.value = (17 / ch) * H0;
        p.glass = 0;
        p.op = smooth(0, 0.18, k) * (1 - smooth(0.93, 1, k));
        setVar(p, smooth(0.5, 0.88, k), smooth(0.9, 1, k));
        continue;
      }
      if (handoff) setVar(p, 0, 0);
      const s = p.home;
      if (!inHero || p.i >= count || !s || p.readyT < 0 || introT < 0) continue;

      // vagare: somme di seni lente, ognuna con il suo ritmo
      const arrive = easeOut(clamp((t - Math.max(introT, p.readyT) - p.rank * 0.12) / 1.6));
      const f = p.wf, ph = p.wp;
      const depth = clamp(-s.z / 12), near = 1 - depth;
      const zr = s.z + calm * mix(0.5, 1.6, depth) * Math.sin(ht * f[4] + ph[4]);
      let fx = s.fx + calm * 0.07 * (0.62 * Math.sin(ht * f[0] + ph[0]) + 0.38 * Math.sin(ht * f[1] + ph[1]));
      let fy = s.fy + calm * 0.055 * (0.6 * Math.sin(ht * f[2] + ph[2]) + 0.4 * Math.cos(ht * f[3] + ph[3]));
      fx += mx * (0.012 + 0.03 * near) * calm + p.ox;
      fy += -my * (0.01 + 0.022 * near) * calm + p.oy;
      const z = zr - (1 - arrive) * 26 + he * (D + 2.5 - zr) * (0.92 + p.seed * 0.25);
      fx *= 1 + he * 0.8;
      fy = fy * (1 + he * 0.35) + he * 0.25;
      const hz = Math.max(0.35, halfH(z));
      p.z = z;
      p.x = fx * hz * aspect;
      p.y = fy * hz;
      p.hh = s.hh;
      p.w = s.hh * (p.texAspect || (kind === "telefono" ? 0.462 : 1.6));
      p.rx = s.rx + my * 0.1 * calm + 0.05 * calm * Math.sin(ht * f[2] * 1.3 + ph[5]);
      p.ry = s.ry + mx * 0.2 * calm + 0.1 * calm * Math.sin(ht * f[0] * 1.1 + ph[6]);
      p.rz = s.rz + 0.025 * calm * Math.sin(ht * f[1] + ph[2]);
      p.u.uCrop.value = 1;
      p.u.uRadius.value = s.hh * (kind === "telefono" ? 0.05 : 0.03);
      // profondità: solo i pannelli lontani si sfocano un poco e si attenuano
      const far = smooth(-4, -12, z);
      p.bias = far * 1.4;
      p.dim = far * 0.3;
      p.op = arrive * (1 - smooth(D - 2.8, D - 0.4, z));
      p.live = p.op > 0.002;
      p.sx = fx; p.sy = fy; p.zc = z;
      p.hy = s.hh / 2 / hz;
      p.hx = p.w / 2 / (hz * aspect);
    }
    if (inHero) avoid(dt, sy, aspect);

    for (const p of panels) {
      const { u, mesh } = p;
      u.uOpacity.value = p.op;
      u.uBias.value = p.bias;
      u.uDim.value = p.dim;
      u.uGlass.value = p.glass;
      u.uReady.value = Math.min(1, u.uReady.value + (p.tex ? dt * 2 : 0));
      mesh.visible = p.op > 0.002;
      if (!mesh.visible) continue;
      u.uSize.value.set(p.w, p.hh);
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.set(p.rx, p.ry, p.rz);
      mesh.scale.set(p.w, p.hh, 1);
    }

    renderer.setRenderTarget(bgRT);
    renderer.render(bgScene, camera);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    if (!canvas.classList.contains("is-ready")) canvas.classList.add("is-ready");

    // se il dispositivo fatica: prima uno sfondo più leggero, poi un pannello in meno (mai meno nitidezza)
    if (inHero && t > 2.5 && checks < 3 && !idle) {
      frames++;
      acc += dt;
      if (frames >= 90) {
        if (acc / frames > 1 / 42) {
          if (checks === 0) bgScale = 0.35;
          else if (heroCount() > 4) drop++;
          else bgScale = 0.25;
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

  // ogni pannello entra appena il suo screenshot è pronto, dopo l'intro
  const loaded = loadTextures();
  const intro = CW.introDone || Promise.resolve();
  intro.then(() => {
    introT = t;
    setTimeout(queueMeasure, 1600); // il testo dell'hero ha finito di entrare: zona libera definitiva
  });
  Promise.all([Promise.race([loaded, new Promise((r) => setTimeout(r, 3500))]), intro]).then(() => {
    measure();
    if (CW.handoff !== false && CW.filter === "tutti") {
      handoff = true;
      CW.handoff = true;
      html.classList.add("has-handoff");
    }
  });
}
