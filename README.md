# Ovalvi

Marketing site and login mockup for **Ovalvi**, a fictional enterprise-only competitor to Loom and Tella.

## Run it

No build step, no dependencies. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Marketing site — hero, customer logo wall, capture & share, **Ask** (the queryability pitch), features, metrics, security |
| `request-access.html` | Four-step qualification form (about you → organization → deployment → review). Client-side validation, live seat/rollout banding, editable review step, mocked confirmation with a reference ID |
| `login.html` | SSO-first sign-in mockup. Every path dead-ends politely — there is no signup, no account store, and nothing to authenticate against |

```
assets/css/styles.css      design tokens + all page styles
assets/js/site.js          sticky header, mobile nav, scroll reveal, Ask demo
assets/js/request-access.js  step machine, validation, review, mock submit
assets/js/login.js         email validation + "no IdP configured" dead end
```

## Design notes

- **Pricing is never shown.** Every commercial CTA routes to `request-access.html`; the copy says explicitly that pricing is scoped per deployment.
- **No self-serve signup.** The login page states that accounts are provisioned by an administrator and links to the request form instead of a signup page.
- **Palette is deliberately narrow** — near-black ink, warm off-white surfaces, hairline borders, and a single cobalt accent (`--accent: #2b49ff`) used sparingly. Illustrations are light, near-monochrome product mockups built in HTML/CSS rather than dark multi-colour art.
- **Logo**: a tilted oval ring with a perpendicular ghost ring and a play triangle — "oval" + lens + play. Defined inline as SVG (`.logo-mark`) and as a favicon data URI; colours come from CSS so it inverts on dark surfaces.
- **Type**: Inter Tight for display, Inter for body, Instrument Serif for pull-quotes.
- Fonts load from Google Fonts; everything else is local and works offline.

## Customer logos

Social proof is the logo wall only — there are no quotes and no named people anywhere on the site.

The 18 marks come from [Simple Icons](https://simpleicons.org) (CC0 icon set) and are inlined as `<symbol>` elements in `index.html`, each with a tight `viewBox` so they can be optically sized rather than boxed. They render in `currentColor`, so the whole wall greys out and lifts on hover from one CSS rule.

These are real trademarks used as placeholder social proof for a fictional product. Swap them for actual customers before this goes anywhere public.
