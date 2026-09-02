import { reducedMotion } from "./motion.js";

/**
 * Hero choreography. Waits for the font so the headline never flashes,
 * then: lines rise, plates slide into the rack, the pin goes in, the stack tugs once.
 */
export function initIntro() {
  const html = document.documentElement;
  const stack = document.querySelector(".stack--hero");

  const start = () => {
    html.classList.add("is-ready");
    const t = reducedMotion() ? 0 : 1;
    if (stack && t) {
      window.setTimeout(() => stack.classList.add("is-locked"), 1560);
      window.setTimeout(() => stack.classList.remove("is-locked"), 1560 + 380);
    }
    window.setTimeout(() => html.classList.add("intro-done"), t ? 2100 : 0);
  };

  const fonts = document.fonts?.ready ?? Promise.resolve();
  const timeout = new Promise((r) => window.setTimeout(r, 1400));
  Promise.race([fonts, timeout]).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(start));
  });
}
