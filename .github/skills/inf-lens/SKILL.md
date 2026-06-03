---
name: inf-lens
description: "Activate for any ticket that adds or changes a Supabase migration, environment variable, edge function deployment, or runtime configuration. Ensures infrastructure is live in the target QA environment before state:ready-for-qa."
argument-hint: "Migration name, env var name, edge function name, or deployment surface"
---

# INF — Infrastructure Readiness Lens

Activate this lens when a ticket makes a change that must be applied to the running environment — not just to source files on disk. Infrastructure gaps are the most common reason Tester returns BLOCKED rather than PASS or FAIL. BLOCKED means testing cannot start at all, which wastes the full QA cycle.

## When to Activate

Load this lens when the ticket:

- Adds or modifies a Supabase migration (`supabase/migrations/`)
- Adds or changes an environment variable consumed by the app (`.env.local`, Supabase project secrets, Vercel environment settings)
- Deploys or updates a Supabase edge function (`supabase/functions/`)
- Changes a Supabase storage bucket policy, RLS policy, or auth provider setting
- Changes runtime configuration that takes effect on deploy (CORS rules, webhook endpoints, redirect URLs)

## The Infrastructure Checklist

Verify each applicable surface before claiming `state:ready-for-qa`. Tick off only what the ticket actually touches.

### Migrations

| Check | What to verify |
| ----- | -------------- |
| **Applied to QA environment** | Migration has been pushed to the target Supabase project, not only run locally via `supabase db push --local` |
| **Correct project linked** | `supabase status` or the Supabase dashboard confirms the correct project is the target — not a stale local or dev link |
| **No dependency gap** | The migration's dependencies (functions, tables, or types it references) were applied in earlier migrations that are already present |
| **Rollback path documented** | If the migration drops a column, renames a table, or deletes data, a revert migration exists or the impact is explicitly documented on the ticket |

### Environment variables

| Check | What to verify |
| ----- | -------------- |
| **Set in target environment** | The variable is configured in Supabase project secrets (`supabase secrets set`) or Vercel environment settings for the QA deployment — not only in the local `.env.local` |
| **Exact name match** | Variable name matches exactly what the code reads: `process.env.NEXT_PUBLIC_X`, `process.env.X`, or `Deno.env.get('X')` — no case or prefix mismatch |
| **Not committed to source** | The secret value is not in any committed file, `.env.local` included in git, or source comment |
| **App can read it** | If the variable is new, the app has been restarted or redeployed so the running process has the value available |

### Edge functions

| Check | What to verify |
| ----- | -------------- |
| **Deployed** | `supabase functions deploy <name> --project-ref <ref>` has been run against the target project after the latest code change |
| **Reachable** | A smoke request to the function endpoint (`/functions/v1/<name>`) returns an expected status — not 404 (not deployed) or 500 (deployed but broken) |
| **Secrets available** | Any secrets the function reads via `Deno.env.get()` are set in Supabase secrets for the target project, not just locally |

### Auth and platform settings

| Check | What to verify |
| ----- | -------------- |
| **Redirect URLs** | Any new OAuth or email redirect URLs are added to the allowed list in Supabase Auth settings for the target project |
| **CORS** | If a new edge function or API endpoint is called from the browser, the origin is in the allowed CORS list |

## Naming the Infrastructure Surface

Before implementation, name each surface this ticket requires:

```
Infrastructure surfaces:
- Migration:    [filename or 'none']
- Env vars:     [VAR_NAME list or 'none']
- Edge function: [function name or 'none']
- Platform settings: [what or 'none']
```

## Pre-Handoff Gate

Before moving the ticket to `state:ready-for-qa`, post the following confirmation on the GitHub issue:

```
INF verified:
- Migration [name]:        applied to [project/environment] ✓
- Env var [NAME]:          set in [target] ✓
- Edge function [name]:    deployed, smoke test ✓
- Platform settings:       [what was changed and confirmed] ✓
```

Omit lines that do not apply to this ticket, but list at least one line. An empty INF confirmation means the lens was declared active but the gate was never checked — Tester will return BLOCKED.
