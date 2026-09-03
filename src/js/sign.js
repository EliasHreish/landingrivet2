/**
 * Onboarding · subscription agreement e-signature.
 *
 * What it does, in order:
 *   1. Gives the session a reference number and stamps the agreement version.
 *   2. Prefills from the link RIVET sent (?gym=&owner=&plan=&start=&quote=…).
 *   3. Captures a signature: drawn on a canvas (mouse, pen, touch) or typed.
 *   4. On submit: validates, hashes the exact agreement text the signer saw
 *      (SHA-256), builds an evidence record, POSTs it to data-endpoint, and
 *      replaces the form with the signed record, which also prints as the copy.
 *
 * Nothing is stored in the browser. The national ID number is sent once, to
 * RIVET's endpoint, over HTTPS, and never written to localStorage.
 */
export const AGREEMENT_VERSION = "1.0 · 3 September 2026";

const TZ = "Asia/Amman";

export function initSign() {
  const root = document.querySelector("[data-sign]");
  if (!root) return;

  const form = root.querySelector("#sign-form");
  const agreement = root.querySelector("#agreement");
  const record = root.querySelector("#sign-record");
  const status = form.querySelector(".form__status");
  const submit = form.querySelector("[type='submit']");
  const endpoint = (form.dataset.endpoint || "").trim();

  /* 1. Reference, version, date --------------------------------------- */
  const reference = makeReference();
  root.querySelectorAll("[data-ref]").forEach((el) => (el.textContent = reference));
  root.querySelectorAll("[data-version]").forEach((el) => (el.textContent = AGREEMENT_VERSION));
  const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
  const dateTimeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  root.querySelectorAll("[data-today]").forEach((el) => (el.textContent = dateFmt.format(new Date())));

  /* 2. Prefill from the invitation link --------------------------------- */
  const params = new URLSearchParams(location.search);
  const prefill = {
    gym: "legalName", trade: "tradeName", cr: "registrationNumber", city: "city", branches: "branches",
    owner: "signatoryName", title: "signatoryTitle", phone: "phone", email: "email",
    plan: "plan", start: "startDate", term: "term", quote: "quote",
  };
  for (const [param, field] of Object.entries(prefill)) {
    const v = params.get(param);
    if (v && form.elements[field]) form.elements[field].value = v;
  }
  if (!form.elements.startDate.value) form.elements.startDate.value = todayISO();
  const signedOn = form.elements.signedOn;
  if (signedOn) signedOn.value = dateFmt.format(new Date());

  /* 3. Signature ------------------------------------------------------- */
  const sigWrap = root.querySelector(".sig");
  const pad = createPad(sigWrap.querySelector("canvas"), sigWrap);
  const typedInput = sigWrap.querySelector("#sig-typed");
  sigWrap.querySelector("[data-sig-clear]")?.addEventListener("click", () => {
    pad.clear();
    if (typedInput) typedInput.value = "";
    sigWrap.classList.remove("is-invalid");
  });
  sigWrap.querySelector("[data-sig-type]")?.addEventListener("click", (e) => {
    const on = sigWrap.classList.toggle("is-typed");
    e.currentTarget.textContent = on ? "Draw instead" : "Type your name instead";
    if (on) {
      pad.setMode("typed");
      typedInput?.focus();
      if (typedInput?.value) pad.setTyped(typedInput.value);
    } else {
      pad.setMode("drawn");
      pad.clear();
    }
  });
  typedInput?.addEventListener("input", () => {
    pad.setTyped(typedInput.value);
    if (typedInput.value.trim()) sigWrap.classList.remove("is-invalid");
  });

  /* ID type changes the hint and the pattern ---------------------------- */
  const idNumber = form.elements.idNumber;
  const idHint = form.querySelector("[data-id-hint]");
  const idType = () => form.querySelector("input[name='idType']:checked")?.value || "national";
  const applyIdType = () => {
    const t = idType();
    if (idHint) idHint.textContent = t === "national" ? "Ten digits, as printed on the Jordanian ID card." : "As printed in the passport, with the issuing country.";
    idNumber.setAttribute("inputmode", t === "national" ? "numeric" : "text");
    idNumber.placeholder = t === "national" ? "0000000000" : "";
    if (idNumber.value) check(idNumber);
  };
  form.querySelectorAll("input[name='idType']").forEach((r) => r.addEventListener("change", applyIdType));
  applyIdType();

  /* Validation --------------------------------------------------------- */
  const fields = [...form.querySelectorAll("input:not([type='checkbox']):not([type='radio']):not([readonly]), select")];

  function rule(field) {
    const v = field.value.trim();
    if (field.required && !v) return "Please fill this in.";
    if (!v) return "";
    switch (field.name) {
      case "idNumber":
        if (idType() === "national" && !/^\d{10}$/.test(v)) return "A Jordanian national ID number has ten digits.";
        if (idType() === "passport" && !/^[A-Za-z0-9]{5,14}$/.test(v)) return "Enter the passport number as printed.";
        return "";
      case "phone":
        return /^\+?[\d\s().-]{7,}$/.test(v) ? "" : "Enter a phone number we can reach.";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address.";
      case "registrationNumber":
        return /^[\d\s/-]{2,}$/.test(v) ? "" : "Enter the commercial registration number as issued.";
      case "startDate":
        return Number.isNaN(Date.parse(v)) ? "Enter a date." : "";
      case "branches":
        return /^\d{1,3}$/.test(v) ? "" : "Enter a number.";
      default:
        return "";
    }
  }

  function check(field) {
    const wrap = field.closest(".field");
    const error = wrap?.querySelector(".field__error");
    const message = rule(field);
    wrap?.classList.toggle("is-invalid", Boolean(message));
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
    return !message;
  }

  fields.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.closest(".field")?.classList.contains("is-invalid")) check(field);
    });
    field.addEventListener("blur", () => {
      if (field.value.trim()) check(field);
    });
  });

  const consents = [...form.querySelectorAll(".check input[type='checkbox'][required]")];
  consents.forEach((c) => c.addEventListener("change", () => c.closest(".check")?.classList.toggle("is-invalid", !c.checked)));

  function validate() {
    let first = null;
    for (const field of fields) if (!check(field) && !first) first = field;
    if (!pad.hasInk()) {
      sigWrap.classList.add("is-invalid");
      if (!first) first = sigWrap.classList.contains("is-typed") ? typedInput : sigWrap.querySelector("canvas");
    } else {
      sigWrap.classList.remove("is-invalid");
    }
    for (const c of consents) {
      const bad = !c.checked;
      c.closest(".check")?.classList.toggle("is-invalid", bad);
      if (bad && !first) first = c;
    }
    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return !first;
  }

  /* 4. Sign ------------------------------------------------------------ */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    submit?.setAttribute("aria-busy", "true");
    setStatus("", "");

    const signedAt = new Date();
    const documentText = normalise(agreement.innerText);
    const documentHash = await sha256(documentText);
    const data = Object.fromEntries(new FormData(form).entries());

    const payload = {
      kind: "rivet-subscription-agreement",
      version: AGREEMENT_VERSION,
      reference,
      document: { url: location.href.split("?")[0], sha256: documentHash, characters: documentText.length },
      signedAt: signedAt.toISOString(),
      signedAtLocal: dateTimeFmt.format(signedAt),
      timezone: TZ,
      customer: {
        legalName: data.legalName, tradeName: data.tradeName || "", registrationNumber: data.registrationNumber || "",
        address: data.address || "", city: data.city, branches: data.branches || "1",
      },
      signatory: {
        name: data.signatoryName, title: data.signatoryTitle || "Owner", idType: data.idType, idNumber: data.idNumber,
        phone: data.phone, email: data.email,
      },
      subscription: { plan: data.plan, startDate: data.startDate, term: data.term, quote: data.quote || "" },
      consents: { agreement: true, authority: true, electronic: true, accurate: true },
      signature: { method: pad.mode(), image: pad.toPNG(), typedName: pad.mode() === "typed" ? typedInput?.value.trim() : "" },
      client: { userAgent: navigator.userAgent, language: navigator.language, viewport: `${window.innerWidth}x${window.innerHeight}` },
    };

    let outcome = { delivered: false, configured: Boolean(endpoint), error: "" };
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        outcome.delivered = true;
      } catch (err) {
        outcome.error = String(err?.message || err);
      }
    }

    renderRecord(payload, outcome);
    submit?.removeAttribute("aria-busy");
  });

  function setStatus(kind, message) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-visible", Boolean(message));
    status.classList.toggle("is-success", kind === "success");
  }

  function renderRecord(p, outcome) {
    const put = (key, value) => record.querySelectorAll(`[data-out='${key}']`).forEach((el) => (el.textContent = value || "—"));
    const planNames = { starter: "Starter", growth: "Growth", pro: "Pro" };
    const idLabel = p.signatory.idType === "national" ? "National ID" : "Passport";
    put("reference", p.reference);
    put("version", p.version);
    put("legalName", p.customer.legalName);
    put("tradeName", p.customer.tradeName);
    put("registrationNumber", p.customer.registrationNumber);
    put("address", [p.customer.address, p.customer.city].filter(Boolean).join(", "));
    put("branches", p.customer.branches);
    put("signatoryName", p.signatory.name);
    put("signatoryTitle", p.signatory.title);
    put("id", `${idLabel} · ${maskId(p.signatory.idNumber)}`);
    put("phone", p.signatory.phone);
    put("email", p.signatory.email);
    put("plan", planNames[p.subscription.plan] || p.subscription.plan);
    put("startDate", formatDate(p.subscription.startDate));
    put("term", p.subscription.term === "24" ? "24 months" : "12 months");
    put("quote", p.subscription.quote);
    put("signedAt", `${p.signedAtLocal} (Amman)`);
    put("method", p.signature.method === "typed" ? "Typed name, adopted as signature" : "Drawn signature");
    put("hash", p.document.sha256);

    const img = record.querySelector("[data-out='signature']");
    if (img) {
      img.src = p.signature.image;
      img.alt = `Signature of ${p.signatory.name}`;
    }

    const st = record.querySelector(".record__status");
    if (st) {
      st.classList.toggle("is-success", outcome.delivered);
      st.textContent = outcome.delivered
        ? `Signed and sent to RIVET. Reference ${p.reference}. Download the signed copy for your records; RIVET will countersign and send the final version to ${p.signatory.email}.`
        : outcome.configured
          ? `Signed, but the page couldn't reach RIVET's server (${outcome.error}). Download the signed copy and send it to RIVET on WhatsApp; we'll take it from there.`
          : "Signed. This page isn't connected to RIVET's systems yet, so nothing was sent automatically. Download the signed copy and send it to RIVET on WhatsApp.";
    }

    form.hidden = true;
    record.hidden = false;
    document.title = `Signed · ${p.reference} · RIVET`;
    const heading = record.querySelector(".record__head");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    record.scrollIntoView({ behavior: "smooth", block: "start" });
    record.querySelector("[data-print]")?.addEventListener("click", () => window.print());
  }
}

/* Signature pad ---------------------------------------------------------- */

function createPad(canvas, wrap) {
  const ctx = canvas.getContext("2d");
  let strokes = [];
  let current = null;
  let typed = "";
  let modeName = "drawn";
  let width = 0;
  let height = 0;

  const style = () => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#0f0e0c";
    ctx.fillStyle = "#0f0e0c";
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    width = r.width;
    height = r.height;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  };

  const redraw = () => {
    ctx.clearRect(0, 0, width, height);
    style();
    if (modeName === "typed") {
      if (!typed) return;
      const size = Math.min(44, Math.max(24, (width - 48) / (typed.length * 0.62)));
      ctx.font = `italic 500 ${size}px Archivo, "Helvetica Neue", Arial, sans-serif`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(typed, 24, height - 52);
      return;
    }
    for (const s of strokes) {
      if (s.length < 2) {
        ctx.beginPath();
        ctx.arc(s[0].x, s[0].y, 1.2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    }
  };

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (modeName !== "drawn") return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    current = [pos(e)];
    strokes.push(current);
    wrap.classList.add("has-ink");
    wrap.classList.remove("is-invalid");
    redraw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!current) return;
    e.preventDefault();
    const p = pos(e);
    current.push(p);
    style();
    const n = current.length;
    ctx.beginPath();
    ctx.moveTo(current[n - 2].x, current[n - 2].y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  const end = () => {
    current = null;
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", end);

  window.addEventListener("resize", resize);
  if (document.fonts?.ready) document.fonts.ready.then(redraw);
  resize();

  return {
    hasInk: () => (modeName === "typed" ? Boolean(typed.trim()) : strokes.length > 0),
    clear() {
      strokes = [];
      typed = "";
      wrap.classList.remove("has-ink");
      redraw();
    },
    setMode(m) {
      modeName = m;
      redraw();
    },
    mode: () => modeName,
    setTyped(text) {
      typed = text.trim();
      wrap.classList.toggle("has-ink", Boolean(typed));
      redraw();
    },
    toPNG() {
      // Export on white so the copy prints and archives cleanly.
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const o = out.getContext("2d");
      o.fillStyle = "#ffffff";
      o.fillRect(0, 0, out.width, out.height);
      o.drawImage(canvas, 0, 0);
      return out.toDataURL("image/png");
    },
  };
}

/* Helpers ----------------------------------------------------------------- */

function makeReference() {
  const d = new Date();
  const ymd = [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n, i) => String(n).padStart(i ? 2 : 4, "0")).join("");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(5);
  (window.crypto || {}).getRandomValues?.(bytes);
  let tail = "";
  for (const b of bytes) tail += alphabet[b % alphabet.length];
  return `RVT-${ymd}-${tail}`;
}

function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function maskId(id) {
  const s = String(id || "");
  if (s.length <= 4) return s;
  return `${"•".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

function normalise(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

async function sha256(text) {
  if (!window.crypto?.subtle) return "unavailable";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
