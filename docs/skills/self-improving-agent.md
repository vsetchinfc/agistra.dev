[← README](../../README.md) · [Architect](../ARCHITECT.md) · [Builder](../BUILDER.md) · [Tester](../TESTER.md) · [Router](../ROUTER.md)

---

# self-improving-agent

Captures corrections, errors, and knowledge gaps during sessions. Logs them to `.learnings/` and promotes durable patterns to project memory over time — so the same mistake doesn't happen twice across sessions.

---

## When it logs

| Trigger | Log target |
| --- | --- |
| You correct the agent ("No, that's wrong", "Actually...") | `.learnings/LEARNINGS.md` — category: `correction` |
| A command or operation fails unexpectedly | `.learnings/ERRORS.md` |
| The agent's knowledge proves outdated or incorrect | `.learnings/LEARNINGS.md` — category: `knowledge_gap` |
| A better approach is discovered for a recurring task | `.learnings/LEARNINGS.md` — category: `best_practice` |
| You request a capability that doesn't exist | `.learnings/FEATURE_REQUESTS.md` |

Agents also review `.learnings/` before starting a major task or entering an unfamiliar codebase area.

---

## What gets captured

Each entry records: what happened, what was wrong, what the correct approach is, priority, and related files. Error entries add the actual error message, context, and a suggested fix. No secrets, tokens, or raw sensitive output — redacted summaries only.

---

## Promotion to project memory

When a pattern recurs 3+ times across at least 2 distinct tasks within 30 days, it gets promoted from `.learnings/` to the appropriate permanent store:

| Destination | What goes there |
| --- | --- |
| `memory/repo/<project>.md` | Project-specific facts, conventions, verified practices |
| `AGENTS.md` in the workspace | Workflow improvements, automation rules |
| Cross-project memory | Patterns that apply across multiple projects |

After promotion the entry is marked `Status: promoted` in the log.

---

## Periodic review

Agents check `.learnings/` at natural breakpoints — before major tasks, after completing a feature, or after a recurring error surfaces — to surface patterns before they compound.

---

**Carried by:** [Architect](../ARCHITECT.md) · [Builder](../BUILDER.md) · [Tester](../TESTER.md) · [Router](../ROUTER.md)
