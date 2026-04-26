# Design Guide

Small set of rules the codebase should follow when writing UI code. These exist
because past code review caught the same mistakes repeatedly. Read them before
you reach for a shortcut.

---

## 1. Simple is best — don't inflate `className`

**Rule.** When a problem can be solved by a component prop, a library option,
or a single-line configuration change, **do not solve it by piling utility
classes onto the `className`**. Simple is best.

### Why

Bloated `className` strings are hard to read, hard to grep, hard to refactor,
and they hide the real intent of the code. A defensive cascade of
`[&_*]:focus:outline-none [&_.some-internal-class]:outline-none ...` is a code
smell — it means the author didn't find the right knob and tried to smother
the symptom with CSS.

Side effects:

- Descendant-selector (자손 선택자) utilities leak into unrelated children and
  can break future styling changes.
- They're fragile — the library's internal class names (`.recharts-wrapper`
  etc.) are not a public API and can change between minor versions.
- Every extra class is another thing a reader has to parse. Three lines of
  defensive CSS is worse than one prop.

### Process (strict)

1. **Look for an official option first.** Check the component's props, the
   library's docs, or the type definitions in `node_modules/<lib>/types/`.
   Most well-designed libraries expose a flag for the behavior you want.
2. **Use that option.** One line, explicit intent, survives upgrades.
3. **No option? Stop and report.** Do **not** fall back to custom CSS that
   targets library internals. Tell the user "I couldn't find an option to
   fix this; custom CSS into library internals is off-limits per the design
   guide." Let the user decide whether to accept the trade-off and grant
   explicit permission.

This is stricter than the usual "escape hatch" advice. Custom CSS over
library internals rots fast (class names change between minor versions),
and every such patch becomes someone else's archaeology job. When in doubt,
ship without the fix rather than ship a brittle one.

### Example: Recharts focus outline

❌ **Bad — defensive class cascade:**

```tsx
<div className="[&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_*]:focus:outline-none [&_*]:focus-visible:outline-none">
  <ResponsiveContainer>
    <LineChart data={rows}>
      {/* ... */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

This targets internal Recharts class names that aren't a public API, and
throws a wildcard `[&_*]` at every descendant. It hides the real fix.

✅ **Good — use the library's own option:**

```tsx
<div>
  <ResponsiveContainer>
    <LineChart data={rows} accessibilityLayer={false}>
      {/* ... */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

Recharts exposes `accessibilityLayer` as a proper prop. One flag, correct
intent, no `className` inflation.

---

## 2. Other conventions

This doc will grow as we catch more patterns worth codifying. For now, the
rule above is the one that keeps biting us. Add more only when there's a real
repeated mistake — don't write style rules preemptively.
