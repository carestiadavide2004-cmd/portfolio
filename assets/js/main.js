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
