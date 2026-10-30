/* =========================================================
   Carestia Web — fx.js
   Effetti allo scorrimento con GSAP + ScrollTrigger. Lo scorrimento resta nativo:
   nessuna sezione bloccata, nessuno scroll "finto". Si anima solo transform,
   opacity e clip-path. Con "riduci movimento" restano solo dissolvenze brevi.
   ========================================================= */

(() => {
  if (!window.gsap || !window.ScrollTrigger || !window.CW_CONFIG) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.Flip) gsap.registerPlugin(Flip);

  const html = document.documentElement;
  const CW = (window.CW = window.CW || {});
  const reduced = html.classList.contains("rm");
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* colore dello sfondo 3D in base alla sezione */
  $$("[data-tint]").forEach((sec) =>
    ScrollTrigger.create({
      trigger: sec,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => {
        if (!self.isActive || !CW.setTint) return;
        CW.setTint(sec.dataset.tint === "work" ? `work:${CW.filter || "tutti"}` : sec.dataset.tint);
      },
    })
  );

  if (reduced) {
    // movimento ridotto: solo dissolvenze brevi, tutto già al suo posto
    html.classList.add("no-steps");
    $$("main > section:not(.hero), .footer").forEach((sec) =>
      gsap.from(sec, { opacity: 0, duration: 0.4, ease: "power1.out", scrollTrigger: { trigger: sec, start: "top 90%", once: true } })
    );
    return;
  }

  html.classList.add("fx");

  const splitWords = (el) => {
    const text = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", text);
    el.textContent = "";
    return text.split(" ").map((word, i, all) => {
      const w = document.createElement("span");
      const wi = document.createElement("span");
      w.className = "w";
      w.setAttribute("aria-hidden", "true");
      wi.className = "wi";
      wi.textContent = word;
      w.appendChild(wi);
      el.appendChild(w);
      if (i < all.length - 1) el.appendChild(document.createTextNode(" "));
      return wi;
    });
  };

  /* ---------- hero: parole che ruotano in 3D dopo l'intro, poi parallasse a più livelli ---------- */
  const heroTitle = $("[data-hero-title]");
  const heroSub = $("[data-hero-sub]");
  const heroWords = splitWords(heroTitle);
  gsap.set(heroWords, { rotationX: -95, yPercent: 45, opacity: 0 });
  gsap.set(heroSub, { opacity: 0, y: 26 });
  (CW.introDone || Promise.resolve()).then(() => {
    gsap.to(heroWords, { rotationX: 0, yPercent: 0, opacity: 1, duration: 1.15, ease: "expo.out", stagger: 0.065, delay: 0.05 });
    gsap.to(heroSub, { opacity: 1, y: 0, duration: 1, ease: "expo.out", delay: 0.45 });
  });
  const heroST = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
  gsap.to(".hero__inner", { y: -90, opacity: 0.1, ease: "none", scrollTrigger: heroST });
  gsap.to(heroTitle, { yPercent: -22, ease: "none", scrollTrigger: heroST });

  /* ---------- titoli che si girano in 3D entrando ---------- */
  $$("[data-flip]").forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, {
      rotationX: -100,
      yPercent: 50,
      opacity: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: el.closest(".contact") ? "top 62%" : "top 86%", once: true },
    });
  });

  /* ---------- titoli a contorno che si riempiono di colore mentre scorri ---------- */
  const makeFill = (el, { start = "top 88%", end = "top 38%", from = "inset(100% 0% 0% 0%)" } = {}) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    ["fill__base", "fill__top"].forEach((cls) => {
      const s = document.createElement("span");
      s.className = cls;
      s.setAttribute("aria-hidden", "true");
      s.textContent = text;
      el.appendChild(s);
    });
    el.classList.add("fill");
    gsap.fromTo($(".fill__top", el), { clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: el, start, end, scrub: 0.4 } });
    return el;
  };
  $$("[data-fill]").forEach((el) => {
    makeFill(el);
    gsap.from(el, {
      rotationX: -55,
      y: 50,
      opacity: 0,
      transformPerspective: 900,
      transformOrigin: "50% 100%",
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  });
  const giant = $("[data-fill-footer]");
  if (giant) makeFill(giant, { start: "top 98%", end: "bottom 60%", from: "inset(0% 100% 0% 0%)" });

  /* ---------- frase di fiducia: si apre a tendina e le parole si accendono ---------- */
  const panel = $("[data-curtain]");
  if (panel) {
    gsap.fromTo(
      panel,
      { clipPath: "inset(10% 38% 10% 38% round 28px)" },
      { clipPath: "inset(0% 0% 0% 0% round 28px)", ease: "none", scrollTrigger: { trigger: panel, start: "top 96%", end: "top 40%", scrub: 0.5 } }
    );
    gsap.from(".trust__points li", {
      opacity: 0,
      y: 26,
      duration: 0.8,
      ease: "expo.out",
      stagger: 0.09,
      scrollTrigger: { trigger: ".trust__points", start: "top 90%", once: true },
    });
  }
  $$("[data-ink]").forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.22 }, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 70%", scrub: true } });
  });

  /* ---------- nastri di parole: scorrono sempre e accelerano quando scorri ---------- */
  const tweens = [];
  $$("[data-marquee]").forEach((track) => {
    const group = $(".ribbon__group", track);
    const copies = Math.max(1, Math.ceil(innerWidth / Math.max(group.offsetWidth, 1)));
    for (let i = 1; i < copies; i++) track.appendChild(group.cloneNode(true));
    const half = [...track.children];
    half.forEach((g) => track.appendChild(g.cloneNode(true)));
    const dir = +track.dataset.marquee;
    tweens.push(gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 16 * copies, ease: "none", repeat: -1 }));
  });
  let boost = 0;
  ScrollTrigger.create({
    trigger: ".ribbons",
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => (boost = Math.min(6, Math.abs(self.getVelocity()) / 300)),
    onToggle: (self) => tweens.forEach((t) => (self.isActive ? t.play() : t.pause())),
  });
  gsap.ticker.add(() => {
    if (boost < 0.01) return;
    boost *= 0.93;
    tweens.forEach((t) => t.timeScale(1 + boost));
  });
  gsap.fromTo(".ribbon--a", { rotation: -7, y: 24 }, { rotation: -3, y: -16, ease: "none", scrollTrigger: { trigger: ".ribbons", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.fromTo(".ribbon--b", { rotation: 6, y: -20 }, { rotation: 2, y: 20, ease: "none", scrollTrigger: { trigger: ".ribbons", start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------- numeri che contano ---------- */
  $$("[data-count], .filter__n").forEach((el) => {
    const n = +(el.dataset.count || el.textContent);
    const o = { v: 0 };
    el.textContent = "0";
    gsap.to(o, {
      v: n,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => (el.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  });

  /* ---------- carte dei lavori a ventaglio ---------- */
  {
    ScrollTrigger.batch(".card", {
      start: "top 92%",
      once: true,
      onEnter: (batch) =>
        gsap.from(batch, {
          opacity: 0,
          y: 90,
          rotation: (i) => (i - (batch.length - 1) / 2) * 6,
          transformOrigin: "50% 160%",
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          clearProps: "transform,opacity",
        }),
    });
  }

  /* ---------- telefono e computer 3D che ruotano mentre scorri ---------- */
  const screensST = { trigger: ".screens", start: "top bottom", end: "bottom top", scrub: 0.6 };
  gsap.fromTo("#devices", { rotationY: -30, rotationX: 18, y: 50 }, { rotationY: 8, rotationX: 2, y: -30, ease: "none", scrollTrigger: screensST });
  gsap.fromTo(".phone", { z: 40, yPercent: 16 }, { z: 170, yPercent: -12, ease: "none", scrollTrigger: screensST });
  gsap.fromTo(".device__shine", { xPercent: -40 }, { xPercent: 40, ease: "none", scrollTrigger: screensST });

  /* ---------- servizi: carte colorate che entrano a ventaglio ---------- */
  const fan = $("[data-fan]");
  if (fan) {
    const items = [...fan.children];
    const cols = () => getComputedStyle(fan).gridTemplateColumns.split(" ").length;
    gsap.from(items, {
      opacity: 0,
      y: 150,
      rotation: (i) => {
        const n = cols();
        return ((i % n) - (n - 1) / 2) * 10;
      },
      transformOrigin: "50% 190%",
      duration: 1.15,
      ease: "expo.out",
      stagger: 0.07,
      clearProps: "transform,opacity",
      scrollTrigger: { trigger: fan, start: "top 86%", once: true },
    });
  }

  /* ---------- come lavoro: la linea si disegna e accende i passi ---------- */
  const steps = $$(".step");
  const prog = $(".steps__progress");
  const mm = gsap.matchMedia();
  mm.add({ wide: "(min-width: 900px)", narrow: "(max-width: 899px)" }, (ctx) => {
    const { wide } = ctx.conditions;
    const axis = wide ? "scaleX" : "scaleY";
    gsap.fromTo(prog, { [axis]: 0 }, {
      [axis]: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "[data-steps]",
        start: wide ? "top 78%" : "top 72%",
        end: wide ? "top 30%" : "bottom 62%",
        scrub: 0.5,
        onUpdate: (self) => steps.forEach((s, i) => s.classList.toggle("is-on", self.progress >= i / (steps.length - 1) - 0.03)),
      },
    });
    gsap.from(steps, {
      opacity: 0,
      x: wide ? 0 : -26,
      y: wide ? 34 : 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.1,
      scrollTrigger: { trigger: "[data-steps]", start: "top 84%", once: true },
    });
  });

  /* ---------- chi sono: tessera che si scopre a tendina, parallasse ---------- */
  const idcard = $("[data-reveal-card]");
  if (idcard) {
    gsap.fromTo(
      idcard,
      { clipPath: "inset(0% 0% 100% 0% round 24px)" },
      { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.3, ease: "expo.inOut", scrollTrigger: { trigger: idcard, start: "top 85%", once: true } }
    );
  }
  $$("[data-speed]").forEach((el) => {
    const s = parseFloat(el.dataset.speed) || 0.5;
    gsap.fromTo(el, { yPercent: 12 * s }, { yPercent: -12 * s, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- contatti: la sezione si apre come due porte ---------- */
  if ($(".doors")) {
    gsap
      .timeline({ scrollTrigger: { trigger: ".contact__stage", start: "top 84%", end: "top 26%", scrub: 0.5 } })
      .fromTo(".door--l", { rotationY: 0 }, { rotationY: -105, ease: "power2.in", duration: 1 }, 0)
      .fromTo(".door--r", { rotationY: 0 }, { rotationY: 105, ease: "power2.in", duration: 1 }, 0)
      .to(".door", { opacity: 0, ease: "power1.in", duration: 0.35 }, 0.65);
  }

  /* ricalcola le posizioni quando font e immagini sono pronti */
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
})();
