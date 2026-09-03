/**
 * Boot for secondary pages (privacy, terms, onboarding).
 * Same header and menu as the home page; no hero intro; a contents column
 * that follows the section under the reader.
 */
import { initHeader } from "./header.js";
import { initMenu } from "./menu.js";
import { initReveal } from "./reveal.js";
import { initSign } from "./sign.js";

window.clearTimeout(window.__rivetSafety);
document.documentElement.classList.add("js-ok", "is-ready", "intro-done");

initHeader();
initMenu();
initReveal();
initToc();
initSign();

function initToc() {
  const links = [...document.querySelectorAll(".doc__toc a[href^='#']")];
  const targets = links.map((a) => ({ a, el: document.getElementById(a.getAttribute("href").slice(1)) })).filter((t) => t.el);
  if (!targets.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const line = window.innerHeight * 0.35;
    let current = targets[0];
    for (const t of targets) if (t.el.getBoundingClientRect().top <= line) current = t;
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
