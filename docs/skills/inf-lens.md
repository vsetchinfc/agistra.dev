[← README](../../README.md) · [Builder](../BUILDER.md)

---

# inf-lens

Infrastructure readiness gate for migration, environment variable, and edge function tickets. Activated automatically when a ticket makes a change that must be applied to the running environment — not just to source files on disk. Infrastructure gaps are the most common reason Tester returns BLOCKED rather than PASS or FAIL.

---

## When it activates

Any ticket that:

- Adds or modifies a Supabase migration
- Adds or changes an environment variable consumed by the app
- Deploys or updates a Supabase edge function
- Changes Supabase storage bucket policies, RLS policies, or auth provider settings
- Changes runtime configuration that takes effect on deploy (CORS rules, webhook endpoints, redirect URLs)

---

## The infrastructure checklist

**Migrations**

| Check | What to verify |
| --- | --- |
| Applied to QA environment | Migration pushed to the target Supabase project — not only run locally |
| Correct project linked | Confirmed via `supabase status` or dashboard |
| No dependency gap | All dependencies of this migration are already applied |
| Rollback path | If the migration drops a column or deletes data, a revert migration exists or the impact is documented |

**Environment variables**

| Check | What to verify |
| --- | --- |
| Set in target environment | Variable configured in Supabase secrets or Vercel settings — not only in local `.env.local` |
| Exact name match | Variable name matches exactly what the code reads |
| Not committed to source | Secret value is not in any committed file |
| App can read it | App has been restarted or redeployed so the running process has the value |

**Edge functions**

| Check | What to verify |
| --- | --- |
| Deployed | `supabase functions deploy` run against the target project after the latest code change |
| Reachable | Smoke request returns an expected status — not 404 (not deployed) or 500 (broken) |
| Secrets available | All secrets the function reads are set in Supabase secrets for the target project |

---

## Pre-handoff gate

Before moving to `state:ready-for-qa`, post this confirmation on the GitHub issue:

```
INF verified:
- Migration [name]:        applied to [project/environment] ✓
- Env var [NAME]:          set in [target] ✓
- Edge function [name]:    deployed, smoke test ✓
- Platform settings:       [what was changed and confirmed] ✓
```

List only lines that apply — but list at least one. An empty INF confirmation means the gate was declared active but never checked. Tester will return BLOCKED.

---

**Carried by:** [Builder](../BUILDER.md)
