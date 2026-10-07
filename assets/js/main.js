/* =========================================================
   Carestia Web — main.js
   ========================================================= */

/*
 * MODULO CONTATTI
 * Per ricevere i messaggi direttamente via email crea un form gratuito su
 * https://formspree.io e incolla qui l'URL (es. "https://formspree.io/f/abcdwxyz").
 * Se resta vuoto, il form apre il client email del visitatore con il messaggio già compilato.
 */
const FORM_ENDPOINT = "";
const CONTACT_EMAIL = "carestia.davide2004@gmail.com";

(() => {
  const root = document.documentElement;

  /* ---------- Nav: sfondo allo scroll ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileMenu");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    menu.hidden = !open;
    nav.classList.toggle("is-scrolled", open || window.scrollY > 12);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  /* ---------- Reveal allo scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Card portfolio: bordo luminoso che segue il cursore ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".project__link").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Cursore personalizzato ---------- */
  // Solo su dispositivi con mouse e se l'utente non ha chiesto di ridurre le animazioni.
  const fineMouse = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (fineMouse.matches && !reducedMotion.matches) {
    const cursor = document.createElement("div");
    cursor.className = "cursor is-hidden";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<div class="cursor__ring"></div><div class="cursor__dot"></div>';
    document.body.appendChild(cursor);
    root.classList.add("has-cursor");

    const ring = cursor.querySelector(".cursor__ring");
    const dot = cursor.querySelector(".cursor__dot");
    let mx = -100, my = -100;   // posizione del mouse
    let rx = mx, ry = my;       // posizione dell'anello (insegue con ritardo)
    let raf = null;

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      // il loop si ferma da solo quando l'anello ha raggiunto il mouse
      raf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.1 ? requestAnimationFrame(tick) : null;
    };

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (cursor.classList.contains("is-hidden")) {
        rx = mx; ry = my;           // evita che l'anello "voli" dall'angolo al primo ingresso
        cursor.classList.remove("is-hidden");
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    window.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    window.addEventListener("pointerup", () => cursor.classList.remove("is-down"));

    document.addEventListener("pointerover", (e) => {
      const t = e.target;
      cursor.classList.toggle("is-card", !!t.closest(".project__link"));
      cursor.classList.toggle("is-link", !t.closest(".project__link") && !!t.closest("a, button, .step, label"));
      cursor.classList.toggle("is-text", !!t.closest("input, textarea"));
    });
  }

  /* ---------- Omino sullo sfondo che osserva il cursore ---------- */
  const watcher = document.getElementById("watcher");
  if (watcher) {
    const part = (name) => watcher.querySelector(`[data-part="${name}"]`);
    const body = part("body"), head = part("head"), face = part("face"), hair = part("hair"), eyes = part("eyes");
    const eyeShapes = watcher.querySelectorAll(".watcher__eye");

    // desktop: tutto; schermi medi con mouse: solo testa e occhi; touch: sguardo autonomo a 30fps
    const hasMouse = fineMouse.matches;
    const full = hasMouse && window.matchMedia("(min-width: 1081px)").matches;
    const frameStep = hasMouse ? 0 : 1 / 30;

    const clamp = (v, a) => Math.max(-a, Math.min(a, v));
    const pose = (g, b, e) => {
      head.setAttribute("transform", `translate(${g.x * 4} ${g.y * 2}) rotate(${g.x * 7} 100 104)`);
      face.setAttribute("transform", `translate(${g.x * 9} ${g.y * 6})`);
      hair.setAttribute("transform", `translate(${g.x * 3} ${g.y * 2})`);
      eyes.setAttribute("transform", `translate(${e.x * 2.2} ${e.y * 1.6})`);
      body.setAttribute("transform", `rotate(${b.x * 2.2} 100 260) translate(${b.x * 3} 0) scale(1 ${b.s}) translate(0 ${260 / b.s - 260})`);
    };

    requestAnimationFrame(() => watcher.classList.add("is-ready"));

    if (reducedMotion.matches) {
      // nessuna animazione: una sola posa, rivolta verso il contenuto
      pose({ x: -0.35, y: -0.1 }, { x: 0, s: 1 }, { x: -0.4, y: -0.2 });
    } else {
      let hx = 0, hy = 0;                       // centro della testa sullo schermo
      const measure = () => {
        const r = watcher.getBoundingClientRect();
        hx = r.left + r.width * 0.5;
        hy = r.top + r.height * (70 / 260);
      };
      measure();
      window.addEventListener("resize", measure, { passive: true });
      watcher.addEventListener("transitionend", measure);

      const target = { x: -0.3, y: 0 };         // dove vuole guardare (-1…1)
      const gaze = { x: -0.3, y: 0, vx: 0, vy: 0 }; // testa: molla leggermente sottosmorzata
      const eye = { x: 0, y: 0 };               // occhi: più rapidi, anticipano la testa
      const sway = { x: 0, v: 0 };              // corpo: reagisce alla velocità del cursore
      let tracking = false, lastMove = 0, nextGlance = 0, nextBlink = 2 + Math.random() * 3, blinkAt = -1;
      let dilate = 0, near = 0, px = 0, cx = 0, cy = 0, last = performance.now(), acc = 0;

      const lookAt = (x, y) => {
        target.x = Math.tanh((x - hx) / 420);
        target.y = Math.tanh((y - hy) / 320) * 0.9;
        near = Math.hypot(x - hx, y - hy) < 260 ? 1 : 0;
      };

      if (hasMouse) {
        window.addEventListener("pointermove", (e) => {
          if (e.pointerType !== "mouse") return;
          if (full && tracking) sway.v += clamp(e.clientX - px, 60) * 0.006;
          px = e.clientX;
          tracking = true;
          lastMove = performance.now();
          cx = e.clientX; cy = e.clientY;
          lookAt(cx, cy);
        }, { passive: true });
        document.addEventListener("mouseleave", () => { tracking = false; near = 0; });
      } else {
        // su touch guarda per un attimo il punto toccato, poi torna a guardarsi intorno
        window.addEventListener("pointerdown", (e) => {
          lookAt(e.clientX, e.clientY);
          nextGlance = performance.now() / 1000 + 2.5;
        }, { passive: true });
      }

      const tick = (now) => {
        requestAnimationFrame(tick);
        const dt = Math.min((now - last) / 1000, 1 / 20);
        last = now;
        if (frameStep && (acc += dt) < frameStep) return;
        const step = frameStep ? Math.min(acc, 1 / 20) : dt;
        acc = 0;
        const t = now / 1000;

        // senza cursore (o fermo da un po'): ogni tanto si guarda intorno con calma
        const idle = !tracking || now - lastMove > 6000;
        if (idle && t > nextGlance && tracking && Math.random() < 0.5) {
          lookAt(cx, cy);               // …e poi torna a guardare il cursore
          nextGlance = t + 2 + Math.random() * 3;
        } else if (idle && t > nextGlance) {
          target.x = (Math.random() * 2 - 1) * (tracking ? 0.35 : 0.6) - 0.15;
          target.y = Math.random() * 0.55 - 0.3;
          nextGlance = t + 2.5 + Math.random() * 3.5;
          if (!tracking) near = 0;
        }

        // micro-movimenti: piccole oscillazioni lente sovrapposte allo sguardo
        const nx = Math.sin(t * 0.61) * 0.035 + Math.sin(t * 1.73 + 1.2) * 0.015;
        const ny = Math.sin(t * 0.47 + 2.1) * 0.03 + Math.sin(t * 1.31) * 0.012;
        const tx = clamp(target.x + nx, 1), ty = clamp(target.y + ny, 1);

        gaze.vx += ((tx - gaze.x) * 38 - gaze.vx * 10.5) * step;
        gaze.vy += ((ty - gaze.y) * 38 - gaze.vy * 10.5) * step;
        gaze.x += gaze.vx * step;
        gaze.y += gaze.vy * step;

        const ek = 1 - Math.exp(-step * 14);
        eye.x += (clamp((tx - gaze.x) * 2.5 + tx * 0.5, 1) - eye.x) * ek;
        eye.y += (clamp((ty - gaze.y) * 2.5 + ty * 0.5, 1) - eye.y) * ek;

        let breath = 1;
        if (full) {
          sway.v += ((gaze.x * 0.35 - sway.x) * 22 - sway.v * 6.5) * step;
          sway.v = clamp(sway.v, 3);
          sway.x = clamp(sway.x + sway.v * step, 1);
          breath = 1 + Math.sin(t * 1.5) * 0.006;
        }

        // battito di ciglia occasionale, a volte doppio; pupille leggermente più grandi se il cursore è vicino
        if (t > nextBlink) { blinkAt = t; nextBlink = t + 2.8 + Math.random() * 4.5 + (Math.random() < 0.15 ? -2.6 : 0); }
        const bp = blinkAt < 0 ? 1 : (t - blinkAt) / 0.16;
        const lid = bp < 1 ? Math.max(0.08, Math.abs(1 - bp * 2)) : 1;
        dilate += (near - dilate) * (1 - Math.exp(-step * 4));
        const r = 2.6 + dilate * 0.5;
        eyeShapes.forEach((el) => { el.setAttribute("rx", r); el.setAttribute("ry", r * lid); });

        pose(gaze, { x: sway.x, s: breath }, eye);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ---------- Anno nel footer ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Form contatti ---------- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector(".btn__label");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validators = {
    name: (v) => v.trim().length > 1,
    email: (v) => emailRe.test(v.trim()),
    message: (v) => v.trim().length > 5,
  };

  const validateField = (input) => {
    const ok = validators[input.name](input.value);
    input.closest(".field").classList.toggle("is-invalid", !ok);
    input.setAttribute("aria-invalid", String(!ok));
    return ok;
  };

  Object.keys(validators).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener("blur", () => { if (input.value) validateField(input); });
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("is-invalid")) validateField(input);
    });
  });

  const showStatus = (msg, isError = false) => {
    status.textContent = msg;
    status.classList.toggle("is-error", isError);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showStatus("");

    const fields = Object.keys(validators).map((n) => form.elements[n]);
    const invalid = fields.filter((f) => !validateField(f));
    if (invalid.length) { invalid[0].focus(); return; }
    if (form.elements._gotcha.value) return; // bot

    const data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
    };

    if (!FORM_ENDPOINT) {
      const subject = encodeURIComponent(`Richiesta preventivo — ${data.name}`);
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name}\n${data.email}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      showStatus("Si sta aprendo la tua app email con il messaggio pronto da inviare.");
      return;
    }

    button.classList.add("is-loading");
    label.textContent = "Invio in corso…";
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      showStatus("Grazie! Ho ricevuto la tua richiesta, ti rispondo entro 24 ore.");
    } catch {
      showStatus("Qualcosa è andato storto. Riprova o contattami direttamente al telefono.", true);
    } finally {
      button.classList.remove("is-loading");
      label.textContent = "Invia richiesta";
    }
  });
})();
