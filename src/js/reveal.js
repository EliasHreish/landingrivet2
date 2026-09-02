/**
 * Scroll reveals. Elements carry data-reveal="fade|mask|rows|bands";
 * the CSS owns the motion, this only flips .is-in once.
 */
export function initReveal() {
  const els = [...document.querySelectorAll("[data-reveal]")];
  if (!els.length) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );

  els.forEach((el) => io.observe(el));
}
