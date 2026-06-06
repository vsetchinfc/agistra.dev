# Architecture Mode — Worked Examples

Illustrative only. Reuse the decision shape, not the repo-specific answer.

---

## Example A — AI Tasker: Stripe checkout and webhook ownership

```markdown
## Architecture Recommendation

**Purpose:** Decide where AI Tasker should implement Stripe checkout session creation, webhook verification, and payment confirmation for the existing audit and subscription flows.
**Scope:** Audit and subscription payments, webhook verification, and payment confirmation orchestration. Excludes customer portal and generic asset checkout.
**Source Material:** `docs/V1-SPRINT.md`, `src/lib/stripe.ts`, `src/pages/Audit.tsx`, `src/pages/Subscribe.tsx`, `docs/security/security-hardening.md`

### Assumptions
- Stripe secret and webhook signing secrets will be provided securely before implementation starts.
- Supabase remains the system of record for payment-side state.

### Evidence and Current State
- `src/lib/stripe.ts` is still a client stub that returns `null` instead of calling a real backend.
- `docs/V1-SPRINT.md` marks backend checkout, webhook handling, and payment email as not built.
- `docs/security/security-hardening.md` identifies Stripe webhook spoofing as a payment-layer threat.
- The frontend already exposes checkout entry points, so the unresolved boundary is backend ownership and verification.

### Entry Lens and Decision Drivers
- Primary lens: system
- Drivers: security, secret handling, backend ownership, reuse for later restore payments, implementation effort

### Options Considered
| Option | Pros | Cons | Risk |
| ------ | ---- | ---- | ---- |
| Supabase Edge Functions own checkout + webhook | aligns with existing Supabase backend surfaces and keeps payment state close to the data layer | adds another deployed server surface in Supabase | deployment/config drift |
| Vercel API routes own checkout + webhook | keeps web and Stripe server logic together | splits backend authority away from Supabase | contract drift between payment logic and persisted state |

### Decision
Use Supabase Edge Functions for checkout creation, webhook verification, and payment confirmation orchestration.

### Implementation Constraints
- `src/lib/stripe.ts` stays a thin client wrapper.
- Success UI cannot trust query parameters alone; it must reflect verified server-side payment state.
- Webhook signature verification is mandatory.

### First Validation Slice
- Implement audit-mode checkout session creation only and wire `src/lib/stripe.ts` to it.

### Acceptance Criteria
- Audit checkout returns a real redirect URL.
- Invalid webhook signatures are rejected.
- Successful payment confirmation is persisted and observable.

### Quality Attribute Scenarios
- When a valid Stripe webhook arrives in production, the system verifies the signature, persists the resulting payment state, and records an observable success signal without trusting client query parameters.

### Security / Privacy Considerations
- Stripe secret key and webhook signing secret remain server-side.
- Webhook spoofing is an explicit trust-boundary threat.

### Boundary Coverage
- UI/client: checkout trigger and success state
- service: checkout/session creation, webhook verification, email trigger
- data: payment or subscription linkage
- infrastructure: secret injection and function deployment

### Risks and Mitigations
- Missing secrets -> record as an external blocker before implementation
- Contract drift -> keep response shape aligned with the client helper and tests

### Verification Plan
- Focused checkout session test
- Webhook signature rejection check
- E2E redirect and confirmed-payment flow once backend state is wired
```

---

## Example B — AI Tasker: paid restore intake sequencing

```markdown
## Architecture Recommendation

**Purpose:** Decide whether AI Tasker should build public paid restore intake now or continue internal recovery work first.
**Scope:** Recovery sequencing across admin bootstrap, restore foundation, project restore, and public paid intake. Excludes Stripe implementation details beyond dependency boundaries.
**Source Material:** `docs/V1-SPRINT.md`, `supabase/migrations/20260505000001_archive_restore_foundation.sql`, `supabase/migrations/20260505000002_admin_recovery_console.sql`, `supabase/migrations/20260506000001_admin_project_restore_contract.sql`

### Assumptions
- Internal recovery work can ship value before public payment intake is available.
- Public restore intake should not launch without trustworthy payment confirmation.

### Evidence and Current State
- `docs/V1-SPRINT.md` marks archive/restore foundation and admin recovery console as shipped.
- The same sprint document marks public paid restore intake as dependent on checkout, webhook, and payment email work.
- Existing restore migrations already establish restore requests, audit trails, and admin restore contracts.

### Entry Lens and Decision Drivers
- Primary lens: system
- Drivers: dependency order, operational trust, payment verification, delivery sequencing, reuse of existing restore infrastructure

### Options Considered
| Option | Pros | Cons | Risk |
| ------ | ---- | ---- | ---- |
| Build public paid restore intake now with temporary/manual payment handling | earlier public surface | creates a weak payment boundary and more rework later | users can enter a flow that lacks trustworthy confirmation |
| Continue internal recovery work first and defer public intake until Stripe foundations exist | preserves delivery momentum and keeps the payment boundary trustworthy | public restore sales remain deferred | delayed user-facing monetization |

### Decision
Continue internal recovery delivery first and defer public paid restore intake until checkout, webhook, and payment confirmation foundations exist.

### Implementation Constraints
- Public restore intake must reuse the existing restore request and audit model.
- No public payment UX should ship without verified payment completion.
- Internal restore/admin work must stay independently shippable.

### First Validation Slice
- Complete and validate the remaining internal restore contract and admin flow independently of Stripe.

### Acceptance Criteria
- Internal restore flows ship without depending on public checkout.
- Public paid restore intake remains blocked on verified payment foundations.
- Later public intake can attach to the existing restore request and admin review model.

### Quality Attribute Scenarios
- When an admin restores an archived project before public payments are live, the system restores the archived entities transactionally and records auditable restore metadata without depending on Stripe.

### Security / Privacy Considerations
- Recovery data remains behind the admin boundary until payment verification and public intake trust boundaries are designed.

### Boundary Coverage
- UI/client: future public restore intake, current admin console
- service: restore RPCs and later checkout/webhook functions
- data: restore requests, audit logs, archived entity metadata
- infrastructure: admin bootstrap secrets and future payment secret handling

### Risks and Mitigations
- Deferred monetization -> keep dependency chain explicit in the queue and story breakdown
- Future integration drift -> preserve a stable restore-request contract now

### Verification Plan
- Focused admin restore tests and e2e checks stay green
- Queue sequencing continues to show Stripe-backed public intake after the internal restore slices
```
