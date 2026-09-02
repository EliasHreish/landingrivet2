const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

export const reducedMotion = () => mq.matches;

export const onMotionChange = (fn) => {
  mq.addEventListener("change", fn);
};
