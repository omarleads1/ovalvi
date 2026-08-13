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
| `index.html` | Marketing site: hero, customer logo wall, capture & share, **Ask** (the queryability pitch), features, metrics, security |
| `request-access.html` | Four-step qualification form (about you, organization, deployment, review). Client-side validation, live seat and rollout banding, editable review step, mocked confirmation with a reference ID |
| `login.html` | SSO-first sign-in mockup. Every path dead-ends politely: there is no signup, no account store, and nothing to authenticate against |

```
assets/css/styles.css      design tokens + all page styles
assets/js/site.js          sticky header, mobile nav, scroll reveal, Ask demo
assets/js/request-access.js  step machine, validation, review, mock submit
assets/js/login.js         email validation + "no IdP configured" dead end
```

## Design notes

- **Pricing is never shown.** Every commercial CTA routes to `request-access.html`; the copy says explicitly that pricing is scoped per deployment.
- **No self-serve signup.** The login page states that accounts are provisioned by an administrator and links to the request form instead of a signup page.
- **Palette is deliberately narrow**: near-black ink, warm off-white surfaces, hairline borders, and a single cobalt accent (`--accent: #2b49ff`) used sparingly. Illustrations are light, near-monochrome product mockups built in HTML/CSS rather than dark multi-colour art.
- **Logo**: a tilted oval ring with a perpendicular ghost ring and a play triangle, reading as "oval" plus lens plus play. Defined inline as SVG (`.logo-mark`) and as a favicon data URI; colours come from CSS so it inverts on dark surfaces.
- **Type**: Inter Tight for display, Inter for body, Instrument Serif for pull-quotes.
- Fonts load from Google Fonts; everything else is local and works offline.

## Customer logos

Social proof is the logo wall only. There are no quotes and no named people anywhere on the site.

`assets/logos/` holds 18 full horizontal lockups (mark plus wordmark), sourced from Vector Logo Zone and Wikimedia Commons. Each file was re-cropped to a tight `viewBox` measured from its real bounding box, so the wall can be sized optically instead of every logo being boxed to the same square.

Heights follow `h = 34 / sqrt(aspect)`, which holds roughly constant area across a range from Salesforce's compact cloud to Atlassian's 8:1 lockup. Brand colour is preserved in the file and neutralised in CSS with `grayscale(1) brightness(.72)`; hovering the wall restores full colour.

These are real trademarks used as placeholder social proof for a fictional product. Swap them for actual customers before this goes anywhere public.

## Copy conventions

No em dashes anywhere in the site copy or the code comments. Use commas, colons, full stops, or parentheses instead.
