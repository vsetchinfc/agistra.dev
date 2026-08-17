---
name: migration-completeness-check
description: "Use when the team lead points Architect at a prior agistra.dev hub path and asks it to check for or perform additional migration — trigger phrasing such as 'migrate my data from <path>', 'check what didn't get migrated', 'did we miss anything from my old hub', or 'do a completeness pass on <path>'. Walks the prior hub's full directory tree read-only, diffs it against the fixed scripted migration scope plus any existing migration report, and asks the team lead one clear question at a time about anything a scripted migration would never have discovered. Never writes or copies anything itself — every confirmed item is delegated to the existing migration primitives. Do not use for the first-run scripted migration prompt during `npm run setup` — that is unrelated, already-automated flow this skill does not replace."
argument-hint: "Path to a prior agistra.dev hub, plus a migration-completeness or 'check what's missing' request"
---

# Migration Completeness Check

This skill is the executable protocol for an internal architecture decision establishing a
repeat-safe, agent-assisted migration completeness pass. Read that decision record for full context
and rationale.

**Owner:** Architect. This is a standalone, repeatably-invocable skill — deliberately **not** wired
into Bootstrap Self-Check (`agent-foundations`), which fires exactly once per workspace by design.
A customer may point this skill at the same or a different prior hub weeks after initial setup;
the underlying migration primitives are explicitly safe to call more than once against
the same target (existing collision + backup policy is the only safety mechanism required — no new
"already migrated" stamp exists or is needed).

## What this skill is for

Scripted migration (`migrateFromSourceHub()` / `migrateFromSourceHubIntoVault()`) has a
fixed, narrow scope — `memory/`, `projects/`, `docs/decisions/`, `.env` — because that is the state a
script can reliably know about in advance. It has no discovery step. This skill adds the discovery
step: a read-only walk of the prior hub, a diff against what the deterministic mechanism already
covers, and a conversation with the team lead about anything left over. **This skill performs
discovery, classification, and conversation only.** It never contains its own copy, backup, or
vault-write logic — every confirmed write is delegated to the exact functions the migration
primitives already shipped. This is the same duplication risk once found and fixed between
`vault-guard.cjs`/`test-policy.cjs` (`agent-foundations`' duplicate-content VBR rule) — this skill does
not repeat it.

## Preconditions

- The team lead has direct filesystem access to the prior hub's full directory tree (same assumption
  the scripted flow already makes).
- `isValidHubPath(priorHubPath)` (`pipelines/deploy/lib/migrate-prior-hub.js`) returns true for the
  path given — it must contain both `.claude/agents/` and `memory/`. If it does not, stop and tell the
  team lead the path does not look like an agistra.dev hub; do not guess or proceed.

## Protocol

### Step 1 — Read-only discovery walk

Walk the prior hub's full directory tree, reasonable exclusions applied. **Reuse the existing
exclusion list — do not invent a new one.** `migrate-prior-hub.js`'s own `collectFiles()` walker
carries no exclusion list of its own (it is only ever called against one already-known state
directory at a time, never a whole-hub root, so it had no need for one). The one directory-exclusion
list that already exists anywhere in this pipeline for "skip these directories during a tree walk"
is `IGNORE` in `pipelines/deploy/lib/scan-utils.js`:

```js
export const IGNORE = new Set(['node_modules', '.git', 'dist', 'out', 'build', 'coverage', '.vscode-test']);
```

Import and reuse this set directly (`import { IGNORE } from '../../pipelines/deploy/lib/scan-utils.js'`
when scripting the walk, or apply the same literal names when walking via `Bash`/`Glob` tool calls).
Do not hand-roll a second exclusion list.

List the prior hub's top-level entries (files and directories), skipping anything in `IGNORE`. For
each top-level directory not skipped, note whether it needs to be inspected further (see Step 3).

### Step 2 — Cross-reference against known scope and any existing report

Two independent things are already "known," and neither should be re-asked about:

1. **The fixed scripted migration scope**: `memory/`, `projects/`, `docs/decisions/`, `.env`. Any
   top-level entry matching these exactly is owned by the deterministic mechanism — skip it here,
   never duplicate what it already covers.
2. **The target hub's existing migration report**, if one exists — `projects/_migration-report.md`
   (repo-files target) or the most recent `Docs/reports/migration-report-*.md` note (vault target).
   Read it (a plain file read — this is not migration mechanics) and note every path already listed
   under its `## Copied Files` section. Anything already copied by an earlier scripted or
   agent-assisted run is already covered — this is what keeps repeated invocations of this skill
   idempotent in practice, on top of the underlying collision/backup policy that makes
   it safe even if something is re-offered.

### Step 3 — Classify every remaining top-level entry

For everything not already covered by Step 2, classify before asking anything:

- **Deploy-baseline scaffold** — standard files/directories every deployed hub ships regardless of
  customer content, because the deploy pipeline/`npm run setup` regenerates them fresh in every hub:
  `.claude/`, `.cursor/`, `.github/`, `.codex/`, `skills/`, `pipelines/`, `packages/`, `agents/`,
  `docs/` (except `docs/decisions/`, which is already in-scope per Step 2), `node_modules/`, `.git/`,
  `package.json`, `package-lock.json`, `workspace.config.json`, `README.md`, `AGENTS.md`, `CLAUDE.md`,
  `agent.manifest.json`, `.mcp.json`, `.gitignore`, `VERSION`, `LICENSE`. Skip these by default — they
  are not customer state a migration is meant to carry across, and re-asking about them on every hub
  would make the skill noisy to the point of being ignored. **This bucket is a Builder-added
  interpretation, not something the underlying decision record states explicitly** — it exists so the
  candidate list stays signal, not scaffold noise. If a deploy-baseline entry's content looks
  meaningfully different from what the target hub already ships under the same name (a real
  divergence, not just a version bump), still surface it as a candidate rather than silently skipping.
- **Candidate** — everything else. Group by top-level directory (a "sensible group") —
  e.g. a `notes/` directory with 12 files inside is one candidate, not 12. A loose top-level file not
  inside any directory is its own candidate.

### Step 4 — Ask about each candidate, one at a time

For each candidate, in order:

1. Ask exactly one question: whether to migrate it, and — if the destination location is ambiguous —
   where. Never combine two candidates into one question. This reuses `grill-with-docs`'s
   one-question-at-a-time discipline even though this skill is not a design interrogation.
2. Wait for the answer before moving to the next candidate.
3. Record the answer (migrate / skip, plus destination if given) before asking about the next one.

Do not batch "here are 5 things I found, which do you want?" into a single message — that is a
compound question and defeats the point of this step.

### Step 5 — Delegate every confirmed write to the existing primitives

**This skill never copies, backs up, or writes a file itself.** For each candidate the team lead
confirmed, delegate to the primitive that matches the target hub's storage shape:

- **Repo-files target (`dev`, `dev:graph`)** — call `migrateFromSourceHub(sourceHub, targetHub,
  targetTier, stateDirs, opts)` from `pipelines/deploy/lib/migrate-prior-hub.js`, where `stateDirs` is
  the list of confirmed candidate top-level directory names for this batch (e.g. `['notes']`) — the
  same generic `stateDirs` parameter the scripted flow already uses for `['memory', 'projects']`, just
  pointed at the newly-confirmed directories instead. `targetTier` is the target hub's own tier, read
  via `readWorkspaceConfig(targetHub).hubType` (`pipelines/deploy/lib/bootstrap.js`, a plain read, not
  new migration logic). Example invocation, run from the target hub's own checkout:

  ```js
  import { migrateFromSourceHub } from './pipelines/deploy/lib/migrate-prior-hub.js';

  const result = await migrateFromSourceHub(
    sourceHub, targetHub, targetTier, ['notes'],
    { askYN, warn: (msg) => process.stdout.write(msg), confirmOverwrite },
  );
  ```

- **Vault target (`dev:sub`, `ops`)** — **known limitation, confirmed by reading the code, not
  assumed:** `migrateFromSourceHubIntoVault()` / `migrateIntoVault()`
  (`pipelines/deploy/lib/migrate-into-vault.js`) have no `stateDirs`-equivalent parameter — their
  Folder Mapping (`memory` → `Memory`, `projects` → `Tasks`, `docs/decisions` → `Docs/decisions`) is a
  fixed internal constant, unlike `migratePriorHubState()`'s generic `stateDirs` array. There is
  currently no existing primitive this skill can delegate an out-of-scope candidate to for a vault
  target without adding new copy/write logic — which is explicitly out of scope for both this skill
  and the migration primitives themselves. When a vault-target candidate is confirmed, **do not invent a
  write path.** Tell the team lead directly: this candidate is confirmed but cannot be migrated
  through the existing vault primitives yet, and flag it as a gap worth its own follow-up ticket
  (extending `migrateIntoVault()` with an optional extra-`stateDirs`-like parameter, mirroring
  `migratePriorHubState()`'s existing shape). Do not silently drop the confirmation or fabricate a
  copy step.

Never call `collectFiles()`, `backupBeforeOverwrite()`, `isTemplateMemoryFile()`, or `isInsideVault()`
directly from this skill's own logic to perform a write — those are the primitives'
internals, reached only through `migrateFromSourceHub()` / `migratePriorHubState()` (repo-files) or
`migrateFromSourceHubIntoVault()` (vault, scope-limited per the limitation above).

### Step 6 — Append to the existing migration report

Reuse the exact report format the migration report generator already defines — do not invent a
second report shape.

1. Build a markdown block for this run's confirmed-and-migrated result using the already-exported
   `buildMigrationReportContent()` (`pipelines/deploy/lib/migration-report.js`), passing this skill's
   own `result` (the return value of Step 5's `migrateFromSourceHub()` call), the same `sourceHub`/
   `targetHub`/`sourceTier`/`targetTier`/`targetShape` values, and `backups` computed via the
   already-exported `backupsPaths()`.
2. Relabel that block's leading `## Migration Report` heading to `## Agent-Assisted Additions` (a
   plain string substitution on the already-generated markdown — not new report-building logic).
3. If a report already exists at the target path (`projects/_migration-report.md` for repo-files,
   or the most recent `Docs/reports/migration-report-*.md` note for vault), read its existing content
   and append the relabeled block underneath, then write the combined content back to that same path.
   If no report exists yet, call `generateMigrationReport()` directly instead — it both creates the
   base report and returns the path; the "Agent-Assisted Additions" framing only applies once a base
   report already exists to append to.

## Verify before reporting

Do not tell the team lead a candidate was "migrated" until:

- `migrateFromSourceHub()`'s returned `result.copied` actually lists the file(s) for that candidate
  (not just that the call didn't throw), and
- the report file on disk actually contains the new "Agent-Assisted Additions" section (open and
  confirm, do not assume the write succeeded because the function returned).

## What this skill does not do

- It does not copy, back up, or write vault content itself — every write goes through
  `migrateFromSourceHub()` / `migrateFromSourceHubIntoVault()`, exactly as the underlying decision
  record mandates.
- It does not add a `workspace.config.json` migration-history/stamp field (deliberately deferred).
- It does not wire itself into Bootstrap Self-Check (explicitly rejected — see that
  skill's fires-once-per-workspace contract).
- It does not change `detectSourceTier()`, `assertSourceTierAllowed()`, `migratePriorHubState()`,
  `migrateIntoVault()`, `mergeEnvFiles()`, or `generateMigrationReport()` themselves — they
  ship exactly as already merged.
