# Wisper site — presentation redesign (AutomateFlow-inspired)

**Date:** 2026-06-28
**Repo:** `99labdev/wisper-site` (static site, Vercel, https://wisper.chat)
**Scope:** Approach A — keep the existing sections and copy; restyle how three
sections *present* their information, borrowing layout patterns from
https://automateflow.chat while keeping Wisper's existing colors, fonts, spacing,
and motion. No new dependencies, no framework, no new copy.

## Goals

- Make `#features`, `#how`, and `#platforms` read as a more polished, modern
  product page using AutomateFlow's presentation patterns.
- Keep the brand intact: cream paper (`--paper`), lilac/accent, serif display
  font, mono section index, film-grain + dot-grid background, existing
  `.reveal` / `[data-io]` scroll reveals.
- Reuse every existing `data-i18n` key. No copy rewrite, no new translations.
- No pricing section, no FAQ, no hero changes (the animated logo stays).

## Non-goals

- No new content sections (Pricing / FAQ / testimonials).
- No reuse of the old removed dictation demo (browser tabs + self-typing).
- No JS framework or build step changes — plain `index.html` + `assets/style.css`
  (+ minimal `assets/app.js` only if a mock needs a small driver; preferred:
  pure CSS animation).

## Existing building blocks to reuse

- Color tokens / fonts already in `assets/style.css` (`--paper`, `--ink`,
  `--ink-soft`, `--accent`, `--line`, `var(--display)`, `var(--mono)`, `--ease`).
- `.section-head` (h2 + `.idx` mono index) — kept on every section.
- `[data-io]` scroll-reveal observer in `assets/app.js` — applied to new nodes.
- `@keyframes meter` (left over in `style.css`) — reused by the `#how` pill mock.
- Existing i18n keys: `feat_head`, `feat1_t..feat6_t`, `feat1_d..feat6_d`,
  `how_head`, `step1_t..step3_t`, `step1_d..step3_d`, `plat_head`,
  `spec_*`, `plat_note`, `sec_why/sec_how/sec_platforms`.

## Section designs

### 1. `#features` → vertical alternating timeline

- Keep `.section-head` ("Built for fast, private dictation." / `01 — WHY`).
- Replace the `.features` grid with a `.timeline`:
  - A central vertical rule (`--accent` at low opacity), with a filled accent
    dot per item.
  - The 6 `.feat` items become `.tl-item` cards that alternate left/right on
    desktop (`:nth-child(even)` to the right of the line).
  - Each card: cream surface, 1px `--line` border, soft shadow (match existing
    card shadows), the `/0N` mono numeral as an accent "chip", `h3`, `p`.
  - Connector: a short horizontal tick from the card to the center dot.
- Mobile (`max-width: ~720px`): the rule moves to the left edge, all cards stack
  full-width to its right; dots align on the left rule.
- Reuse `feat1..feat6` i18n verbatim. Numerals stay (on-brand) instead of
  generic icons.

### 2. `#how` → deep-dive, two columns (steps + pill mock)

- `.section-head` kept ("Three steps, no friction." / `02 — HOW`).
- Two-column `.deepdive` grid (text left, mock right; collapses to 1 col on
  mobile, mock first):
  - **Left:** the 3 steps rendered as stacked `.dd-row`s — a numbered accent
    badge + `h3` + `p` (AutomateFlow's feature-row pattern). Reuse
    `step1..step3` i18n.
  - **Right:** a new CSS/HTML mock — the floating **dictation pill** on a faint,
    stylized app surface:
    - Dark rounded pill: a "Capturing" label, an animated audio meter (small
      bars driven by `@keyframes meter`), and a red stop dot.
    - Sits over a soft, blurred "document" card so it reads as "floats over any
      app." All in Wisper's palette. No tabs, no typing demo.

### 3. `#platforms` → deep-dive, two columns (mock + specs), sides swapped

- `.section-head` kept ("One app, every desktop." / `03 — PLATFORMS`).
- Two-column `.deepdive.alt` (mock left, text right — alternates vs `#how`):
  - **Left:** a new CSS/HTML mock — a stylized desktop **window** (three
    traffic-light dots, title bar, faint content) with three platform chips
    (macOS · Windows · Linux) and the small pill in a corner.
  - **Right:** the existing `.specs` grid (Platforms / Engine / Languages /
    Price) + the `plat_note` paragraph. Reuse `spec_*` and `plat_note` i18n.

### 4. `#download`

- Unchanged in structure/behavior. Optional light polish only: tighten the
  primary CTA card to read as a centered closing band (spacing/scale), no copy
  or logic changes. The download list + live-version JS stay as-is.

## Responsiveness & motion

- Timeline and both deep-dives collapse to a single column at the existing
  mobile breakpoint; mocks render above their text on mobile.
- New nodes get `data-io` so they fade/slide in with the existing observer.
- All new animation respects `prefers-reduced-motion` (meter + reveals already
  gated; new decorative motion gated too).

## Files touched

- `assets/style.css` — new rules: `.timeline`/`.tl-item`, `.deepdive`/`.dd-row`,
  `.mock-pill`, `.mock-window`; remove the now-unused `.features` grid rule if
  fully replaced.
- `index.html` — restructure the markup of `#features`, `#how`, `#platforms`
  (same `data-i18n` keys, new wrappers).
- `assets/app.js` — only if needed; goal is pure-CSS mocks (no change expected).

## Acceptance criteria

- `#features` shows a centered alternating timeline with 6 cards; reads cleanly
  on desktop and stacks on mobile.
- `#how` and `#platforms` are two-column deep-dives with the mock on opposite
  sides; both collapse correctly on mobile.
- All original text appears via the same `data-i18n` keys in every language.
- Palette, fonts, background texture, and scroll reveals match the rest of the
  site (no visual regression to hero/header/footer).
- No new runtime dependencies; site still works as a static page on Vercel.
- `prefers-reduced-motion` disables decorative animation.
```
