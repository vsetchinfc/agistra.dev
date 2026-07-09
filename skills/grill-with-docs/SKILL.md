---
name: grill-with-docs
description: "One-question-at-a-time design interrogation. Use when: 'grill me', 'interrogate this', 'one question at a time', 'brainstorm', 'let's brainstorm', 'let's discuss', or design review start. Produces ADRs and glossary as decisions settle. Do not use for settled designs — load architecture-mode instead."
argument-hint: "Design question, plan, topic, or decision under interrogation"
---

# grill-with-docs

> Adapted from https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs (MIT License). Vendored as a core workspace skill.

A relentless, docs-aware interview that sharpens a plan or design one question at a time — and writes durable documentation (ADRs, glossary) as the answers settle.

## When to load

- **Architect:** load before any design interrogation, brainstorm session, scoping session, or ADR work where the design is not yet settled
- **Publishing Lead (future):** load before any topic approval, editorial review, or release gating decision

## Protocol

1. **One question at a time.** Never ask multiple questions in a single turn. Identify the most important open question, ask it, and wait for the answer before moving on.
2. **Evidence first.** When an answer is ambiguous or abstract, ask for a concrete example before accepting it.
3. **Name load-bearing assumptions.** When an answer closes a design option, state the assumption explicitly before moving to the next question.
4. **Write as you go.** After each settled decision, immediately update the WAL — write the decision to the HOT section of `memory/<agent>.md` — then draft the corresponding ADR entry or glossary term inline. Do not batch documentation for after the session. Do not advance to the next question before the WAL/memory entry is written.
5. **Close with docs (VBR required).** When the session concludes:
   - Produce one ADR per settled decision, a glossary of key terms introduced, and any scope exclusions made explicit.
   - **Verify Before Reporting:** confirm each ADR file exists under `docs/decisions/` with the decision and rationale documented before declaring the session closed.

## Session flow

```
Start   → State the design question, plan, or topic under interrogation (one sentence)
Grill   → One question → answer → assumption check → WAL update → document → next question
Close   → ADR per decision + glossary + explicit exclusions
```

## Do not

- Ask compound questions ("and also, what about…")
- Accept vague answers without requesting a concrete example
- Advance to the next question before the current answer is settled and documented
- Advance to the next question before the WAL/memory entry is written (do not outrun the WAL)
- Defer documentation to after the session ends
