import { reducedMotion } from "./motion.js";

/**
 * Navigation sheet: open/close choreography, scroll lock, focus containment,
 * Escape to close, and in-page navigation that closes the sheet first.
 */
export function initMenu() {
  const html = document.documentElement;
  const menu = document.getElementById("menu");
  const toggle = document.querySelector(".menu-toggle");
  if (!menu || !toggle) return;

  const srLabel = toggle.querySelector(".js-toggle-label");
  const backdrop = menu.querySelector(".menu__backdrop");
  const links = [...menu.querySelectorAll("a[href]")];
  const CLOSE_MS = 600;

  let open = false;
  let closingTimer = 0;

  const focusables = () => [toggle, ...links];
  const pageEl = document.querySelector(".page");

  /* Anchor the recede to the viewport: origin at its centre, clip to its bounds. */
  const anchorPage = () => {
    if (!pageEl) return;
    const y = window.scrollY;
    const top = Math.max(0, y);
    const bottom = Math.max(0, pageEl.offsetHeight - y - window.innerHeight);
    pageEl.style.setProperty("--page-origin-y", `${y + window.innerHeight / 2}px`);
    pageEl.style.setProperty("--page-clip-top", `${top}px`);
    pageEl.style.setProperty("--page-clip-bottom", `${bottom}px`);
    pageEl.style.clipPath = `inset(${top}px 0 ${bottom}px 0 round 0px)`;
  };
  const releasePage = () => {
    if (!pageEl) return;
    pageEl.style.clipPath = "";
  };

  function openMenu() {
    if (open) return;
    open = true;
    clearTimeout(closingTimer);
    html.classList.remove("menu-closing");
    menu.classList.remove("is-closing");
    menu.removeAttribute("inert");
    anchorPage();
    menu.classList.add("is-open");
    html.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    if (srLabel) srLabel.textContent = "Close menu";
  }

  function closeMenu({ restoreFocus = true } = {}) {
    if (!open) return;
    open = false;
    menu.classList.remove("is-open");
    menu.classList.add("is-closing");
    html.classList.remove("menu-open");
    html.classList.add("menu-closing");
    toggle.setAttribute("aria-expanded", "false");
    if (srLabel) srLabel.textContent = "Open menu";
    if (restoreFocus) toggle.focus({ preventScroll: true });
    const ms = reducedMotion() ? 0 : CLOSE_MS;
    closingTimer = window.setTimeout(() => {
      menu.classList.remove("is-closing");
      html.classList.remove("menu-closing");
      menu.setAttribute("inert", "");
      releasePage();
    }, ms);
  }

  toggle.addEventListener("click", () => (open ? closeMenu() : openMenu()));
  backdrop?.addEventListener("click", () => closeMenu());

  window.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key === "Tab") {
      const f = focusables();
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault();
        f[0].focus();
      }
    }
  });

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeMenu({ restoreFocus: false });
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        history.replaceState(null, "", href);
      });
    });
  });

  /* Labels must never clip: shrink the shared size until the widest fits. */
  const list = menu.querySelector(".menu__list");
  const labels = [...menu.querySelectorAll(".menu__label")];
  const fitLabels = () => {
    if (!list || !labels.length) return;
    list.style.removeProperty("--menu-fs");
    const base = parseFloat(getComputedStyle(labels[0]).fontSize);
    let size = base;
    for (let i = 0; i < 6; i++) {
      const overflow = Math.max(...labels.map((l) => l.scrollWidth - (l.parentElement.clientWidth - 6)));
      if (overflow <= 0) break;
      const widest = Math.max(...labels.map((l) => l.scrollWidth));
      size = Math.floor(size * ((widest - overflow) / widest) * 100) / 100;
      list.style.setProperty("--menu-fs", `${size}px`);
    }
  };
  fitLabels();
  window.addEventListener("resize", fitLabels);
  document.fonts?.ready.then(fitLabels);

  menu.setAttribute("inert", "");
}
