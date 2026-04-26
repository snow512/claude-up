# Fix-Issue Guide

How to approach a bug report or rough-edge fix in this codebase. Rules below are hard — they take precedence over convenience when they conflict.

---

## 1. Library-first, not CSS-first

**When a UI library produces unwanted behaviour (a ghost border, a stray outline, a tooltip that won't dismiss, etc.), fix it at the library's configuration layer — not with CSS that targets the library's internals.**

### Process

1. **Search the library's own props / options.** Type definitions live in `node_modules/<lib>/types/` or `@types/<lib>/`. Grep for the property you'd expect (e.g. `outline`, `focus`, `border`, `accessibility`). Also check the library's docs and issue tracker.
2. **If a prop / option exists — use it.** One line, explicit intent, survives version bumps.
3. **If nothing exists — STOP and tell the user.**
   - Do **not** add `[&_.lib-internal-class]:outline-none` cascades.
   - Do **not** override library CSS variables that aren't documented.
   - Do **not** reach into children via descendant selectors.
   - Report: "I investigated `<lib>` and couldn't find a supported option to fix X. Fixing this would require overriding library internals, which violates `~/.claude/library/fix-issues.md`. Proceed anyway with explicit approval, or leave the issue open."
4. **Only proceed with a CSS workaround if the user explicitly grants permission** for this specific issue. When they do, leave a one-line comment saying what you tried first and link back to this doc.

### Why

Library internal class names (`.recharts-wrapper`, `.swiper-slide-active`, etc.) are **not a public API**. They rename between minor versions. Descendant-selector overrides also leak into unrelated children and create invisible side effects. Every such patch becomes future-archaeology work.

A half-ugly UI is less bad than a fragile patch. If the user decides the cosmetic issue is worth the risk, let them make that call consciously — don't silently take on technical debt on their behalf.

### Example — Recharts focus outline

Symptom: clicking a chart shows a thick focus border.

- **Investigation**: grep `node_modules/recharts/types` for `outline` / `focus` / `accessibility` → finds `accessibilityLayer?: boolean` on chart components (CartesianChart, RadarChart, etc.).
- **Fix**: `<LineChart accessibilityLayer={false}>`. One prop, done.
- **Without the prop**: would have been `<div className="[&_.recharts-wrapper]:outline-none [&_*]:focus:outline-none">...`. Fragile, brittle, illegal under this rule.

---

## 2. Root cause before surface patch

If a symptom can be explained either by a local bug (quick patch) or by a structural issue (data model, identity, ownership), **diagnose first, patch second**. A two-line patch that papers over the structural issue usually generates a new bug in the opposite direction within weeks. See `CLAUDE.md` → Design Discipline for the exact checklist.

---

## 3. Reproduce before declaring a fix

Before claiming an issue is fixed, walk through the original reproduction path in your head (or in a browser if UI). Don't rely only on "tsc passes / lint passes / tests pass" — those confirm correctness of the **new** code, not that the **bug** is gone.

---

## 4. Scope: fix what you were asked to fix

Don't bundle "while I'm here" cleanup into a bug fix unless the user asked for it. See `CLAUDE.md` → Scope Discipline. When in doubt, ask.
