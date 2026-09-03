import { initHeader } from "./header.js";
import { initMenu } from "./menu.js";
import { initReveal } from "./reveal.js";
import { initJourney } from "./journey.js";
import { initDayline } from "./dayline.js";
import { initForm } from "./form.js";
import { initIntro } from "./intro.js";
import { initPlans } from "./plans.js";

window.clearTimeout(window.__rivetSafety);
document.documentElement.classList.add("js-ok");

initHeader();
initMenu();
initReveal();
initJourney();
initDayline();
initForm();
initPlans();
initIntro();
