---
name: uix-lens
description: "Activate for any ticket that changes React components, user-facing flows, or UI state. Ensures all five observable UI states are verified before state:ready-for-qa."
argument-hint: "Component name, user flow, or ticket reference"
---

# UIX — UI State Coverage Lens

Activate this lens when a ticket changes React components, pages, UI state, or any user-facing flow. It does not replace `software-engineer-mode` — it adds a mandatory pre-handoff gate on top of it.

## When to Activate

Load this lens when the ticket changes any of the following:

- A React component or page (`src/components/`, `src/pages/`, `src/app/`)
- User-facing routing or navigation
- Form validation or submission flows
- Data-fetching hooks or loading states (`useQuery`, `useMutation`, Supabase realtime subscriptions)
- Auth-gated UI (redirects, role-based rendering, `RequireGuest`, `RequireAuth`)
- Error boundaries or error display components

## The Five States

Every user-facing UI change must be verified against all five states before claiming `state:ready-for-qa`. Name the component and confirm each state was observed:

| State | What to verify |
| ----- | -------------- |
| **Empty** | Component renders correctly when there is no data — empty list, zero results, first-time user with no records |
| **Loading** | Skeleton, spinner, or suspense fallback renders correctly while data is in flight; no layout jump when content loads |
| **Success** | Data renders correctly when the Supabase query or mutation returns a successful result |
| **Validation error** | Field-level and form-level error messages render, are associated with the correct input (`htmlFor`/`id` pairing), and are visible without scrolling |
| **System error** | A Supabase error, network failure, or unexpected server response is caught and shown to the user without crashing the component or rendering a blank screen |

## Additional Checks

Apply these when the ticket explicitly requires them or when the changed component is interactive:

- **Accessibility** — interactive elements have `aria-label` or visible labels; keyboard navigation reaches all controls; focus order is logical after state changes
- **Responsive** — layout does not break at `sm` / `md` breakpoints when the ticket touches layout or spacing
- **Auth boundary** — protected routes still redirect unauthenticated users; role-restricted views still gate correctly after the change
- **State transition** — if the component transitions from empty to success (e.g., after form submission triggers a refetch), verify the transition renders correctly without a flash, duplicate render, or stale data display

## Pre-Handoff Gate

Before moving the ticket to `state:ready-for-qa`, post the following confirmation on the GitHub issue:

```
UIX verified:
- Empty:             [what was observed]
- Loading:           [what was observed]
- Success:           [what was observed]
- Validation error:  [what was observed]
- System error:      [what was observed]
```

If a state is not applicable to this component (e.g., a static display component has no loading state), state why it was skipped. Do not leave fields blank — a blank field signals an untested state, not an inapplicable one.

Tester will verify these states independently. Submitting a ticket to QA without this confirmation means Tester is likely to return PARTIAL PASS on states that were never verified by Builder.
