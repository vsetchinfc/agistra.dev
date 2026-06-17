# builder memory

## HOT

- **vladsetchin.me rebuild (2026-06-16)** — 4 PRs raised against `vladsetchin.me-astro` (develop branch):
  - PR #18 `feat/issue-9-astro-foundation` — Astro scaffold, design tokens, theme toggle, CI deploy — state: ready-for-review
  - PR #19 `feat/issue-10-11-home-blog` — home one-pager + blog with RSS — state: ready-for-review (merge conflicts resolved on develop)
  - PR #20 `feat/issue-12-13-14-comments-portfolio-services` — Giscus + portfolio + services — state: ready-for-review
  - PR #22 `feat/issue-15-seo` — SEO meta/OG/sitemap/robots/404/JSON-LD — state: ready-for-review
  - Task #8 / issue #16 — newsletter — blocked (owner provider decision)
  - Repo: `vsetchinfc/vladsetchin.me` | local: `d:\dev\vladsetchin.me`

- task_42 setchin-agent-profiles — Daemon trace log per-day rotating files — issue #84 — branch `feat/issue-84-daemon-trace-log` — PR #86 — state: ready-for-qa (retest) — verifier: Tester — missing test file added commit b3cdea4 pushed 2026-06-13
- task_41 setchin-agent-profiles — scan-dbg + scan-anl quality pass — issue #76 — branch `feat/issue-76-scan-dbg-scan-anl-quality-pass-clean` — PR #79 — state: ready-for-review — verifier: Architect

## WARM

- Issue #84 — Daemon trace log per-day rotating files (task_42) — PR #2 raised 2026-06-13, state:ready-for-qa
- Issue #76 — scan-dbg + scan-anl quality pass (task_41) — PR #79 raised 2026-06-12, state:ready-for-review
- Issue #72 — RBR protocol to agent-foundations (task_37) — PR #77 raised 2026-06-12, state:ready-for-review
- Issue #70 — Claude Code auto-dispatch adapter (task_36) — PR #71, state:qa-passed

## COLD

- agistra.dev uses ESM modules (type: "module") with Node 22 built-in test runner (node:test)
- wizard.js pattern: all I/O injectable via fsMod/execFn parameters for unit testability without real FS
- Telegram block in workspace.config.json: top-level `telegram` key with `enabled`, `bot_token`, `relay_group_id`
- Router outbound is state-machine driven; free-form Telegram sends are refused by design
- Inbound jobs persist at `<hub>/relay/inbox/<uuid>.json`; empty `relay.allowedSenders` allows all group senders
- Inbound salutation: `agents.router.displayName` or `Router`; outbound auto-prefixes `remoteTeam.agentName`
- GitHub path: `relay.primaryRuntime === 'github'` posts inbox jobs to `relay.github.trackingIssue`
- Copilot MCP vs GitHub Action: prefer `relay_send` MCP once wired (task_35); keep `relay:notify` Action template as optional fallback — see `docs/relay-github-runbook.md`
- Relay daemon runs from profiles repo: `npm run relay -- --hub <hub>` — `cli/relay/` not yet copied to hub on deploy (task_35)

- agistra.dev uses ESM modules (type: "module") with Node 22 built-in test runner (node:test)
- wizard.js pattern: all I/O injectable via fsMod/execFn parameters for unit testability without real FS
- Telegram block in workspace.config.json: top-level `telegram` key with `enabled`, `bot_token`, `relay_group_id`
- Router outbound is state-machine driven; free-form Telegram sends are refused by design
- Inbound jobs persist at `<hub
         ->/relay/inbox/<uuid>.json`; emp
         -ty `relay.allowedSenders` allow
         -s all group senders
      18 -- Inbound salutation: `agents.r
         -outer.displayName` or `Router`;
         - outbound auto-prefixes `remote
         -Team.agentName`
      19 -- GitHub path: `relay.primaryRu
         -ntime === 'github'` posts inbox
         - jobs to `relay.github.tracking
         -Issue`
      20 -- Copilot MCP vs GitHub Action:
         - prefer `relay_send` MCP once w
         -ired (task_35); keep `relay:not
         -ify` Action template as optiona
         -l fallback — see `docs/relay-gi
         -thub-runbook.md`
      21 -- Relay daemon runs from profil
         -es repo: `npm run relay -- --hu
         -b <hub>` — `cli/relay/` not yet
         - copied to hub on deploy (task_
         -35)