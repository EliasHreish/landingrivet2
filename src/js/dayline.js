/**
 * The day line only moves while it is on screen.
 */
export function initDayline() {
  const el = document.querySelector(".dayline");
  if (!el) return;
  if (!("IntersectionObserver" in window)) {
    el.classList.add("is-visible");
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) el.classList.toggle("is-visible", entry.isIntersecting);
    },
    { threshold: 0 }
  );
  io.observe(el);
}
