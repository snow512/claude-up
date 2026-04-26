# Emoji Conventions (template)

Project-agnostic rules for using emoji in UI. Copy this file into any project's `docs/specs/` and append a project-specific "Canonical inventory" section below the principles. Keep the product visually calm — an emoji should communicate something a plain label cannot, otherwise use text.

## Principles

1. **Prefer single-object emojis over compound/sequence emojis.** `📈` over `📈️` + variation selector. `🛠` over `🛠️`. Shorter grapheme clusters render more consistently across platforms and avoid double-width gaps in segmented controls.
2. **One emoji per control.** Never stack emojis as labels (`📈📊`). If you need to differentiate, add a text label instead.
3. **Same purpose → same emoji, everywhere.** Pick one glyph for a concept and reuse it across every surface — no per-page reinvention.
4. **Status emojis are semantic, not decorative.** If an emoji maps to a state (risk band, severity, success/failure), anchor the mapping in a single source-of-truth module and import from there; do not inline the emoji at call sites.
5. **Category / taxonomy icons are single-sourced.** If the project has a category axis, all category glyphs live in one file — do not duplicate them across components.
6. **No emoji in microcopy or body text.** Emojis belong in buttons, toggles, badges, and section headers only.

## When NOT to use an emoji

- As a replacement for an accessible label — always set `aria-label` and `title` on the control.
- Inside body paragraphs, tooltips that already carry descriptive text, or table cells.
- For decorative bullets (use CSS `list-style` instead).
- In error messages or status banners where tone matters more than iconography.

## Adding a new emoji

1. Check the project's canonical inventory — does something close already exist? Reuse it.
2. Pick a single-codepoint or stable single-grapheme emoji. Avoid ZWJ sequences and variation selectors unless the rendered glyph differs meaningfully.
3. Update the canonical inventory in the same PR.
4. If the emoji represents a status (not just an icon on a button), anchor it in a single source-of-truth module and import from there.

## Canonical inventory

*Fill this section per project.* Keep a flat table per category (settings toggles, actions, status bands, category icons, etc.) listing emoji, purpose, and the source file that owns it. If an emoji is not in the inventory, it must not appear in the UI.

Example skeleton:

```markdown
### Actions
| Emoji | Purpose | Source |
|-------|---------|--------|
| 🔄 | Reset / restore defaults | ... |
```
