import { reducedMotion } from "./motion.js";

/**
 * The journey: a sticky stack on one side, steps scrolling on the other.
 * The active step decides where the pin sits. Moving the pin is staged the
 * way a real weight stack works: the lifted block drops, the pin moves,
 * the new block lifts. Step 7 lifts everything.
 */
export function initJourney() {
  const section = document.getElementById("journey");
  if (!section) return;

  const stack = section.querySelector(".stack--journey");
  const plates = [...stack.querySelectorAll(".plate")];
  const pin = stack.querySelector(".pin");
  const steps = [...section.querySelectorAll(".step")];
  const status = section.querySelector(".journey__status-value");
  const names = plates.map((p) => p.dataset.name || "");
  const LAST_PLATE = plates.length - 1;
  const platesBox = stack.querySelector(".stack__plates");

  /* Short plates end before the long ones; the pin follows the plate it sits in. */
  const setPinX = (index) => {
    const full = platesBox.getBoundingClientRect().right;
    const plate = plates[index].getBoundingClientRect().right;
    stack.style.setProperty("--pin-x", `${Math.max(0, full - plate)}px`);
  };

  let current = -1;
  let timers = [];

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  function apply(k) {
    clearTimers();
    const pinIndex = Math.min(k, LAST_PLATE);
    const complete = k > LAST_PLATE;

    steps.forEach((s, i) => s.classList.toggle("is-active", i === k));

    if (status) {
      status.textContent = complete
        ? "06 · Everything moves together"
        : `${String(pinIndex + 1).padStart(2, "0")} · ${names[pinIndex]}`;
    }

    const setPin = () => {
      setPinX(pinIndex);
      stack.style.setProperty("--pin-i", String(pinIndex));
    };
    const setLift = () => {
      plates.forEach((p, i) => p.classList.toggle("is-lifted", i <= pinIndex));
      pin.classList.add("is-lifted");
      stack.classList.toggle("is-complete", complete);
    };

    if (reducedMotion()) {
      setPin();
      setLift();
      return;
    }

    const pinMoves = Number(stack.style.getPropertyValue("--pin-i") || 0) !== pinIndex;

    if (!pinMoves) {
      // Same plate, only the lift changes (e.g. step 6 → the end state).
      setLift();
      return;
    }

    // 1. drop  2. move the pin  3. lift the new block
    plates.forEach((p) => p.classList.remove("is-lifted"));
    pin.classList.remove("is-lifted");
    stack.classList.remove("is-complete");
    timers.push(window.setTimeout(setPin, 260));
    timers.push(window.setTimeout(setLift, 260 + 540));
  }

  let ticking = false;

  const update = () => {
    ticking = false;
    const probe = window.innerHeight * 0.58;
    let k = 0;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].getBoundingClientRect().top <= probe) k = i;
    }
    if (k !== current) {
      current = k;
      apply(k);
    }
  };

  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", () => {
    setPinX(Math.min(Math.max(current, 0), LAST_PLATE));
    request();
  });
  setPinX(0);
  update();
}
