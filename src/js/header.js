/**
 * Header state: paper/ink theme depending on what sits under it,
 * a hairline once the page has scrolled, and aria-current on the menu.
 */
export function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const darkScenes = [...document.querySelectorAll("[data-scene-theme='dark']")];
  const menuLinks = [...document.querySelectorAll(".menu__link[href^='#']")];
  const targets = menuLinks
    .map((a) => ({ a, el: document.querySelector(a.getAttribute("href")) }))
    .filter((t) => t.el);

  let ticking = false;

  const update = () => {
    ticking = false;
    header.classList.toggle("is-scrolled", window.scrollY > 12);

    const probe = header.offsetHeight / 2;
    let dark = false;
    for (const scene of darkScenes) {
      const r = scene.getBoundingClientRect();
      if (r.top <= probe && r.bottom >= probe) {
        dark = true;
        break;
      }
    }
    header.dataset.theme = dark ? "dark" : "light";

    const line = window.innerHeight * 0.4;
    let current = null;
    for (const t of targets) {
      if (t.el.getBoundingClientRect().top <= line) current = t;
    }
    for (const t of targets) {
      if (t === current) t.a.setAttribute("aria-current", "true");
      else t.a.removeAttribute("aria-current");
    }
  };

  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  update();
}
