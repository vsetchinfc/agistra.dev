---
name: documentation-and-adrs
description: "Records decisions and documentation. Use when making architectural decisions, changing public APIs, shipping features, or when you need to record context that future engineers and agents will need to understand the codebase."
argument-hint: "documentation question, ADR format, README review, or comment discipline question"
---

<!-- Source: addyosmani/agent-skills | Copyright 2025 Addy Osmani | MIT -->

# Documentation and ADRs

## Overview

Document decisions, not just code. The most valuable documentation captures the *why* — the context, constraints, and trade-offs that led to a decision. Code shows *what* was built; documentation explains *why it was built this way* and *what alternatives were considered*. This context is essential for future engineers and agents working in the codebase.

**Cross-reference:** ADR authoring is done via `architecture-mode` — this skill provides the documentation standard; `architecture-mode` provides the decision process.

**VBR integration:** An ADR is not complete until the file exists in the repo with all required sections populated. "Decided" ≠ "documented."

## When to Document

- Making a significant architectural decision
- Choosing between competing approaches
- Adding or changing a public API
- Shipping a feature that changes user-facing behaviour
- Onboarding new team members or agents to the project
- When you find yourself explaining the same thing repeatedly

**When NOT to document:** Do not document obvious code. Do not add comments that restate what the code already says. Do not write docs for throwaway prototypes.

## Architecture Decision Records (ADRs)

ADRs capture the reasoning behind significant technical decisions. They are the highest-value documentation you can write.

### When to Write an ADR

- Choosing a framework, library, or major dependency
- Designing a data model or database schema
- Selecting an authentication strategy
- Deciding on an API architecture (REST vs GraphQL vs tRPC)
- Choosing between build tools, hosting platforms, or infrastructure
- Any decision that would be expensive to reverse

### Storage Path

Store ADRs in `docs/decisions/` with sequential numbering: `ADR-<N>`, incrementing by one for each new record.

### ADR Structure

Every ADR must include these sections:

| Section | Purpose |
|---------|---------|
| **Status** | `Accepted`, `Superseded by ADR-XXX`, or `Deprecated` |
| **Date** | ISO date when the decision was recorded |
| **Context** | Problem being solved and constraints in force at the time |
| **Decision** | What was decided |
| **Alternatives Considered** | What was evaluated and why it was rejected |
| **Consequences** | Trade-offs, risks, and what changes as a result |
| **Assumptions** | What must be true for this decision to hold? If any assumption is invalidated, this ADR should be revisited. |

```markdown
# ADR-<N>: [Short imperative title]

## Status
Accepted

## Date
YYYY-MM-DD

## Context
[Problem statement and constraints that forced a decision]

## Decision
[What was decided]

## Alternatives Considered

### [Option A]
- Pros: ...
- Cons: ...
- Rejected because: ...

### [Option B]
- Pros: ...
- Cons: ...
- Rejected because: ...

## Consequences
[What gets better, what gets worse, what must change]

## Assumptions
[What must be true for this decision to hold? If any assumption is invalidated, this ADR should be revisited.]
```

### ADR Lifecycle

```
PROPOSED  →  ACCEPTED  →  (SUPERSEDED or DEPRECATED)
```

**No-delete rule:** Never edit or delete an existing ADR. Old ADRs capture historical context that is irreplaceable. When a decision changes, write a new ADR that references and supersedes the old one. The old ADR's status field becomes `Superseded by ADR-XXX`.

### Commit Ownership Rule

**Architect (or any agent) drafting an ADR or planning/decision document writes the file to disk and stops.** No `git add`, `git commit`, branch creation, or PR for the document itself. The team lead reviews the content and commits it personally.

This is the inverse of implementation work — code changes always go through a branch and PR (per `software-engineer-mode`), but decision documents are lightweight enough that git ceremony adds friction without adding safety. The more valuable gate is the team lead reading raw content before it enters history, not reviewing a PR diff of a new file.

**In practice:**
- Write the ADR file to `docs/decisions/` (or the project's decisions path).
- Confirm the file is saved and structurally complete.
- Stop. Do not stage, commit, branch, or open a PR.
- Inform the team lead that the file is ready for their review and commit.

## Inline Comment Discipline

### Comment the WHY, not the WHAT

```typescript
// BAD: Restates the code
// Increment counter by 1
counter += 1;

// GOOD: Explains non-obvious intent
// Rate limit uses a sliding window — reset counter at window boundary,
// not on a fixed schedule, to prevent burst attacks at window edges
if (now - windowStart > WINDOW_SIZE_MS) {
  counter = 0;
  windowStart = now;
}
```

### When NOT to comment

- Do not comment self-explanatory code
- Do not leave TODO comments for things you should just do now
- Do not leave commented-out code — delete it, git has history

### Document known gotchas inline

```typescript
/**
 * IMPORTANT: Must be called before the first render.
 * If called after hydration, causes a flash of unstyled content
 * because the theme context is not available during SSR.
 *
 * See ADR-<N> for the full design rationale.
 */
export function initializeTheme(theme: Theme): void {
  // ...
}
```

## API Documentation Standards

### TypeScript/JSDoc (preferred for typed codebases)

Every public function must document: parameters, return type, thrown exceptions, and at least one usage example.

```typescript
/**
 * Creates a new task.
 *
 * @param input - Task creation data (title required, description optional)
 * @returns The created task with server-generated ID and timestamps
 * @throws {ValidationError} If title is empty or exceeds 200 characters
 * @throws {AuthenticationError} If the user is not authenticated
 *
 * @example
 * const task = await createTask({ title: 'Buy groceries' });
 * console.log(task.id); // "task_abc123"
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  // ...
}
```

### OpenAPI / Swagger (for REST APIs)

Document every endpoint with: summary, request body schema, response schemas for success and error cases.

```yaml
paths:
  /api/tasks:
    post:
      summary: Create a task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTaskInput'
      responses:
        '201':
          description: Task created
        '422':
          description: Validation error
```

## README Structure

Every project must have a README covering:

1. One-paragraph description of what the project does
2. Quick start (clone → install → configure → run)
3. Command reference table
4. Architecture overview with links to ADRs
5. Contributing guidelines

## Documentation for AI Agents

These surfaces help agents follow project conventions and avoid known traps:

- **CLAUDE.md / rules files** — document project conventions so agents follow them
- **Spec files** — keep specs current so agents build the right thing
- **ADRs** — prevent agents from re-deciding past decisions
- **Inline gotchas** — stop agents from falling into known traps

## Common Rationalizations

| Rationalization | Reality |
|----------------|---------|
| "The code is self-documenting" | Code shows *what*. It does not show *why*, what alternatives were rejected, or what constraints apply. |
| "We'll document later when the API stabilises" | APIs stabilise faster when documented. The doc is the first test of the design. |
| "Nobody reads docs" | Agents do. Future engineers do. Your three-months-later self does. |
| "ADRs are overhead" | A 10-minute ADR prevents a 2-hour debate about the same decision six months later. |
| "Comments get outdated" | Comments on *why* are stable. Comments on *what* get outdated — that is why you only write the former. |

## Red Flags

- Architectural decisions with no written rationale
- Public APIs with no documentation or types
- README that does not explain how to run the project
- Commented-out code instead of deletion
- TODO comments that have been there for weeks
- No ADRs in a project with significant architectural choices
- Documentation that restates the code instead of explaining intent
- An ADR that exists only in a chat transcript and has not been committed to `docs/decisions/`

## Verification Checklist

```
- [ ] ADR file exists in docs/decisions/ with all required sections populated
      run: git ls-files docs/decisions/ADR-*.md   # lists committed ADRs; empty output means none exist
- [ ] ADRs exist for all significant architectural decisions
- [ ] README covers quick start, commands, and architecture overview
- [ ] Public API functions have parameter, return type, and exception documentation
- [ ] Known gotchas are documented inline where they matter
- [ ] No commented-out code remains
- [ ] Rules files (CLAUDE.md, etc.) are current and accurate
- [ ] No ADR has been edited or deleted — superseded only
```
