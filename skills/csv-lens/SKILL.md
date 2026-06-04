---
name: csv-lens
description: "Activate for any ticket that touches a Supabase RPC, edge function, or TypeScript client function in src/lib/. Ensures both caller and callee are verified before state:ready-for-qa."
argument-hint: "RPC name, edge function name, client function, or contract surface"
---

# CSV — Client-Service Contract Lens

Activate this lens when a ticket changes a Supabase database function (RPC), edge function, or the TypeScript client layer. Contract breaks at the boundary between SQL and TypeScript are the most common source of bugs that pass unit tests but fail in Tester's end-to-end verification.

## When to Activate

Load this lens when the ticket changes any of the following:

- A Supabase SQL function in a migration (`CREATE OR REPLACE FUNCTION`)
- A Supabase edge function (`supabase/functions/`)
- A TypeScript client wrapper (`src/lib/supabase.ts`, `src/lib/adminApi.ts`, `src/lib/stripe.ts`, or any `src/lib/*.ts`)
- A data-fetching hook that calls `supabase.rpc()` or a Supabase edge function directly
- A type definition that represents a Supabase response shape (`src/types/database.ts` or equivalent)

## The Contract Checklist

For each changed contract surface, verify both sides before claiming done. Cross-layer claims require cross-layer proof — confirming one side only is not sufficient.

### SQL side

| Check | What to verify |
| ----- | -------------- |
| **Parameter names and types** | SQL function parameter names and types match exactly what the TypeScript caller passes to `supabase.rpc()` or the edge function fetch |
| **Return shape** | SQL `RETURNS` type, `RETURNS TABLE` columns, or JSON response shape matches the TypeScript type that consumes the result |
| **Error contract** | SQL raises an exception (`RAISE EXCEPTION`) on known failure conditions in a way TypeScript can classify — not returning `null` silently |
| **Nullable fields** | SQL columns that can be `NULL` correspond to optional (`?`) fields in the TypeScript type — no silent `null` becoming `undefined` mismatch |
| **RLS** | Row-level security policies on affected tables still permit the calling role's operations after the change |

### TypeScript caller side

| Check | What to verify |
| ----- | -------------- |
| **No `any` shortcuts** | The RPC response or edge function response is typed with a concrete type, not widened to `any` or `unknown` without explicit narrowing at the callsite |
| **Error path handled** | The `.error` branch from `supabase.rpc()` or the edge function fetch is handled — surfaced to the UI, thrown, or logged — not silently swallowed |
| **Caller is reachable** | The updated client function is actually called from the correct component or hook; no dead code path where the old contract remains in use |
| **Types compile** | If a shared type in `src/types/` was updated, all consumers compile without `@ts-ignore` or `as any` suppressions |
| **Auth header** | If the edge function requires the user's JWT, the caller passes `Authorization: Bearer <token>` correctly |

## Naming the Contract Surface

Before implementation, name the specific contract surface this ticket touches:

```
Contract surface: [supabase.rpc('function_name') | supabase/functions/name | src/lib/file.ts:functionName]
Direction of change: [SQL only | TypeScript only | both sides]
```

A ticket that only touches the TypeScript side (no SQL change) still needs the TypeScript checklist — it may introduce a type mismatch against an unchanged SQL contract.

## Pre-Handoff Gate

Before moving the ticket to `state:ready-for-qa`, post the following confirmation on the GitHub issue:

```
CSV verified:
- Contract surface: [name]
- SQL side:         [parameter shape ✓ | return shape ✓ | error contract ✓ | n/a]
- TypeScript side:  [typed correctly ✓ | error handled ✓ | caller reachable ✓ | types compile ✓]
```

If the ticket only touches one side, note which side was verified and why the other is unaffected. Tester will attempt to exercise the contract end-to-end; a contract that looks correct in isolation can still fail when both sides interact.
