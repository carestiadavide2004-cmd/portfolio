/* =========================================================
   Carestia Web — main.js
   Interfaccia: contatti, intro, menu, lavori da config.js, filtri, scheda,
   anteprime video, telefono e computer, modulo. Carica la scena 3D se possibile.
   Funziona anche se GSAP o Three.js non arrivano dal CDN.
   ========================================================= */

(() => {
  const cfg = window.CW_CONFIG;
  if (!cfg) return;
  const html = document.documentElement;
  const CW = (window.CW = window.CW || {});
  const reduced = html.classList.contains("rm");
  const sceneURL = new URL("scene.js", document.currentScript.src).href;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const desktopCards = matchMedia("(min-width: 720px)");

  CW.reduced = reduced;
  CW.filter = "tutti";
  CW.tint = "hero";
  CW.setTint = (name) => {
    CW.tint = name;
    if (CW.scene) CW.scene.setTint(name);
  };

  const cats = cfg.categorie.filter((c) => cfg.lavori.some((w) => w.categoria === c.id));
  const catOf = (w) => cfg.categorie.find((c) => c.id === w.categoria) || { nome: "", colore: "#F6F3FF" };
  const media = (w, kind, ext) => {
    if (ext === "mp4" && w.video === false) return "";
    const custom = ext === "mp4" ? w.video && w.video[kind] : w.immagini && w.immagini[kind];
    return custom || `assets/${ext === "mp4" ? "video" : "img/lavori"}/${w.id}-${kind}.${ext}`;
  };
  // screenshot ad alta risoluzione per la scena 3D (se mancano, la scena usa quelli delle carte)
  const media3d = (w, kind) => (w.immagini3d && w.immagini3d[kind]) || `assets/img/3d/${w.id}-${kind}.webp`;
  CW.works = cfg.lavori.map((w) => ({
    ...w,
    colore: catOf(w).colore,
    img: { computer: media(w, "computer", "webp"), telefono: media(w, "telefono", "webp") },
    img3d: { computer: media3d(w, "computer"), telefono: media3d(w, "telefono") },
  }));

  /* ---------- contatti presi da config.js ---------- */
  const c = cfg.contatti;
  const waLink = (text) => `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(text)}`;
  CW.waLink = waLink;
  const fillContacts = (root = document) => {
    $$("[data-wa]", root).forEach((a) => (a.href = waLink(c.messaggioWhatsapp)));
    $$("[data-tel]", root).forEach((a) => (a.href = `tel:${c.telefono}`));
    $$("[data-tel-text]", root).forEach((a) => (a.textContent = c.telefonoVisibile));
    $$("[data-mail]", root).forEach((a) => (a.href = `mailto:${c.email}`));
    $$("[data-mail-text]", root).forEach((a) => (a.textContent = c.email));
  };
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  const social = $("#footerSocial");
  if (social) {
    const names = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", linkedin: "LinkedIn" };
    social.innerHTML = Object.entries(cfg.social || {})
      .filter(([, url]) => url)
      .map(([k, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${names[k] || esc(k)}</a>`)
      .join("");
  }

  /* ---------- intro: solo alla prima visita, saltabile ---------- */
  const intro = $("#intro");
  CW.introDone = new Promise((resolve) => {
    if (!intro || html.classList.contains("no-intro")) {
      if (intro) intro.remove();
      return resolve();
    }
    let done = false;
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    const end = () => {
      if (done) return;
      done = true;
      events.forEach((ev) => removeEventListener(ev, skip));
      intro.remove();
      resolve();
    };
    const skip = () => {
      intro.classList.add("is-skipped");
      setTimeout(end, 230);
    };
    intro.addEventListener("animationend", (e) => { if (e.target === intro) end(); });
    events.forEach((ev) => addEventListener(ev, skip, { passive: true }));
    setTimeout(end, 1700);
  });

  /* ---------- barra in alto e menu ---------- */
  const nav = $("#nav");
  const toggle = $("#menuToggle");
  const menu = $("#menu");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle("is-solid", scrollY > 24 || !menu.hidden);
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".nav__toggle-label").textContent = open ? "Chiudi" : "Menu";
    menu.hidden = !open;
    html.style.overflow = open ? "hidden" : "";
    nav.classList.toggle("is-solid", open || scrollY > 24);
  };
  toggle.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); } });
  matchMedia("(min-width: 960px)").addEventListener("change", (e) => { if (e.matches && !menu.hidden) setMenu(false); });

  /* ---------- lavori: filtri e carte generati da config.js ---------- */
  const grid = $("#workGrid");
  const filters = $("#filters");
  const pill = $(".filters__pill", filters);

  const cardHTML = (w, i) => `
    <li class="card" data-cat="${w.categoria}" data-i="${i}" style="--c:${w.colore}">
      <article class="card__inner">
        <div class="card__media">
          <div class="card__visual">
            <img class="card__shot card__shot--telefono" src="${w.img.telefono}" alt="Home del sito ${esc(w.nome)} vista da telefono" width="480" height="1040" loading="lazy" decoding="async">
            <img class="card__shot card__shot--computer" src="${w.img.computer}" alt="Home del sito ${esc(w.nome)} vista da computer" width="1200" height="750" loading="lazy" decoding="async">
            ${media(w, "computer", "mp4") ? `<video class="card__video" muted playsinline loop preload="none" data-src="${media(w, "computer", "mp4")}" aria-hidden="true"></video>` : ""}
          </div>
          <span class="card__glare" aria-hidden="true"></span>
          <span class="demo-tag">Progetto dimostrativo</span>
          <a class="card__link" href="${esc(w.url)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"></a>
        </div>
        <div class="card__body">
          <h3 class="card__name">${esc(w.nome)}</h3>
          <p class="card__type">${esc(w.tipo)}</p>
          <ul class="points card__points">${w.punti.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
          <div class="card__actions">
            <a class="btn btn--light btn--sm" href="${esc(w.url)}" target="_blank" rel="noopener">Apri il sito<span class="sr-only"> ${esc(w.nome)}, si apre in una nuova scheda</span><svg class="ico" aria-hidden="true"><use href="#i-out"/></svg></a>
          </div>
        </div>
        <button class="card__tap" type="button" data-open="${i}" aria-label="Dettagli di ${esc(w.nome)}, ${esc(w.tipo)}"></button>
      </article>
    </li>`;

  grid.innerHTML =
    CW.works.map(cardHTML).join("") +
    `<li class="card card--cta">
      <div class="cta-card">
        <p class="cta-card__title">Il prossimo sito può essere il tuo</p>
        <a class="btn btn--wa" data-wa href="#" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-wa"/></svg>Parliamone su WhatsApp</a>
      </div>
    </li>`;
  CW.cards = $$(".card:not(.card--cta)", grid);

  const count = (id) => (id === "tutti" ? CW.works.length : CW.works.filter((w) => w.categoria === id).length);
  filters.insertAdjacentHTML(
    "beforeend",
    [{ id: "tutti", nome: "Tutti", colore: "#F6F3FF" }, ...cats]
      .map((cat) => `<button class="filter" type="button" data-filter="${cat.id}" data-color="${cat.colore}" aria-pressed="${cat.id === "tutti"}">${esc(cat.nome)}<span class="filter__n">${count(cat.id)}</span></button>`)
      .join("")
  );
  $$("[data-count-of]").forEach((el) => {
    const n = el.dataset.countOf === "lavori" ? CW.works.length : cats.length;
    el.dataset.count = n;
    el.textContent = n;
  });

  const movePill = () => {
    const btn = $('.filter[aria-pressed="true"]', filters);
    if (!btn) return;
    const p = filters.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    filters.style.setProperty("--pt", `${r.top - p.top}px`);
    filters.style.setProperty("--pl", `${r.left - p.left}px`);
    filters.style.setProperty("--pr", `${p.right - r.right}px`);
    filters.style.setProperty("--pb", `${p.bottom - r.bottom}px`);
    filters.style.setProperty("--pill", btn.dataset.color);
  };
  if (!CSS.supports("clip-path", "inset(0 0 0 0 round 9px)")) html.classList.add("no-pill");
  movePill();
  addEventListener("resize", movePill, { passive: true });
  if (document.fonts) document.fonts.ready.then(movePill);

  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn || btn.getAttribute("aria-pressed") === "true") return;
    $$(".filter", filters).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    movePill();
    applyFilter(btn.dataset.filter);
  });

  function applyFilter(id) {
    CW.filter = id;
    CW.handoff = false; // dopo un filtro le carte restano sempre visibili
    html.classList.remove("has-handoff");
    if (CW.scene) CW.scene.stopHandoff();
    const all = $$(".card", grid);
    const flip = window.Flip && window.gsap && !reduced;
    const state = flip ? Flip.getState(all) : null;
    CW.cards.forEach((card) => card.classList.toggle("is-hidden", id !== "tutti" && card.dataset.cat !== id));
    if (flip) {
      Flip.from(state, {
        duration: 0.6,
        ease: "power3.inOut",
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.88, duration: 0.3, ease: "power2.in" }),
        onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh(),
      });
    } else if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }
    CW.setTint(`work:${id}`);
  }

  /* ---------- anteprime video sulle carte (computer): si caricano solo quando la carta è visibile ---------- */
  const startVideo = (v) => {
    if (!v.getAttribute("src")) v.src = v.dataset.src;
    if (!v.dataset.bound) {
      v.dataset.bound = "1";
      v.addEventListener("playing", () => v.classList.add("is-playing"));
    }
    const p = v.play();
    if (p) p.catch(() => {});
  };
  let videoIO = null;
  const setupCardVideos = () => {
    if (reduced || !desktopCards.matches || videoIO || !("IntersectionObserver" in window)) return;
    videoIO = new IntersectionObserver(
      (entries) => entries.forEach((en) => (en.isIntersecting ? startVideo(en.target) : en.target.pause())),
      { threshold: 0.4 }
    );
    $$(".card__video", grid).forEach((v) => videoIO.observe(v));
  };
  setupCardVideos();
  desktopCards.addEventListener("change", setupCardVideos);

  /* ---------- inclinazione 3D con riflesso di luce (solo mouse) ---------- */
  const tilt = (el, area, glare, max = 9) => {
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      el.style.transform = Math.abs(x) + Math.abs(y) < 0.01 && !tx && !ty ? "" : `rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.02 ? requestAnimationFrame(loop) : 0;
    };
    area.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = area.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ty = nx * max * 1.2;
      tx = -ny * max;
      if (glare) glare.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    area.addEventListener("pointerleave", () => {
      tx = ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  };
  if (finePointer && !reduced) {
    CW.cards.forEach((card) => tilt($(".card__inner", card), card, $(".card__glare", card), 7));
    const id = $("[data-tilt]");
    if (id) tilt(id, id.parentElement, $(".idcard__glare", id), 10);
  }

  /* ---------- scheda del lavoro dal basso (telefono) ---------- */
  const sheet = $("#sheet");
  const panel = $(".sheet__panel", sheet);
  const sv = $(".sheet__video", sheet);
  let lastTrigger = null;
  const openSheet = (i, trigger) => {
    const w = CW.works[i];
    lastTrigger = trigger;
    panel.style.setProperty("--c", w.colore);
    $(".sheet__name", sheet).textContent = w.nome;
    $(".sheet__type", sheet).textContent = `${catOf(w).nome}, ${w.tipo.toLowerCase()}`;
    $(".sheet__desc", sheet).textContent = w.descrizione;
    $(".sheet__points", sheet).innerHTML = w.punti.map((p) => `<li>${esc(p)}</li>`).join("");
    let poster = $(".sheet__poster", sheet);
    if (!poster) {
      poster = Object.assign(new Image(480, 1040), { className: "sheet__poster", decoding: "async" });
      $(".sheet__media", sheet).prepend(poster);
    }
    poster.src = w.img.telefono;
    poster.alt = `Home del sito ${w.nome} vista da telefono`;
    const open = $(".sheet__open", sheet);
    open.href = w.url;
    open.setAttribute("aria-label", `Apri il sito ${w.nome} in una nuova scheda`);
    sv.classList.remove("is-playing");
    const src = media(w, "telefono", "mp4");
    if (src && !reduced) {
      sv.src = src;
      startVideo(sv);
    }
    sheet.hidden = false;
    html.style.overflow = "hidden";
    CW.sheetOpen = true;
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add("is-open")));
    $(".sheet__close", sheet).focus({ preventScroll: true });
  };
  const closeSheet = () => {
    if (sheet.hidden) return;
    sheet.classList.remove("is-open");
    panel.style.transform = "";
    CW.sheetOpen = false;
    html.style.overflow = "";
    const done = () => {
      sheet.hidden = true;
      sv.pause();
      sv.removeAttribute("src");
      sv.load();
    };
    reduced ? done() : setTimeout(done, 420);
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  };
  grid.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open]");
    if (t) openSheet(+t.dataset.open, t);
  });
  sheet.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });
  sheet.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
    if (e.key !== "Tab") return;
    const f = $$("button, a[href]", panel);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // trascina in basso per chiudere
  let dragY = null, dy = 0, t0 = 0;
  panel.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" || panel.scrollTop > 0 || e.target.closest("a, button:not(.sheet__grab)")) return;
    dragY = e.clientY; dy = 0; t0 = performance.now();
    sheet.classList.add("is-dragging");
  });
  addEventListener("pointermove", (e) => {
    if (dragY === null) return;
    dy = Math.max(0, e.clientY - dragY);
    panel.style.transform = `translate3d(0, ${dy}px, 0)`;
  }, { passive: true });
  const endDrag = () => {
    if (dragY === null) return;
    sheet.classList.remove("is-dragging");
    const fast = dy / (performance.now() - t0) > 0.6;
    dragY = null;
    if (dy > 110 || (fast && dy > 30)) closeSheet();
    else panel.style.transform = "";
  };
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);

  /* ---------- telefono e computer: scegli il sito ---------- */
  const pick = $("#screensPick");
  const devices = $("#devices");
  const showcase = cats.map((cat) => CW.works.findIndex((w) => w.categoria === cat.id)).filter((i) => i >= 0);
  let current = showcase[0] || 0;
  let devicesLive = false;
  pick.innerHTML = showcase
    .map((i) => `<button class="pick" type="button" data-pick="${i}" aria-pressed="${i === current}" style="--c:${CW.works[i].colore}">${esc(CW.works[i].nome)}</button>`)
    .join("");
  const loadDevices = () => {
    const w = CW.works[current];
    ["computer", "telefono"].forEach((kind) => {
      const poster = $(`.device__poster[data-device="${kind}"]`, devices);
      const v = $(`.device__video[data-device="${kind}"]`, devices);
      poster.src = w.img[kind];
      v.classList.remove("is-playing");
      const src = media(w, kind, "mp4");
      if (src && !reduced && devicesLive) {
        v.dataset.src = src;
        v.src = src;
        startVideo(v);
      } else if (!src) {
        v.removeAttribute("src");
      }
    });
  };
  pick.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (!b) return;
    current = +b.dataset.pick;
    $$(".pick", pick).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    loadDevices();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && !devicesLive) {
          devicesLive = true;
          loadDevices();
        } else {
          $$(".device__video", devices).forEach((v) => (en.isIntersecting ? v.getAttribute("src") && startVideo(v) : v.pause()));
        }
      });
    }, { rootMargin: "200px 0px" }).observe(devices);
  }
  loadDevices();

  /* ---------- animazioni CSS in pausa quando non si vedono ---------- */
  if ("IntersectionObserver" in window) {
    const pauseIO = new IntersectionObserver((entries) => entries.forEach((en) => en.target.classList.toggle("is-paused", !en.isIntersecting)));
    $$(".trust__panel, .hero").forEach((el) => pauseIO.observe(el));
  }

  /* ---------- modulo contatti (Web3Forms, oppure modalità demo) ---------- */
  const form = $("#contactForm");
  const status = $("#formStatus");
  const key = (cfg.modulo && cfg.modulo.web3formsKey) || "";
  const demo = !key || /INSERISCI|CHIAVE/i.test(key);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const checks = {
      nome: data.nome.trim().length > 1,
      contatto: /\S+@\S+\.\S+/.test(data.contatto) || data.contatto.replace(/\D/g, "").length >= 6,
    };
    let firstBad = null;
    Object.entries(checks).forEach(([name, ok]) => {
      const field = form.elements[name].closest(".field");
      field.classList.toggle("is-invalid", !ok);
      form.elements[name].setAttribute("aria-invalid", String(!ok));
      if (!ok && !firstBad) firstBad = form.elements[name];
    });
    if (firstBad) { firstBad.focus(); return; }

    const text = `Ciao Davide, sono ${data.nome.trim()}.${data.attivita ? ` Ho un'attività: ${data.attivita}.` : ""}${data.messaggio.trim() ? ` ${data.messaggio.trim()}` : ""} Mi trovi qui: ${data.contatto.trim()}`;
    status.className = "form__status";
    if (demo) {
      status.innerHTML = `<p>Il modulo è in modalità demo e non invia ancora email. Puoi mandarmi lo stesso messaggio su WhatsApp con un tocco.</p><a class="btn btn--wa" href="${waLink(text)}" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-wa"/></svg>Invia su WhatsApp</a>`;
      return;
    }
    if (data.botcheck) { status.textContent = "Grazie, messaggio inviato."; return; }
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    btn.textContent = "Invio in corso…";
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: key, subject: cfg.modulo.oggetto, from_name: "Portfolio Carestia Web", ...data }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      form.reset();
      status.classList.add("is-ok");
      status.textContent = `Grazie ${data.nome.trim()}, messaggio inviato. Ti rispondo al più presto.`;
    } catch (err) {
      status.innerHTML = `<p>Invio non riuscito. Scrivimi su WhatsApp o chiamami al ${esc(c.telefonoVisibile)}.</p><a class="btn btn--wa" href="${waLink(text)}" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-wa"/></svg>Scrivimi su WhatsApp</a>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Invia il messaggio";
    }
  });
  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field.is-invalid");
    if (field) field.classList.remove("is-invalid");
  });

  fillContacts();

  /* ---------- scena 3D: solo con WebGL2 e senza "riduci movimento" ---------- */
  const stage = $("#stage");
  let gl = null;
  if (!reduced) {
    try {
      gl = stage.getContext("webgl2", { alpha: false, antialias: false, depth: true, stencil: false, powerPreference: "high-performance" });
    } catch (e) { gl = null; }
  }
  if (!gl) {
    html.classList.add("no3d");
  } else {
    CW.want3d = true;
    const idle = (fn) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 900 }) : setTimeout(fn, 200));
    const load = () =>
      import(sceneURL)
        .then((m) => m.start({ canvas: stage, gl, CW }))
        .catch((err) => {
          console.warn("Scena 3D non disponibile:", err);
          CW.want3d = false;
          html.classList.add("no3d");
        });
    if (document.readyState === "complete") idle(load);
    else addEventListener("load", () => idle(load), { once: true });
  }
})();
