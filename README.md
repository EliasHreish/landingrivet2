# RIVET — landing page

Marketing site for RIVET, the revenue and operations platform for gyms in Jordan and the region.
Static, dependency-light, built with Vite. No frameworks, no animation libraries.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
```

Deploy the contents of `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, S3, nginx).

## Pages

| Page | File | Notes |
|---|---|---|
| Home | `index.html` | Seven scenes, plans, and the walkthrough form |
| Privacy policy | `privacy.html` → `/privacy` | Draft for legal review, see `docs/legal-and-esignature.md` |
| Terms of service | `terms.html` → `/terms` | Includes the data processing addendum |
| Subscription agreement (e-signature) | `onboarding/sign.html` → `/onboarding/sign` | Gyms sign here at onboarding; posts an evidence record to `data-endpoint` |

Shared markup lives in `partials/` (`symbols.html`, `header.html`, `footer.html`) and is inlined by a small Vite plugin wherever a page has `<!-- @include partials/x.html -->`. Clean URLs work in dev (plugin) and on Vercel (`cleanUrls`).

## Contact details

Phone `077 837 8608` (`tel:+962778378608`), WhatsApp `wa.me/962778378608`, Instagram `@rivet.jo`. They appear in the footer, the menu, the legal pages and the signing page. Change them in `partials/footer.html`, `partials/header.html`, `privacy.html`, `terms.html` and `onboarding/sign.html`.

## Plans and prices

The `#plans` scene shows Starter, Growth and Pro. Prices are empty on purpose until they are signed off (`docs/pricing-tiers-signoff.md`). To publish a price, set `data-price` on the plan's `.plan__price` element in `index.html`.

## Connect the e-signature page

Set `data-endpoint` on `#sign-form` in `onboarding/sign.html` to the URL that receives the signed record. The record's shape and what the endpoint must do are in `docs/legal-and-esignature.md`. Until it is set, the page completes the signing locally and asks the signer to send the PDF on WhatsApp.

## Docs

- `docs/messaging-whatsapp-sms.md`: provider choice, template catalogue (AR/EN), quiet hours, go-live checklist
- `docs/email-go-live-flag.md`: the `EMAIL_MODE` flag and the checklist before `live`
- `docs/pricing-tiers-signoff.md`: what the site says per tier, decisions needed, sign-off table
- `docs/legal-and-esignature.md`: what to confirm with a lawyer, the e-signature flow, the evidence record, endpoint duties

## Connect the walkthrough form

The "Book a walkthrough" form posts JSON to the URL in the form's `data-endpoint` attribute in `index.html`:

```html
<form class="form cta__form" novalidate data-endpoint="https://example.com/api/walkthrough">
```

Payload fields: `gym`, `name`, `phone`, `city`, `members`, `source` (`"rivet-landing"`).
Any endpoint that accepts a JSON `POST` and answers with a 2xx works (your own API, Formspree, Basin, a Zapier/Make webhook).
Until an endpoint is set, submitting shows an honest "not connected yet" message instead of pretending to send.

## Structure

```
index.html            home page markup and copy
privacy.html          privacy policy
terms.html            terms of service + data processing addendum
onboarding/sign.html  subscription agreement and e-signature
partials/             symbols, header + menu, footer (inlined at build)
docs/                 internal decision documents
src/styles/
  tokens.css          colour, type, spacing, motion, z-index tokens
  base.css            reset, font, typographic roles, buttons, links
  header.css          fixed header, menu toggle
  menu.css            navigation sheet choreography
  stack.css           the stack: rail, plates, pin (the mark at working scale)
  hero.css            hero layout and intro choreography
  sections.css        scenes 02–06, form, footer
  plans.css           the plans scene
  doc.css             document pages (privacy, terms, agreement text)
  sign.css            signing page, signature pad, signed record, print
  motion.css          scroll reveals and reduced-motion rules
src/js/
  main.js             boot
  header.js           header theme / scrolled state / current section
  menu.js             open, close, focus containment, label fitting, page recede
  intro.js            hero sequence, gated on font load
  reveal.js           IntersectionObserver reveals
  journey.js          sticky stack + pin state machine
  dayline.js          pauses the day-line animation off screen
  form.js             walkthrough form validation and submission
  plans.js            renders plan prices from data-price
  page.js             boot for secondary pages
  sign.js             e-signature: pad, validation, hashing, evidence record
public/
  fonts/              Archivo variable (latin subset), self-hosted
  brand/              vector lockup and glyph, traced from the source logo
scripts/              design-review tooling (needs `npx playwright install chromium` once)
  shots.mjs           Playwright screenshots per breakpoint (design review)
  probe.mjs           evaluate an expression in the page at a breakpoint
  checks.mjs          intro / choreography / focus / reduced-motion captures
```

## Design system in one paragraph

Warm paper (`#f3efe6`), near-black ink (`#0f0e0c`), charcoal surfaces, one signal red (`#ff3131`).
One typeface, Archivo, with its width axis doing the work: slightly expanded for display and labels, normal for reading.
One symbol system, the stack: a rail, plates, and a red pin. It is the logo at working scale and the page's only illustration language.
Motion vocabulary: reveal (from beneath a rule), slide/stack (plates into the rack), lock (the pin's hard-stop move), recede (the page behind the menu).

## Accessibility notes

- Semantic landmarks, skip link, visible focus rings, keyboard-operable menu with Escape and focus containment.
- `prefers-reduced-motion` keeps every state change and removes movement, pinning and the continuous day-line animation.
- Colour contrast: body and label text meet WCAG AA on both paper and ink surfaces; red is used for signals, not for small text.
- The page renders fully without JavaScript (reveals only hide content once the app script has run, with a safety timeout).

## Social card

`public/og.png` (1200×630) is referenced by the `og:image` meta tag with the absolute URL `https://rivetlanding.vercel.app/og.png`. If the site moves to a custom domain, update `og:url` and `og:image` in `index.html`.

## Brand assets

`Rivet 4K.png`, `rivet-lockup-source.png`, `rivet-glyph-source.png` and `favicon.svg` in the repo root are the source files.
`public/brand/rivet-lockup.svg` and `public/brand/rivet-glyph.svg` are the vector versions used by the site.
