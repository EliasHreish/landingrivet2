/* ==========================================================================
   RIVET — main.js
   One small scroll engine, no dependencies.
   - header theme follows the section under it
   - navigation plate (open / close / focus trap)
   - reveal observer
   - sticky "cover" tops for sections taller than the viewport
   - the stack scene (pin travels, locks, lifts)
   - the day clock
   - module accordion
   ========================================================================== */
(() => {
  'use strict';

  const html = document.documentElement;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const smooth = t => t * t * (3 - 2 * t);

  /* ---------- Reduced motion ---------- */
  const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedMq.matches;
  html.classList.toggle('reduced', reduced);
  if (reducedMq.addEventListener) {
    reducedMq.addEventListener('change', e => {
      reduced = e.matches;
      html.classList.toggle('reduced', reduced);
      measureAll();
    });
  }

  /* ---------- Elements ---------- */
  const header   = $('[data-header]');
  const nav      = $('[data-nav]');
  const menuBtn  = $('[data-menu-btn]');
  const menuLbl  = $('[data-label]', menuBtn);
  const scrim    = $('[data-nav-scrim]');
  const main     = $('#main');
  const hero     = $('[data-hero]');
  const themed   = $$('[data-theme]');
  const covers   = $$('[data-cover], [data-hero]');
  const scrubs   = $$('[data-scrub]').map(el => ({ el, top: 0, height: 0, p: -1 }));

  let vh = window.innerHeight;
  let headerLine = 36;
  let heroStart = 0;

  /* ======================================================================
     Navigation
     ====================================================================== */
  let navOpen = false;
  let lastFocus = null;

  const navFocusables = () =>
    [menuBtn].concat($$('a[href], button', nav).filter(el => el.offsetParent !== null || el === menuBtn));

  function openNav() {
    if (navOpen) return;
    navOpen = true;
    lastFocus = document.activeElement;
    nav.classList.add('is-open');
    nav.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuLbl.textContent = 'Close';
    html.classList.add('nav-open');
    if (main) main.inert = true;
    const first = $('.nav__link', nav);
    window.setTimeout(() => { if (navOpen && first) first.focus({ preventScroll: true }); }, 420);
  }

  function closeNav(restoreFocus = true) {
    if (!navOpen) return;
    navOpen = false;
    nav.classList.remove('is-open');
    nav.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuLbl.textContent = 'Menu';
    html.classList.remove('nav-open');
    if (main) main.inert = false;
    if (restoreFocus && lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => (navOpen ? closeNav() : openNav()));
    scrim.addEventListener('click', () => closeNav());
    $$('a[href]', nav).forEach(a => a.addEventListener('click', () => closeNav(false)));

    document.addEventListener('keydown', e => {
      if (!navOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeNav(); return; }
      if (e.key !== 'Tab') return;
      const els = navFocusables();
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ======================================================================
     Reveal observer
     ====================================================================== */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        revealIO.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  $$('[data-reveal]').forEach(el => revealIO.observe(el));

  /* ======================================================================
     Sticky covers: a section taller than the viewport sticks only when its
     bottom reaches the bottom of the viewport, so the next sheet can slide
     over it without trapping content.
     ====================================================================== */
  function updateCovers() {
    vh = window.innerHeight;
    covers.forEach(el => {
      const h = el.offsetHeight;
      el.style.setProperty('--cover-top', `${Math.min(0, vh - h)}px`);
    });
    heroStart = hero ? Math.max(0, hero.offsetHeight - vh) : 0;
  }

  /* ======================================================================
     Scroll engine
     ====================================================================== */
  const handlers = {};
  let ticking = false;

  function measureAll() {
    vh = window.innerHeight;
    headerLine = (header ? header.offsetHeight : 72) / 2;
    const y = window.scrollY;
    scrubs.forEach(s => {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + y;
      s.height = s.el.offsetHeight;
      s.p = -1;
    });
    requestTick();
  }

  function requestTick() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  function frame() {
    ticking = false;
    const y = window.scrollY;

    // Scrubbed scenes
    scrubs.forEach(s => {
      const range = Math.max(1, s.height - vh);
      const p = clamp((y - s.top) / range, 0, 1);
      if (p !== s.p) {
        s.p = p;
        s.el.style.setProperty('--p', p.toFixed(4));
        const h = handlers[s.el.dataset.scrub];
        if (h) h(p);
      }
    });

    // Hero recedes beneath the incoming sheet
    if (hero && !reduced) {
      const p = clamp((y - heroStart) / vh, 0, 1);
      hero.style.setProperty('--cover-p', p.toFixed(3));
    }

    // Header colour follows whichever sheet is under it (later sheets cover earlier ones)
    let on = 'paper';
    for (let i = 0; i < themed.length; i++) {
      const r = themed[i].getBoundingClientRect();
      if (r.top <= headerLine && r.bottom > headerLine) on = themed[i].dataset.theme;
    }
    if (header && header.dataset.on !== on) header.dataset.on = on;
  }

  window.addEventListener('scroll', requestTick, { passive: true });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      updateCovers();
      measureRig();
      measureAll();
    }, 80);
  }, { passive: true });

  // Layout changes anywhere (accordion, fonts) shift the positions of later scenes.
  if ('ResizeObserver' in window) {
    let roTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(roTimer);
      roTimer = window.setTimeout(() => { updateCovers(); measureRig(); measureAll(); }, 60);
    });
    ro.observe(document.body);
    covers.forEach(el => ro.observe(el));
  }

  /* ======================================================================
     The stack scene
     p ∈ [0,1] over the track. Intro → six plates (unlock · travel · lock · dwell) → outro (lift).
     ====================================================================== */
  const rig       = $('[data-rig]');
  const platesBox = $('[data-rig-plates]');
  const plates    = rig ? $$('.rig__plate', rig) : [];
  const pin       = $('[data-rig-pin]');
  const states    = $$('.stack__state');
  const readout   = $('[data-readout]');
  const names     = plates.map(p => p.dataset.name);

  const N = plates.length || 6;
  const INTRO = 0.07;
  const OUTRO = 0.87;
  const SEG = (OUTRO - INTRO) / N;
  const U = 0.08, T = 0.34, L = 0.42;   // unlock · travel · lock phases within a segment

  let pitch = 0, liftPx = 0, pushPx = 0, curState = -1;

  function measureRig() {
    if (!rig || !platesBox || !pin) return;
    const h = platesBox.offsetHeight;
    pitch = h * 0.109;
    liftPx = h * 0.035;
    pushPx = pin.offsetWidth * 0.55;
  }

  function setState(i) {
    if (i === curState) return;
    curState = i;
    states.forEach((s, k) => {
      s.classList.toggle('is-active', k === i);
      s.classList.toggle('is-past', k < i);
    });
    const on = i <= 0 ? 0 : (i > N ? N : i);
    plates.forEach((p, k) => p.classList.toggle('is-on', k < on));
    if (readout) {
      readout.textContent = i <= 0
        ? `Loose · 00 / 0${N}`
        : (i > N ? `Full stack · 0${N} / 0${N}` : `Plate 0${i} / 0${N} · ${names[i - 1]}`);
    }
  }

  handlers.stack = p => {
    if (!rig || reduced) return;
    let idx, lock, state, lift = 0, alpha = 1;

    if (p < INTRO) {
      idx = -1; lock = 0; state = 0;
      alpha = clamp((p - INTRO * 0.25) / (INTRO * 0.5), 0, 1);
    } else if (p >= OUTRO) {
      idx = N - 1; lock = 1; state = N + 1;
      lift = smooth(clamp((p - OUTRO) / (1 - OUTRO), 0, 1));
    } else {
      const t = (p - INTRO) / SEG;
      const k = Math.min(N - 1, Math.floor(t));
      const f = t - k;
      if (f < U) {
        lock = k === 0 ? 0 : 1 - easeOut(f / U);
        idx = k - 1;
      } else if (f < T) {
        lock = 0;
        idx = (k - 1) + easeInOut((f - U) / (T - U));
      } else {
        idx = k;
        lock = easeOut(clamp((f - T) / (L - T), 0, 1));
      }
      state = f >= T + (L - T) * 0.85 ? k + 1 : k;
    }

    const x = (1 - lock) * pushPx;
    const yPx = idx * pitch - lift * liftPx;
    pin.style.transform = `translate3d(${x.toFixed(1)}px, ${yPx.toFixed(1)}px, 0)`;
    pin.style.opacity = alpha.toFixed(2);
    rig.style.setProperty('--lift', lift.toFixed(3));
    setState(state);
  };

  /* ======================================================================
     The day clock
     ====================================================================== */
  const clock = $('[data-clock]');
  const where = $('[data-where]');
  const moments = $$('.moment');
  if (clock && moments.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const t = en.target.dataset.time, w = en.target.dataset.where;
        if (clock.textContent !== t) {
          clock.textContent = t;
          if (where) where.textContent = w;
          if (!reduced) {
            clock.classList.remove('is-tick');
            void clock.offsetWidth;
            clock.classList.add('is-tick');
          }
        }
        moments.forEach(m => m.classList.toggle('is-current', m === en.target));
      });
    }, { rootMargin: '-42% 0px -48% 0px', threshold: 0 });
    moments.forEach(m => io.observe(m));
  }

  /* ======================================================================
     Module accordion
     ====================================================================== */
  $$('[data-module-toggle]').forEach(btn => {
    const li = btn.closest('.module');
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const open = !li.classList.contains('is-open');
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (panel) panel.setAttribute('aria-hidden', String(!open));
    });
  });

  /* ======================================================================
     Boot
     ====================================================================== */
  function boot() {
    updateCovers();
    measureRig();
    measureAll();
    if (reduced) setState(N + 1);   // static, fully pinned stack for reduced-motion users
  }

  const heroReady = () => { if (hero) hero.classList.add('is-ready'); };
  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => window.setTimeout(r, 900))]).then(() => {
    requestAnimationFrame(() => { heroReady(); boot(); });
  });

  boot();
  window.addEventListener('load', boot);
})();
