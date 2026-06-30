---
name: scan-tst
description: "Use when: analysing a project's test health — coverage, robustness, and CI integration."
argument-hint: "Project directory or specific module to assess"
---

# Test Perspective (TST)

Evaluates whether the project has a functioning, proportionate test suite. Assigns a score from 0.0 to 1.0 across two dimensions.

## Dimensions

**Coverage ratio** — Are enough source files tested?
- Score = min((testFileCount / sourceFileCount) * 2, 1.0) — 50%+ coverage = full score
- 0 test files = 0.0 immediately (no further analysis needed)

**Test script** — Can the suite be run?
- package.json must define scripts.test
- Missing test script = 0.0 on this axis regardless of file count

## Scoring

```
tst_score = (coverage_ratio + test_script) / 2
```

Edge case: if no test files exist at all, score is 0.0 and only one critical task is generated.

**When test suite execution fails:** If the test suite cannot be executed (missing dependencies, syntax errors, unavailable runtime), record this as a data gap rather than failure; note it in output and do not penalize the coverage score until the execution blocker is resolved.

Score interpretation:
- 0.9–1.0  Test suite is healthy and runnable
- 0.7–0.9  Good coverage but minor gaps
- 0.5–0.7  Coverage is below target — significant untested surface
- 0.0–0.5  Test suite is absent or severely inadequate — highest risk area

## Tasks Generated

| Finding | Priority |
|---|---|
| No test files at all | critical |
| Test file ratio < 50% | high |
| No scripts.test in package.json | high |

## Agent Analysis Guide

When performing a manual TST analysis:

1. Count source files (excluding test files) and test files separately
2. Calculate the ratio and identify which source modules have zero test coverage
3. Run the test suite if possible — note any failing tests, not just missing ones
4. Check test speed: tests that take >30 seconds block CI feedback loops
5. Look for edge cases that are clearly missing: empty inputs, null values, concurrent access, error paths
6. Identify tests that only assert the happy path — these create false confidence
7. Flag any test that mocks the database or external service when an integration test is possible

Output: ratio score, list of untested modules ordered by risk, and specific edge cases missing from existing tests.
