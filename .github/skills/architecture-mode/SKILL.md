---
name: architecture-mode
description: "Use when: architecture mode, architect this, ADR, C4, PlantUML, system boundary, design decision, PRD gap, high ambiguity, multiple technical approaches, security architecture, data architecture, integration risk, implementability gap, story ticket, or epic ticket."
argument-hint: "Architecture question, unclear ticket, design decision, or implementation blocker"
---

# Architecture Mode

This skill gives the Architect first-principles architecture discipline. Architect pauses all other work, enters architecture mode, produces decision-ready artifacts, then creates a GitHub story or epic ticket as the handoff artifact before handing off to Builder.

## When to Enter Architecture Mode

Load this skill when any of these are true:

- the team lead says: "architecture mode", "architect this", "ADR", "C4", "PRD gap", "design decision", or "system boundary"
- The work has high ambiguity, multiple reasonable technical approaches, security/privacy/data risk, integration risk, or cross-module blast radius
- the work cannot be implemented safely because architecture or acceptance criteria are unsettled
- A story or epic ticket needs to be created to structure downstream implementation

## Mode Rules

- Do not implement while architecture-critical ambiguity remains. Architecture mode exits only after the team lead confirms the direction or ambiguity is resolved.
- Start from the most concrete entry point available: user journey, failing flow, dependency boundary, explicit decision point, or observed symptom.
- Separate facts from assumptions. Label every assumption explicitly.
- Name the exact artifacts and boundaries supporting each claim: route, screen, component, API, DTO, schema, config key, migration, metric, log event, failing test, or command output.
- If critical evidence is missing, explicitly stop to collect it before finalizing the decision.
- Ask the team lead focused clarification questions when the decision cannot be made safely from available evidence.
- Present real alternatives — not strawmen, not a single preselected option.
- Explore at least two viable approaches when the decision is non-trivial.
- State what is chosen, why, what is rejected, and what risk remains.
- Include operability: failure modes, detection, recovery, and verification where relevant.
- Connect every major recommendation to the next observable state that would show it is working: test, metric, log, trace, contract check, deploy health signal, or user-visible behavior.
- Convert architecture decisions into implementation-ready acceptance criteria before returning to builder mode.
- Prefer the smallest implementation slice that can validate the architecture without locking in unnecessary complexity.
- Create a GitHub story or epic ticket as the final output when the work will spawn multiple implementation tickets.
- If client-facing material is needed, hand off to `planner-mode` after technical truth is established.

## Architecture Intake Checklist

Before producing any artifact, identify:

- Purpose and scope of the decision
- Entry lens: user, test, system, analytics, or debug
- Source material reviewed (tickets, files, docs, existing ADRs)
- Exact evidence already available and the specific artifacts or boundaries it comes from
- Current system constraints and existing patterns
- Functional requirements
- Non-functional requirements and quality attributes
- Data, API, integration, security, and privacy concerns
- Cross-boundary surfaces affected: UI, client, service, data, infrastructure, and external integrations
- Current observable state and the next state that would validate the recommendation
- Existing decisions or patterns that must be preserved
- Missing information and verification needs
- Stakeholder gates, including team lead approval

## Architecture Entry Lenses

Choose the lens that best matches the question, and say so explicitly in the output.

| Lens | Start from | Work toward |
| ---- | ---------- | ----------- |
| User | The user's first meaningful interaction, pain point, or broken journey | The architecture and dependencies that shape that experience |
| Test | Edge cases, failure paths, and what must be provably true | The architecture that makes those checks reliable |
| System | Infrastructure dependencies, deployment/runtime constraints, and coupling | The application structure that must respect them |
| Analytics | User outcomes, business metrics, or adoption signals | The architectural causes and instrumentation gaps behind them |
| Debug | Symptoms, incidents, or degraded states | The root architectural causes and corrective boundaries |

Use one primary lens. Add a secondary lens only when it changes the decision materially.

## Evidence and Scope Discipline

- Prefer one precise architecture gap over a vague request to "improve the architecture".
- Every recommendation should point to the smallest useful unit of evidence.
- Prioritize options by impact, dependency order, operational risk, effort, and user impact.
- If evidence is weak, recommend evidence collection as the first slice instead of pretending certainty.
- Break implementation into small, independently testable slices with clear rollback boundaries.
- Record why the recommendation matters and which evidence elevated its priority.

## Architecture Principles

### Philosophy

Architecture is decision work. Every major artifact must clarify what was chosen, why it was chosen, what was rejected, and what risk remains. A 30-year architect knows that almost every system failure was predictable from the original design. Make the right trade-offs explicit before the first line of code.

**Rule of thumb:** If the architecture cannot be explained in five minutes to a senior developer, it is too complex. Complexity is a liability. Simplicity is a design achievement.

### Schools of Thought

Apply the most suitable framework per project context. No single school is dogma.

| School | When to apply |
| ------ | ------------- |
| Domain-Driven Design | Systems with complex business rules, multiple teams, or long-lived domain models |
| Clean Architecture | Systems where testability and framework independence is critical |
| C4 Model | All architecture communication work — default communication medium |
| Event-Driven / Event Sourcing | Audit trail, temporal queries, or decoupled async workflows as first-class requirements |
| Hexagonal / Ports & Adapters | Isolating core domain logic from infrastructure concerns |
| Microservices | Only when independent deployability, team autonomy, or scaling isolation is a documented requirement — not as a default posture |

**Cross-cutting rule:** Before selecting a pattern, state the problem it solves and confirm that problem exists in this system. Pattern selection without problem identification is architectural cosplay.

### Quality Attributes

Every architecture package must define measurable quality attribute scenarios where relevant.

| Attribute | Architecture question | Required expression |
| --------- | --------------------- | ------------------- |
| Availability | What must stay online, for whom, during which failures? | Target uptime, tolerated degraded modes, dependency failure behaviour |
| Latency | How fast must critical paths respond? | P50/P95/P99 targets by use case |
| Throughput | What load must the system absorb now and later? | Requests per second, peak factor, burst duration |
| Durability | What data loss is acceptable? | RPO, RTO, backup cadence, restore verification |
| Security | What must be protected, from whom, at which boundaries? | Threat model, trust boundaries, access model |
| Privacy | What personal or regulated data exists and how is it controlled? | Classification, retention, deletion, residency |
| Operability | How will the system be observed, alerted, recovered, maintained? | Logs, metrics, traces, runbooks, ownership |
| Maintainability | How will teams safely change the system over time? | Module boundaries, ownership, compatibility rules |
| Cost | What financial envelope constrains the design? | Monthly run-rate estimate, scaling cost curve, cost risks |

**Quality attribute scenario format:**

```
When [stimulus] occurs under [environment], the system should respond by
[response] within [measurable target], verified by [test, metric, or check].
```

**Rule:** Never use vague language such as "scalable", "secure", or "highly available" without a measurable scenario attached.

### Security and Privacy

Security is architecture, not a final checklist. Privacy is architecture, not a legal appendix.

Every architecture package involving users, tenants, integrations, payments, or sensitive data must define:

- **Trust boundaries** — where data crosses between users, systems, networks, services, tenants, or privilege levels
- **Threat model** — STRIDE: spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege
- **Authentication model** — identity provider, session/token model, service identity, machine-to-machine auth
- **Authorization model** — roles, permissions, policy decision point, policy enforcement point, least-privilege boundaries
- **Tenant isolation model** — row, schema, database, account, or deployment isolation; explicit bypass risks
- **Secrets model** — storage, injection, rotation, audit, break-glass access
- **Data classification** — public, internal, confidential, personal, regulated, secret
- **Retention and deletion model** — deletion semantics, legal hold, backup retention, right-to-erasure impact

**Rule:** A security control that has no owner, no enforcement point, and no verification method is not a control. It is a wish.

### Data Architecture

Data outlives code. Most architecture failures eventually become data failures.

Every data architecture must define:

- **System of record** — which component owns each data concept
- **Consistency model** — strong consistency, eventual consistency, explicit inconsistency windows
- **Migration strategy** — expand/contract, backfill, dual-write, cutover, rollback, validation
- **Backup and restore** — cadence, restore test frequency, RPO/RTO, tenant-level restore expectations
- **Analytics boundary** — when operational data is replicated to reporting stores instead of queried directly

**Rule:** Never design a write path without also designing the correction path. Bad data will happen; architecture must say how it is detected, corrected, and audited.

### Integration and API Discipline

Integrations fail at the contract boundaries.

Every API, event, webhook, or external integration must define:

- **Contract ownership** — who owns the contract and approves breaking changes
- **Versioning strategy** — URL, header, event type, or schema version
- **Compatibility policy** — backward compatibility rules, deprecation window, migration support
- **Error contract** — stable error codes, retryability, validation errors, correlation IDs
- **Idempotency** — required for payment, provisioning, workflow, webhook, and command-style operations
- **Rate limits and quotas** — tenant, user, and integration limits

**Rule:** A contract is not complete until failure behaviour is documented. Success-only APIs are incomplete architecture.

### Architecture Anti-Patterns

Actively search for and call out these failure patterns early:

| Anti-pattern | Why it fails |
| ------------ | ------------ |
| Distributed monolith | Multiple deployables remain tightly coupled and must change together |
| Shared database between services | Ownership, schema evolution, security, and deployment independence collapse |
| Premature microservices | Operational cost arrives before team or scaling need justifies it |
| Chatty synchronous chains | Latency, fragility, and cascading failure increase with every hop |
| Unbounded queues | Backlogs hide overload until recovery is expensive or impossible |
| Leaky tenant isolation | One tenant's data, load, config, or permissions can affect another tenant |
| Anemic domain model | Business rules scatter across services, jobs, and UI code |
| Report queries on transactional paths | Analytics pressure degrades operational workloads |

**Rule:** Naming an anti-pattern is not enough. State the observed evidence, impact, and recommended correction.

## ADR Format — Michael Nygard Default

```markdown
# ADR-NNN: [Decision title in imperative mood]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-NNN]

## Context
[What is the problem? What forces are at play? What constraints exist?
State without solution bias. A reader who has never seen this system
should understand the problem from this section alone.]

## Decision
[What was decided? "We will use X" not "X will be used".]

## Alternatives Considered
[Genuine alternatives, not strawmen. Each alternative must have been
seriously evaluated with the reason it was rejected.
Minimum: two alternatives.]

## Consequences
[What does this decision make easier? Harder? What new problems does it
create? Both positive and negative consequences.]

## Assumptions
[What must be true for this decision to hold? If any assumption is
invalidated, this ADR should be revisited.]
```

**ADR quality bar:**

- An ADR with no genuine alternatives is an announcement, not a decision record.
- An ADR without consequences is incomplete — every decision has costs.
- An ADR without assumptions is overconfident.

## C4 Diagram Standards

| Level | When produced |
| ----- | ------------- |
| Context (L1) | Always. Every engagement. |
| Container (L2) | Always. Every engagement. |
| Component (L3) | Only when a Container is complex enough that two senior developers would disagree on its internal structure. |
| Code (L4) | Never. Code is the truth at this level. |

Non-negotiable rules:

- All diagrams are PlantUML source files committed to version control. No static PNGs as the primary artifact.
- Every element has a label describing *what it is* and a technology annotation.
- Every relationship has a label describing *what it does*, not just an arrow.
- A diagram that requires a 10-minute verbal explanation has failed. Revise it.

## Architecture Review Rubric

| Criterion | Passing standard |
| --------- | ---------------- |
| Technical correctness | Claims grounded in source material, standards, evidence, or explicit assumptions |
| Feasibility | Builder can turn the package into implementation work without major reinterpretation |
| Completeness | Scope, gaps, ADRs, diagrams, risks, and acceptance criteria all represented |
| Clarity | Senior engineers understand the implementation implications |
| Consistency | Terms, boundaries, diagrams, ADRs, and specs agree with each other |
| Operability | Failure modes, observability, recovery, ownership, and release concerns addressed |
| Security/privacy | Trust boundaries, data classes, access model, and risks explicit |
| Practical implementation value | The package reduces engineering ambiguity instead of adding ceremony |

**Rule:** Any criterion below passing standard becomes a known gap with an owner and resolution path.

## Decision Output

Use this structure for the architecture recommendation:

```markdown
## Architecture Recommendation

**Purpose:** [what decision this resolves]
**Scope:** [included / excluded]
**Source Material:** [tickets, files, docs, assumptions]

### Assumptions
- [assumption and verification need]

### Evidence and Current State
- [exact artifact or boundary -> observed behavior, gap, or constraint]

### Entry Lens and Decision Drivers
- [primary lens]
- [priority drivers: impact, dependency, risk, effort, user/system effect]

### Options Considered
| Option | Pros | Cons | Risk |
| ------ | ---- | ---- | ---- |
| A | ... | ... | ... |
| B | ... | ... | ... |

### Decision
[chosen approach and rationale]

### Implementation Constraints
- [constraints Builder must preserve in implementation]

### First Validation Slice
- [smallest independently testable implementation or evidence-collection step]

### Acceptance Criteria
- [testable criterion]

### Quality Attribute Scenarios
- [When X occurs, the system responds by Y within Z, verified by W]

### Security / Privacy Considerations
- [trust boundaries, data classification, access model, risks]

### Boundary Coverage
- [UI/client/service/data/infrastructure boundaries touched and the contract implications]

### Risks and Mitigations
- [risk -> mitigation]

### Verification Plan
- [how Builder validates in implementation]
- [what observable signals should change: tests, logs, metrics, traces, deploy health, user-visible behavior]
- [what Tester should verify, if applicable]

### Open Questions
- [questions for the team lead only if unresolved]
```

## Worked Examples

Illustrative only. Reuse the decision shape, not the repo-specific answer.

### Example A - Architecture: AI Tasker Stripe checkout and webhook ownership

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

### Example B - Architecture: AI Tasker paid restore intake sequencing

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

## Story / Epic Ticket Output

After producing the architecture recommendation and receiving team lead confirmation, create a GitHub story or epic ticket:

```markdown
## Story: [Architecture area or system capability]

**Type:** Story / Epic
**Source:** Architecture mode output — [date]

### Context
[2-3 sentences summarising the architectural decision and why this work exists]

### Architecture Constraints
- [constraints all implementation tickets must preserve]

### Acceptance Criteria
- [ ] [testable criterion 1]
- [ ] [testable criterion 2]

### Implementation Scope
[Outline of sub-tickets or implementation slices to be created by Builder]

### Out of Scope
- [explicit exclusions]

### Risks
- [residual risks for implementers to be aware of]
```

## Exit Criteria

Architecture mode is complete when:

- the team lead confirms the selected approach, OR
- The decision is low-risk and fully supported by source evidence

After exit, Architect either hands implementation directly to Builder or creates sub-tickets from the story/epic.

