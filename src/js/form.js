/**
 * Walkthrough request form. Posts JSON to data-endpoint when configured.
 * Validation is inline and quiet; status messages are announced politely.
 */
export function initForm() {
  const form = document.querySelector(".form");
  if (!form) return;

  const endpoint = (form.dataset.endpoint || "").trim();
  const status = form.querySelector(".form__status");
  const submit = form.querySelector("[type='submit']");
  const fields = [...form.querySelectorAll("input, select")];

  const setStatus = (kind, message) => {
    if (!status) return;
    status.textContent = message;
    status.classList.add("is-visible");
    status.classList.toggle("is-success", kind === "success");
    status.focus({ preventScroll: true });
  };

  const check = (field) => {
    const wrap = field.closest(".field");
    const error = wrap?.querySelector(".field__error");
    let message = "";
    const value = field.value.trim();
    if (field.required && !value) message = "Please fill this in.";
    else if (field.type === "tel" && value && !/^\+?[\d\s().-]{7,}$/.test(value)) message = "Enter a phone number we can reach.";
    wrap?.classList.toggle("is-invalid", Boolean(message));
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
    return !message;
  };

  const validate = () => {
    let firstBad = null;
    for (const field of fields) {
      if (!check(field) && !firstBad) firstBad = field;
    }
    if (firstBad) firstBad.focus();
    return !firstBad;
  };

  fields.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.closest(".field")?.classList.contains("is-invalid")) check(field);
    });
    field.addEventListener("blur", () => {
      if (field.value.trim()) check(field);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!endpoint) {
      setStatus("error", "This form isn't connected to an inbox yet. Set the endpoint in index.html (see README).");
      return;
    }

    submit?.setAttribute("aria-busy", "true");
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.source = "rivet-landing";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.classList.add("is-sent");
      setStatus("success", "Thanks. Someone from RIVET will get back to you within a working day.");
    } catch (err) {
      setStatus("error", "Something went wrong on our side. Please try again in a moment.");
    } finally {
      submit?.removeAttribute("aria-busy");
    }
  });
}
