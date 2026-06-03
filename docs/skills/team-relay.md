[← README](../../README.md) · [Router](../ROUTER.md)

---

# team-relay

Rules for delegating implementation work to a configured remote team. Defines what is safe to delegate, who owns each lifecycle state in the delegated lane, the handoff template, and how Router coordinates Telegram notifications at each state transition. Active only when a remote team is configured.

---

## What gets delegated

**Safe to delegate:** standard feature tickets, non-sensitive UI changes, test additions, documentation.

**Never delegated:**
- Auth, identity, or access-control behavior
- Payment, billing, or Stripe flows
- Secrets, credentials, or infrastructure configuration
- Webhooks or security-sensitive backend logic
- Database migrations or schema changes
- Release-bound hotfixes

If scope drifts into a sensitive area mid-ticket, Builder pulls it back into the direct lane before more code is written.

---

## Delegated lane workflow

1. Builder reviews the ticket, confirms it's safe to delegate, writes the handoff on the GitHub issue
2. Builder moves ticket to `state:ready-for-implementation`; Router notifies the remote team via Telegram
3. Remote team implements, opens PR, moves ticket to `state:ready-for-review`
4. Builder reviews the code — if rejected: `state:changes-requested` + Router notification; loop continues
5. Builder accepts → `state:ready-for-qa`; Router notifies remote team for first-pass QA
6. Remote team runs QA: PASS → `state:qa-passed` + Router notification; FAIL → `state:changes-requested` + defects on ticket
7. You (Human Approver) are the only merge and close authority

Builder remains the accountable engineering lead throughout — the remote team implements, Builder reviews all code before it reaches QA.

---

## State ownership in the delegated lane

| State | Owner |
| --- | --- |
| `ready-for-implementation` | Builder (scoped and assigned) |
| `in-progress` | Remote team (implementing) |
| `ready-for-review` | Builder (reviewing) |
| `changes-requested` | Remote team (fixing) |
| `ready-for-qa` | Remote team (running first-pass QA) |
| `qa-passed` | You (merge and close decision) |

---

## Handoff template

Builder posts this on the GitHub issue when the ticket moves to `state:ready-for-implementation`:

```markdown
## Handoff — Ticket #[N]

**State:** ready-for-implementation
**Branch plan:** [new branch name]
**Environment:** [URL for QA]
**Starting auth state:** [logged out | role]
**Credentials / test data:** [where to get access — not the secret itself]

### Acceptance criteria
1. ...

### Out of scope
- ...

### Validation required before ready-for-review
- build, lint, tests, E2E (if user-facing)

### Return path
- After implementation: move to ready-for-review
- After Builder accepts: ready-for-qa (remote team runs QA)
- After QA: PASS → qa-passed; FAIL → changes-requested with defects
```

---

**Carried by:** [Router](../ROUTER.md)
