[← README](../../README.md) · [Architect](../ARCHITECT.md) · [Builder](../BUILDER.md) · [Tester](../TESTER.md) · [Router](../ROUTER.md)

---

# proactive-agent

Context-survival protocols and relentless resourcefulness. Always-on across all agents — not mode-gated.

---

## What it covers

Three interlocking protocols that keep agents functional as context grows, sessions compact, and tasks hit unexpected blockers.

---

## Working Buffer Protocol

When context reaches 60%, the agent starts logging every exchange to `memory/working-buffer.md`:

- Your messages — verbatim
- Agent responses — 1–2 sentence summaries with key details

On session restart or after compaction, the buffer is read first. The agent recovers context without asking "where were we?"

---

## Compaction Recovery

Auto-triggered when:

- Session starts with a compaction summary
- You say "where were we?", "continue", or "what were we doing?"

Recovery steps:

1. Read `memory/working-buffer.md` — raw session exchanges
2. Read `SESSION-STATE.md` — active task state
3. Extract and present: *"Recovered from working buffer. Last task was X. Continue?"*

The agent does not ask what you were discussing — the buffer has the conversation.

---

## Relentless Resourcefulness

If something doesn't work, try a different approach immediately. Then another. Try 5–10 methods before surfacing a blocker:

- Alternative CLI syntax or a different tool
- Search memory — "Have I solved this before? How?"
- API directly instead of through a wrapper
- Spawn a subagent for the stuck step
- Check logs for prior successes with similar tasks

"Can't" means all reasonable options are exhausted — not "first try failed." You should never have to say "try harder."

---

## Verify-before-reporting

Confirm observable evidence before declaring work done. No "should be working" — verify the actual state and report what you observe.

---

**Carried by:** [Architect](../ARCHITECT.md) · [Builder](../BUILDER.md) · [Tester](../TESTER.md) · [Router](../ROUTER.md)
