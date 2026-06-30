---
name: scan-sys
description: "Use when: analysing a project's architecture, structure, and infrastructure health from the System perspective."
argument-hint: "Project directory, module, or area to assess"
---

# System Perspective (SYS)

Evaluates the structural and architectural health of a codebase. Assigns a score from 0.0 to 1.0 across three dimensions.

## Dimensions

**Complexity** — Are individual files understandable?
- Files exceeding 300 lines are a signal of creeping complexity
- Each oversized file reduces the score proportionally

**Cohesion** — Are responsibilities well-grouped?
- Directories with more than 20 source files have too many concerns
- Each overloaded directory reduces the score proportionally

**Infrastructure** — Is the project properly configured?
- TypeScript: If no .ts files are present, marked N/A; otherwise tsconfig.json present = 1.0, missing = 0.0
- CI/CD health is assessed by scan-anl; see that skill for pipeline evaluation

## Scoring

```
sys_score = (complexity + cohesion + infrastructure) / 3
```

Score interpretation:
- 0.9–1.0  Architecture is clean, well-structured, and properly configured
- 0.7–0.9  Minor structural issues — manageable with targeted refactors
- 0.5–0.7  Significant coupling or cohesion problems — plan a structural pass
- 0.0–0.5  Architecture debt is blocking productivity — prioritise before new features

## Tasks Generated

| Finding | Priority |
|---|---|
| Source files > 300 lines (>3 files) | high |
| Source files > 300 lines (≤3 files) | medium |
| Directories > 20 source files | medium |
| tsconfig.json missing (TS project) | high |

## Agent Analysis Guide

When performing a manual SYS analysis:

1. Count source files per directory — flag any over 20
2. Measure file lengths — flag anything over 300 lines and note the dominant concern
3. Check for tsconfig.json **only if .ts files are present**; verify `strict: true` is set; mark TypeScript N/A if no .ts files found
4. Look for circular imports or cross-layer dependencies (service importing from controller, etc.)
5. Identify God objects — single classes or modules that do too many things

Output: a ranked list of structural issues, each with the file or directory, the dimension it violates, and a recommended remediation.
