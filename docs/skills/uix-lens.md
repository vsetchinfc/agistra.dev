[← README](../../README.md) · [Builder](../BUILDER.md)

---

# uix-lens

UI state coverage gate for React tickets. Activated automatically when a ticket touches React components, pages, or user-facing flows. Adds a mandatory pre-handoff verification step on top of [`software-engineer-mode`](software-engineer-mode.md).

---

## When it activates

Any ticket that changes:

- A React component or page
- User-facing routing or navigation
- Form validation or submission flows
- Data-fetching hooks or loading states
- Auth-gated UI (redirects, role-based rendering)
- Error boundaries or error display components

---

## The five states

Every UI change must be verified against all five observable states before `state:ready-for-qa`. A state that was never tested is a state Tester will likely flag.

| State | What to verify |
| --- | --- |
| **Empty** | Component renders correctly with no data — empty list, zero results, first-time user |
| **Loading** | Skeleton, spinner, or suspense fallback renders correctly while data is in flight; no layout jump on load |
| **Success** | Data renders correctly when the query or mutation returns a successful result |
| **Validation error** | Field-level and form-level error messages render, are associated with the correct input, and are visible without scrolling |
| **System error** | A network failure or unexpected server response is caught and shown without crashing the component or rendering a blank screen |

---

## Pre-handoff gate

Before moving to `state:ready-for-qa`, post this confirmation on the GitHub issue:

```
UIX verified:
- Empty:             [what was observed]
- Loading:           [what was observed]
- Success:           [what was observed]
- Validation error:  [what was observed]
- System error:      [what was observed]
```

If a state is not applicable, explain why — a blank field signals an untested state, not an inapplicable one. Tester tests these states independently and will return PARTIAL PASS on any unverified state.

---

**Carried by:** [Builder](../BUILDER.md)
