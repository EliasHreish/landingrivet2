/**
 * Plan prices. Each .plan__price carries data-price (a number in JOD) and
 * data-period. Empty price = "shared at your walkthrough" (the HTML default).
 * Set the numbers in index.html once pricing is signed off; nothing else changes.
 */
export function initPlans() {
  document.querySelectorAll(".plan__price").forEach((el) => {
    const price = (el.dataset.price || "").trim();
    if (!price) return;
    const period = el.dataset.period || "per month";
    el.innerHTML = `<span class="plan__currency">JOD</span><span class="plan__amount">${price}</span><span class="plan__period">${period}</span>`;
  });
}
