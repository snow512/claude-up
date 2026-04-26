---
version: alpha
name: My Project
description: |
  Concise statement of the brand voice, target audience, and product personality.
  Coding agents read this to make every generated screen feel native to your product.
colors:
  primary: "#1A1C1E"
  secondary: "#3B82F6"
  background: "#FAFAFA"
  surface: "#FFFFFF"
  text: "#1A1C1E"
  muted: "#6B7280"
  border: "#E5E7EB"
  accent: "#3B82F6"
  error: "#EF4444"
  success: "#10B981"
  warning: "#F59E0B"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: "700"
    lineHeight: "1.2"
  subheading:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: "600"
    lineHeight: "1.3"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "1.5"
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: "400"
    lineHeight: "1.4"
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  none: "0px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button:
    background: "{colors.primary}"
    text: "{colors.background}"
    rounded: "{rounded.md}"
    paddingX: "{spacing.md}"
    paddingY: "{spacing.sm}"
  card:
    background: "{colors.surface}"
    border: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input:
    background: "{colors.surface}"
    border: "{colors.border}"
    text: "{colors.text}"
    placeholder: "{colors.muted}"
    rounded: "{rounded.md}"
    paddingX: "{spacing.md}"
    paddingY: "{spacing.sm}"
---

# My Project — Design System

## Overview

State the **brand voice** and **product personality** in one paragraph: who the product is for, what feeling it should evoke (calm/energetic/serious), and the design philosophy (minimal/expressive/utilitarian).

Example: *"Calm and content-first. Designed for focused individual work — not for high-density dashboards. Visuals stay quiet so the content stays loud."*

## Colors

Describe the **rationale** behind the palette, not just the values (those are in the frontmatter).

- **`primary`** — The single anchor color of the brand. Used for the most important action on the screen.
- **`secondary`** — Supporting accent for non-critical interactive elements.
- **`background` / `surface`** — Background is the canvas; surface is for raised content (cards, modals).
- **`text` / `muted`** — Default text and subdued metadata.
- **`error` / `success` / `warning`** — Reserved exclusively for status — never decorative.

WCAG AA contrast (≥ 4.5:1 for body text) is the floor for any color combination. Never use color as the only signal of state — pair with an icon or label.

## Typography

One typeface across the system to keep the rhythm consistent.

- **`display`** — Reserved for hero/marketing sections. Avoid in app UI.
- **`heading`** — Page titles only. One per screen.
- **`subheading`** — Section dividers within a page.
- **`body`** — Default for prose, form labels, list items.
- **`caption`** — Metadata, timestamps, helper text.

Line height stays loose (1.4–1.5) for body to support long-form reading. Letter spacing tightens slightly for display sizes.

## Layout

The **spacing scale follows a 4 px grid**. Use scale steps directly — never invent intermediates.

- `xs` (4 px) — within a component (icon ↔ label)
- `sm` (8 px) — between adjacent fields
- `md` (16 px) — default content gap
- `lg` (24 px) — between section blocks
- `xl` / `2xl` (32 / 48 px) — between major page regions

Page max-width: stay below 1200 px for prose-heavy screens; allow full-width only for canvas/data tools.

## Elevation & Depth

Three flatness levels. Don't introduce a fourth.

- **Level 0 (flat)** — Default surface, no shadow.
- **Level 1 (raised)** — Cards, dropdowns. Subtle 1–2 px shadow.
- **Level 2 (overlay)** — Modals, popovers. Larger blur, with a backdrop dim.

Use elevation to signal **interactivity**, not for decoration.

## Shapes

Rounding is per component type — not per screen.

- Buttons / inputs → `rounded.md` (8 px)
- Cards / sheets → `rounded.lg` (16 px)
- Avatars / pills → `rounded.full`

Mixing radii within a single composition is a smell — pick one and stick with it.

## Components

- **Button** — `colors.primary` background, `colors.background` text. Single primary action per view; secondary actions are ghost/outline.
- **Card** — Container for related content. Always lifts to elevation level 1.
- **Input** — Single-line field. Border + placeholder text follow the muted palette; focused state uses `colors.accent` for the border.

When a component grows beyond ~3 props, prefer composition (smaller building blocks) over a "kitchen-sink" prop API.

## Do's and Don'ts

**Do**
- Use **semantic** color tokens (`primary`, `error`) — never raw hex in components.
- Reuse existing spacing/rounded scale steps; if you need a new one, justify it first.
- Keep one source of truth for each token — update the frontmatter, not individual usages.

**Don't**
- Don't introduce ad-hoc colors for one-off screens.
- Don't override component tokens locally — extend via a new variant if the use case is real.
- Don't rely on color alone for status — always pair with text or icon.
