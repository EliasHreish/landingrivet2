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
index.html            page markup and copy (one page, seven scenes)
src/styles/
  tokens.css          colour, type, spacing, motion, z-index tokens
  base.css            reset, font, typographic roles, buttons, links
  header.css          fixed header, menu toggle
  menu.css            navigation sheet choreography
  stack.css           the stack: rail, plates, pin (the mark at working scale)
  hero.css            hero layout and intro choreography
  sections.css        scenes 02–07 and footer
  motion.css          scroll reveals and reduced-motion rules
src/js/
  main.js             boot
  header.js           header theme / scrolled state / current section
  menu.js             open, close, focus containment, label fitting, page recede
  intro.js            hero sequence, gated on font load
  reveal.js           IntersectionObserver reveals
  journey.js          sticky stack + pin state machine
  dayline.js          pauses the day-line animation off screen
  form.js             validation and submission
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
