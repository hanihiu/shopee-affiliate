---
name: Shopee Flame
description: Premium dark-mode design system for the Shopee Affiliate Link Generator console.
colors:
  primary: "#EE4D2D"
  secondary: "#FF6633"
  tertiary: "#FFB74D"
  surface: "#0F1117"
  surface-alt: "#1A1D27"
  surface-elevated: "#242837"
  on-primary: "#FFFFFF"
  on-surface: "#E8E9ED"
  on-surface-dim: "#8B8FA3"
  success: "#22C55E"
  error: "#EF4444"
  border: "#2A2E3D"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.02em
  mono:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px
  button-secondary-hover:
    backgroundColor: "{colors.border}"
  card:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  input:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px
  badge-success:
    backgroundColor: "#0D3320"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: 8px
  badge-error:
    backgroundColor: "#3B1318"
    textColor: "{colors.error}"
    rounded: "{rounded.full}"
    padding: 8px
---

## Overview

**Shopee Flame** is a premium dark-mode design system for the Shopee Affiliate
Link Generator console. It fuses Shopee's signature warm orange with a deep
midnight surface, creating a bold, data-rich dashboard aesthetic.

The system prioritises clarity in dense information layouts, smooth
micro-interactions, and glassy depth cues that feel modern without sacrificing
readability.

## Colors

The palette pairs a near-black canvas with fiery warm accents.

- **Primary (#EE4D2D):** Shopee's iconic orange — anchors CTAs and active states.
- **Secondary (#FF6633):** Brighter orange for hover states and emphasis.
- **Tertiary (#FFB74D):** Warm gold for secondary badges and highlights.
- **Surface (#0F1117):** Deep midnight background that recedes behind content.
- **Surface-alt (#1A1D27):** Card and panel backgrounds — one step lighter.
- **Surface-elevated (#242837):** Inputs, elevated cards, dropdowns.
- **On-primary (#FFFFFF):** Text placed directly on the primary color.
- **On-surface (#E8E9ED):** Primary text on dark backgrounds.
- **On-surface-dim (#8B8FA3):** Secondary text, metadata, placeholders.
- **Success (#22C55E):** Positive status indicators.
- **Error (#EF4444):** Negative status indicators and validation errors.
- **Border (#2A2E3D):** Subtle dividers, card borders, input outlines.

## Typography

All UI text is set in **Inter**, a humanist sans-serif optimised for screens.
URLs and technical values use **JetBrains Mono** for instant visual distinction.

- **h1** — 2.25rem / 700 / tight tracking for section headers.
- **h2** — 1.25rem / 600 for card and panel titles.
- **body-md** — 1rem / 400 for primary content.
- **body-sm** — 0.875rem / 400 for secondary text.
- **label** — 0.75rem / 500 / wide tracking for form labels and captions.
- **mono** — 0.8125rem JetBrains Mono for URLs and code snippets.

## Layout

The console uses a single-column layout at mobile widths and a two-column
asymmetric grid on desktop (≥ 1024px). Cards float on the surface with
`spacing.lg` (24px) gutters.

## Elevation & Depth

Depth is conveyed through background-colour steps rather than shadows:

1. **Surface** — the page canvas.
2. **Surface-alt** — primary cards and panels.
3. **Surface-elevated** — nested elements, inputs, popovers.

A subtle `backdrop-filter: blur(12px)` glass effect is applied to card borders,
layered over a faint linear gradient from `primary` at 5% opacity, creating a
warm glow that hints at the brand colour without overwhelming content.

## Shapes

All interactive elements use `rounded.md` (10px) for a modern, friendly feel.
Cards use `rounded.lg` (16px). Status badges use `rounded.full` (pill shape).

## Components

### Buttons

- **Primary** — solid `primary` background, white text, 10px radius. Hover
  transitions to `secondary` with a subtle scale-up.
- **Secondary** — `surface-elevated` background, `on-surface` text. Hover
  brightens the background towards `border`.

### Cards

Cards sit on `surface-alt` with a 1px `border` stroke. A faint gradient overlay
from `primary` at 4% opacity bleeds across the top edge, giving a warm branded
glow.

### Inputs

Inputs use `surface-elevated` with a `border` outline. On focus the border
transitions to `primary` with a 3px ring in `primary` at 15% opacity.

### Badges

Status badges are pill-shaped. Success badges use a dark-green tint with bright
green text; error badges use a dark-red tint with bright red text.

## Do's and Don'ts

- **Do** use the `primary` color sparingly — only for the main CTA and active
  states. Overusing it dilutes its impact.
- **Do** keep text hierarchy clear: `on-surface` for primary text,
  `on-surface-dim` for metadata.
- **Don't** use pure white (`#FFF`) as a background — it breaks the dark-mode
  contract and causes eye strain.
- **Don't** mix rounded values — cards always use `lg`, buttons always use `md`,
  badges always use `full`.
