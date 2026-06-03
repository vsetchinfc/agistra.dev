---
name: scan-anl
description: "Use when: analysing a project's delivery health — CI/CD, commit patterns, and working tree state."
argument-hint: "Project directory or recent git history to assess"
---

# Analytics Perspective (ANL)

Evaluates the delivery and process health of a project by analysing CI/CD automation, commit patterns, and working tree state. Assigns a score from 0.0 to 1.0 across three dimensions.

## Dimensions

**CI/CD** — Is there automated validation?
- .github/workflows/ directory present = 1.0
- Missing = 0.0

**Commit quality** — Does the commit history signal healthy development?
- Examines the last 20 commits
- If >50% of commits are bug fixes, the score is reduced: 1 - fix_rate
- A high fix rate signals weak test coverage, recurring design debt, or a broken development cycle

**Working tree** — Is the branch clean?
- No uncommitted changes = 1.0
- Any uncommitted changes = 0.5 (work in flight, not an error, but a signal)

## Scoring

```
anl_score = (ci + commit_quality + clean) / 3
```

Score interpretation:
- 0.9–1.0  Delivery pipeline is healthy and automated
- 0.7–0.9  Good CI/CD with some process noise
- 0.5–0.7  Missing automation or high fix-to-feature ratio
- 0.0–0.5  No CI/CD and commit history shows a reactive, fire-fighting pattern

## Tasks Generated

| Finding | Priority |
|---|---|
| No CI/CD pipeline | medium |
| Fix rate > 50% in last 20 commits | medium |
| Uncommitted changes in working tree | medium |

## Agent Analysis Guide

When performing a manual ANL analysis:

1. Check .github/workflows/ — verify at least one workflow runs tests on push/PR
2. Run `git log -20 --oneline` — classify each commit as feat, fix, chore, refactor, docs
3. Calculate fix rate — if >50%, identify which modules are generating the most fixes
4. Run `git status` — note any uncommitted changes and their age (stash date)
5. Check if the CI workflow is actually passing — a green badge on a broken workflow is misleading
6. Look for patterns: are fixes always in the same module? That module likely needs a design review
7. Check commit message quality — vague messages ("fix stuff", "WIP", "update") obscure intent

Output: a delivery health assessment with the fix rate, top problem modules, and specific automation gaps.
