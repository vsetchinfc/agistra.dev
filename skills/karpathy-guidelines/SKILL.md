---
name: karpathy-guidelines
description: "Behavioral guardrails for implementation work. Reduces common LLM coding mistakes: overcomplication, silent assumption-picking, scope drift, and unverifiable success criteria. Load on Builder and software-engineer-mode."
argument-hint: "Writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria"
license: MIT
---

# Karpathy Guidelines

Behavioral guardrails to reduce common LLM coding mistakes, adapted from Andrej Karpathy's observations on LLM coding pitfalls.

Original source: [karpathy-guidelines](https://github.com/multica-ai/andrej-karpathy-skills/blob/main/skills/karpathy-guidelines/SKILL.md) — MIT License — Andrej Karpathy.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask the team lead.

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what the ticket asks for.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it to the team lead — don't delete it.

When your changes create orphans:

- Remove imports, variables, or functions that **your** changes made unused.
- Don't remove pre-existing dead code unless the ticket asks for it.

The test: every changed line should trace directly to the ticket's acceptance criteria.

---

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals before starting:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let the agent loop independently. Weak criteria ("make it work") require constant clarification and stall delivery.
