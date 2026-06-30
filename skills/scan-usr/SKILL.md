---
name: scan-usr
description: "Use when: analysing a project's user-facing health — discoverability, documentation, and product clarity."
argument-hint: "Project directory or product area to assess"
---

# User Perspective (USR)

Evaluates how well the project communicates its purpose and value to users, contributors, and integrators. Assigns a score from 0.0 to 1.0 across three dimensions.

## Dimensions

**README quality** — Can someone discover and use this project?
- Missing README = 0.0
- Score = min(readmeLength / 2000, 1.0) — 2000+ chars = full score
- A thin README (<500 chars) generates a high-priority task

**Description** — Is the package self-describing?
- If no package.json exists, marked N/A (not applicable to non-npm projects)
- If package.json exists: non-empty description field = 1.0, missing or empty = 0.0

**Changelog** — Is the release history communicated?
- CHANGELOG.md or CHANGELOG present = 1.0
- Missing = 0.5 (partial credit — not critical)

## Scoring

```
usr_score = (readme + description + changelog) / 3
```

Score interpretation:
- 0.9–1.0  Well-documented and discoverable
- 0.7–0.9  Good documentation with minor gaps
- 0.5–0.7  Documentation is present but thin — a new user would struggle
- 0.0–0.5  Project is effectively undiscoverable — documentation is a blocker

## Tasks Generated

| Finding | Priority |
|---|---|
| No README.md | critical |
| README < 500 chars | high |
| No package.json description (when package.json exists) | medium |

## Agent Analysis Guide

When performing a manual USR analysis:

1. Read the README as if you are a new user — can you answer: what is this, how do I install it, how do I use it?
2. Check for usage examples with real commands or code snippets (not just API reference)
3. If package.json exists: verify the description field accurately describes what the package does in one line; if no package.json, mark this dimension N/A
4. Check if there is a CHANGELOG and whether it lists breaking changes for major versions
5. Look for a CONTRIBUTING.md — if contributors cannot find setup instructions they cannot help
6. Assess any public API surface: are types and parameters documented?
7. Identify anything a user would need to know that is not in the docs

Output: gaps in user-facing documentation ranked by impact on onboarding friction, with specific sections or files that need to be written or expanded.
