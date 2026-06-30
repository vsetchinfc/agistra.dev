---
name: scan-anl
description: "Use when: analysing a project's delivery health — CI/CD, commit patterns, and working tree state."
argument-hint: "Project directory or recent git history to assess"
---

# Analytics Perspective (ANL)

Evaluates the delivery and process health of a project by analysing CI/CD automation, commit patterns, and working tree state. Assigns a score from 0.0 to 1.0 across five dimensions.

## Dimensions

**CI/CD** — Is there automated validation, and is it meaningful?
- 1.0: pipeline present AND includes a test-run step AND is passing
- 0.5: pipeline present but no test step, or pipeline is failing
- 0.0: no pipeline at all
- To check CI status: `gh run list --limit 1 --json conclusion --jq '.[0].conclusion'`
- If `gh` is unavailable, mark as 'unknown' and score 0.5

**Commit quality** — Does the commit history signal healthy development?
- Examines the last 20 commits
- If >50% of commits are bug fixes, the score is reduced: 1 - fix_rate
- A high fix rate signals weak test coverage, recurring design debt, or a broken development cycle

**Working tree** — Is the branch clean?
- No uncommitted changes = 1.0
- Any uncommitted changes = 0.5 (work in flight, not an error, but a signal)

**Commit message quality** — Are commit messages informative?
- Examine last 20 commits: what fraction have vague messages ("fix", "WIP", "update", "changes")?
- Score: 1.0 if <10% vague, 0.5 if 10–40% vague, 0.0 if >40% vague
- Finding priority: low

**Test automation** — Are tests integrated into the delivery pipeline?
- Score: 1.0 if CI runs tests, 0.5 if tests exist but not in CI, 0.0 if no tests
- Finding priority: medium

## Scoring

```
anl_score = (ci_score + commit_quality + clean + msg_quality + test_automation) / 5
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
| CI pipeline present but missing test step | medium |
| Fix rate > 50% in last 20 commits | medium |
| Uncommitted changes in working tree | medium |
| >40% vague commit messages in last 20 commits | low |
| Tests exist but not run in CI | medium |
| No test suite found | medium |

## Agent Analysis Guide

When performing a manual ANL analysis:

1. Check .github/workflows/ — verify at least one workflow runs tests on push/PR; check whether the pipeline is currently passing. Use `gh run list --limit 1 --json conclusion --jq '.[0].conclusion'` for automated status check. If gh is unavailable, mark as 'unknown' and score 0.5.
2. Run `git log -20 --oneline` — classify each commit: first check for conventional-commit prefixes (fix:, bugfix:, hotfix: for fixes; feat: for features; chore:, refactor:, docs: for other categories); if no prefix is present, apply keyword fallback (look for fix, feature, add, remove, update, refactor in message); as last resort, use subjective inference from the message content.
3. Calculate fix rate — if >50%, identify which modules are generating the most fixes
4. Run `git status` — note any uncommitted changes and their age (stash date)
5. Assess commit message quality — count messages that are vague ("fix", "WIP", "update", "changes", "stuff"); score as 1.0/<10%, 0.5/10–40%, 0.0/>40%
6. Check test automation — does the project have a test script in package.json / Makefile / equivalent, and does the CI workflow invoke it?
7. Look for patterns: are fixes always in the same module? That module likely needs a design review

Output: a delivery health assessment with the fix rate, commit message quality ratio, test automation status, and specific automation gaps.
