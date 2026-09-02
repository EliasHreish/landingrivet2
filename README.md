# RIVET — landing page

Marketing site for RIVET, the revenue and operations platform for gyms in Jordan and the MENA region.
Static HTML, CSS and vanilla JavaScript. No build step, no dependencies.

## Run it

Any static server works. From this folder:

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. The `.claude/launch.json` entry `rivet-static` does the same thing.

## Structure

```
index.html            Page markup and all copy
css/styles.css        Design tokens, typography roles, sections, responsive rules, reduced motion
js/main.js            Scroll engine, navigation, reveals, the stack scene, the day clock, accordion
assets/brand/         rivet-glyph.svg, rivet-lockup.svg (rebuilt from the source PNGs), source PNGs
assets/fonts/         Self-hosted Archivo (variable), IBM Plex Mono, IBM Plex Sans Arabic
assets/og-image.png   Social preview (1200 x 630)
favicon.svg
```

## Creative direction

- **Thesis:** one pin locks the whole stack. The logo is a selectorized weight stack, so the page treats the
  gym's six areas as plates and RIVET as the pin that turns loose plates into a single, accountable load.
- **Palette:** warm paper `#F4F0E8`, near-black ink `#0F0E0C`, charcoal `#1B1A18`, one signal red `#FF3131`.
  No gradients, no glass, no decorative color.
- **Type:** Archivo (expanded weights for display, normal width for body), IBM Plex Mono for indices and
  metadata, IBM Plex Sans Arabic for the bilingual moment.
- **Motion vocabulary:** reveal (masked lines and wipes), stack (staggered settling), lock (the red pin
  sliding in: buttons, nav, module rows, section heads), lift (sheets covering the previous section, the
  full stack rising at the end of the scene).
- **Signature moment:** section 02, a pinned scene where the selector pin descends plate by plate as you
  scroll, engaging Sales, Memberships, Payments, Reception, Operations and Member activity, then lifts the
  full stack.
- **Navigation:** a charcoal plate lowers from the top over a dimmed page, with monumental indexed labels.
  Keyboard accessible: focus is trapped, Escape closes, the page behind is inert.

## Editing

- All copy lives in `index.html`. Composed headlines use `<span class="line"><span>…</span></span>` per line
  so the masked reveal and the line breaks are deliberate. On phones the two long editorial headlines flow
  inline automatically.
- Colors, spacing, easing and type roles are tokens at the top of `css/styles.css`.
- The stack scene's pacing lives in `js/main.js` (`INTRO`, `OUTRO`, and the unlock, travel, lock phases)
  and its scroll length in `css/styles.css` (`.stack { --steps }`).

## Before launch

- `hello@rivet.jo` is a placeholder contact address (header, navigation, footer). Replace it, or point the
  "Book a walkthrough" links at a booking page.
- The `og:image` meta tag needs the absolute URL of `assets/og-image.png` once the site has a domain.
- Copy describes the platform's scope (sales, memberships, payments, reception, daily operations, member
  activity) and regional fit (JOD to the fils, cash, card, CliQ, installments, Arabic and English, Ramadan
  hours, family plans, multi-branch). Confirm every capability line against the product before publishing.

## Accessibility and performance

- Semantic sections, skip link, visible focus states, `aria-expanded` and `aria-controls` on the menu and
  module rows, a live region for the day clock, and an `aria-label` describing the custody chain diagram.
- `prefers-reduced-motion` removes pinning, parallax, and entrance motion; the stack scene becomes a static,
  fully pinned diagram with the six modules listed beside it.
- Only transforms, opacity and clip-path are animated. One passive scroll listener drives every scene.
  Fonts are self-hosted and preloaded. Total page weight is under 300 KB with no images.
