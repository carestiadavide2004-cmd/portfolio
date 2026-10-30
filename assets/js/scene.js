/* =========================================================
   Carestia Web — scene.js (Three.js da cdnjs)
   "Liquido di luce": sfondo in shader che cambia colore per sezione e filtro.
   Si disegna a risoluzione ridotta (è morbido, non serve di più) e ha un tetto
   di luminosità, così il testo sopra resta sempre leggibile.
   I pannelli con i siti dell'hero sono veri <img> in CSS 3D: vedi panels.js.
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

const VERT = /* glsl */ `
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

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function start({ canvas, gl, CW }) {
  const lite = matchMedia("(pointer: coarse)").matches || innerWidth < 900;
  const footer = document.querySelector(".footer");
  const menu = document.getElementById("menu");

  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0c0820, 1);
  const camera = new THREE.Camera();

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
  const bg = new THREE.Mesh(quad, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: BG_FRAG, uniforms: bgU, depthTest: false, depthWrite: false, defines: { OCT: lite ? 3 : 4 } }));
  bg.frustumCulled = false;
  bgScene.add(bg);
  let bgScale = 0.5;
  const bgRT = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const scene = new THREE.Scene();
  const out = new THREE.Mesh(quad, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: OUT_FRAG, uniforms: { uBg: { value: bgRT.texture }, uTime: bgU.uTime }, depthTest: false, depthWrite: false }));
  out.frustumCulled = false;
  scene.add(out);

  /* ---------- misure ---------- */
  let cw = 1, ch = 1, footerTop = Infinity;
  const measure = () => {
    cw = canvas.clientWidth || innerWidth;
    ch = canvas.clientHeight || innerHeight;
    renderer.setSize(cw, ch, false);
    bgRT.setSize(Math.max(2, Math.round(cw * bgScale)), Math.max(2, Math.round(ch * bgScale)));
    bgU.uRes.value.set(cw, ch);
    footerTop = footer.getBoundingClientRect().top + scrollY;
  };
  let measureQueued = false;
  const queueMeasure = () => {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(() => { measureQueued = false; measure(); });
  };
  new ResizeObserver(queueMeasure).observe(document.body);
  new ResizeObserver(queueMeasure).observe(canvas);
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

  /* ---------- disegno ---------- */
  let t = 0, last = performance.now(), raf = 0, lastScrollY = scrollY, lastScrollT = 0, skip = 0;
  let frames = 0, acc = 0, checks = 0;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    const sy = scrollY;
    if (sy !== lastScrollY) { lastScrollY = sy; lastScrollT = now; }
    // niente da disegnare: scheda o menu aperti, oppure il footer copre tutto lo schermo
    if (CW.sheetOpen || (menu && !menu.hidden) || sy >= footerTop) return;
    t += dt;
    // sfondo lento: senza scorrimento basta metà dei fotogrammi
    const idle = now - lastScrollT > 400;
    if (idle) { skip ^= 1; if (skip) return; } else skip = 0;

    if (!hasMouse && !gyro) { tmx = Math.sin(t * 0.32) * 0.3; tmy = Math.cos(t * 0.25) * 0.2; }
    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;
    bgU.uTime.value = t;
    bgU.uMouse.value.set(mx, -my);
    bgU.uScroll.value = sy / ch;
    bgU.uA.value.lerp(target[0], 0.03);
    bgU.uB.value.lerp(target[1], 0.03);
    bgU.uC.value.lerp(target[2], 0.03);

    renderer.setRenderTarget(bgRT);
    renderer.render(bgScene, camera);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    if (!canvas.classList.contains("is-ready")) canvas.classList.add("is-ready");

    // se il dispositivo fatica, lo sfondo si disegna ancora più piccolo
    if (t > 2.5 && checks < 2) {
      frames++;
      acc += dt;
      if (frames >= 60) {
        if (acc / frames > 1 / 24 && bgScale > 0.25) { bgScale = bgScale > 0.4 ? 0.35 : 0.25; measure(); }
        frames = 0; acc = 0; checks++;
      }
    }
  };
  raf = requestAnimationFrame(frame);

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    document.documentElement.classList.add("no3d");
  });

  CW.scene = { setTint(name) { tint(name).forEach((c, i) => target[i].set(c)); } };
  CW.scene.setTint(CW.tint);
}
