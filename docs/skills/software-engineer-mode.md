[← README](../../README.md) · [Builder](../BUILDER.md)

---

# software-engineer-mode

Builder's core delivery playbook. Loaded at the start of every ticket session — covers classification, TDD gate, implementation, validation, closeout, and PR handoff with engineering discipline rules that prevent scope expansion and over-engineering.

---

## When it activates

Every Builder ticket session, automatically.

---

## The workflow

### Step 1 — Read before touching anything

Read the repo workflow doc, the ticket/PRD/acceptance criteria, and the affected module plus one nearby test. Before the first edit, capture:

- entry point (failing test, file, route, or review comment)
- evidence already available
- one local hypothesis, or two options if the choice is non-trivial
- first validation slice
- expected verification signals

### Step 2 — Branch and setup

Follow the repo branch policy. Move the ticket to `state:in-progress`.

### Step 3 — Implement (TDD gate for Logic/Service/Bug)

Classify the ticket first:

| Type | TDD gate |
| --- | --- |
| Logic / Service / Bug | Write failing test → confirm it fails for the right reason → write production code |
| UI / Layout | Optional — implement then test if the repo has a component test surface |
| Contract / Migration | Write contract or type check first when possible |
| Architecture / BD | No code |

Then implement: match existing patterns, fix cause not symptom, prefer the smallest reversible change, implement only what the ticket specifies.

### Step 4 — Validate in order

1. Behavior-scoped check (failing test or observable signal)
2. Narrow test for the touched slice
3. Narrow lint or typecheck
4. Broader repo validation required by local policy

If the observed signal is ambiguous — one disambiguating check, then repair before widening scope.

### Step 5 — Closeout

Report: what changed and why, evidence that drove it, chosen approach, validation result, verification signals, open risks. Move ticket to `state:ready-for-qa` only after all active lens gates are confirmed.

---

## Engineering discipline rules

- The ticket is the contract — no unrequested features
- Match existing architecture, naming, and layering patterns
- Prefer the simplest solution that satisfies every acceptance criterion
- Three similar occurrences before abstraction (YAGNI applies)
- No `console.log` in production paths, no `@ts-ignore` without an explanatory comment
- Never widen scope after a failed validation until the local defect is understood

---

## Domain lens skills (activated per ticket type)

| Lens | Activates when |
| --- | --- |
| `uix-lens` | Any ticket touching React components or UI state |
| `csv-lens` | Any ticket touching RPC calls or TypeScript client contracts |
| `inf-lens` | Any ticket touching migrations, env vars, or deployments |

Each lens adds a specific readiness gate that must be confirmed before `state:ready-for-qa`.

---

**Carried by:** [Builder](../BUILDER.md)
