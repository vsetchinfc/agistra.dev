[← README](../../README.md) · [Router](../ROUTER.md)

---

# internal-relay

Inbound message classification vocabulary for Router. Maps trigger signals from inbound messages to workflow states and routing decisions. Works alongside [`telegram-relay`](telegram-relay.md) — this skill defines the states, that skill defines the bridge behavior.

---

## Workflow state mapping

| State | Trigger signals | Route to |
| --- | --- | --- |
| `review_requested` | "ready for review", "PR open", "please review" | Builder |
| `ci_failed` | "CI failed", "test failed", "build failed" | Builder (include CI exception) |
| `qa_requested` | "ready for QA", "needs QA", "retest" | Tester (Pre-QA Readiness Check mode — no live test execution) |
| `blocked` | "blocked", "waiting on", "cannot proceed" | Builder if engineering blocker; HOT memory if decision blocker |
| `vlad_decision_required` | "needs approval", "scope", "price", "timeline", "client promise" | HOT memory — surfaces to you at next standup or dreaming |
| `info_only` | "FYI", "status update", no requested action | Short ack — no agent dispatch |
| `unclear` | Missing issue/PR reference, state, owner, or requested action | Ask one clarifying question — no dispatch until resolved |

---

## Classification rules

- Classify before dispatching — never dispatch without a state
- One state per message — pick the most specific match
- `unclear` always beats guessing — one focused question is better than a wrong dispatch
- End-of-day and start-of-day signals are handled by [`dreaming`](dreaming.md) and [`morning-standup`](morning-standup.md) — they are not inbound relay signals

---

**Carried by:** [Router](../ROUTER.md)
