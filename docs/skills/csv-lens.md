[← README](../../README.md) · [Builder](../BUILDER.md)

---

# csv-lens

Client-service contract gate for Supabase RPC and edge function tickets. Activated automatically when a ticket changes a database function, edge function, or the TypeScript client layer. Contract breaks at the SQL/TypeScript boundary are the most common source of bugs that pass unit tests but fail in Tester's end-to-end verification.

---

## When it activates

Any ticket that changes:

- A Supabase SQL function in a migration (`CREATE OR REPLACE FUNCTION`)
- A Supabase edge function
- A TypeScript client wrapper (`src/lib/`)
- A data-fetching hook that calls `supabase.rpc()` or an edge function
- A type definition that represents a Supabase response shape

---

## The contract checklist

Both sides must be verified — confirming one side only is not sufficient.

**SQL side**

| Check | What to verify |
| --- | --- |
| Parameter names and types | Match exactly what the TypeScript caller passes |
| Return shape | SQL `RETURNS` type matches the TypeScript type that consumes the result |
| Error contract | SQL raises exceptions on known failure conditions — not returning `null` silently |
| Nullable fields | SQL columns that can be `NULL` map to optional fields in the TypeScript type |
| RLS | Row-level security still permits the calling role's operations after the change |

**TypeScript caller side**

| Check | What to verify |
| --- | --- |
| No `any` shortcuts | RPC response is typed with a concrete type, not widened to `any` |
| Error path handled | The `.error` branch is surfaced to the UI, thrown, or logged — not swallowed |
| Caller is reachable | The updated function is actually called from the correct component or hook |
| Types compile | All consumers compile without `@ts-ignore` or `as any` suppressions |

---

## Pre-handoff gate

Before moving to `state:ready-for-qa`, post this confirmation on the GitHub issue:

```
CSV verified:
- Contract surface: [supabase.rpc('name') | supabase/functions/name | src/lib/file.ts:fn]
- SQL side:         [parameter shape ✓ | return shape ✓ | error contract ✓ | n/a]
- TypeScript side:  [typed correctly ✓ | error handled ✓ | caller reachable ✓ | types compile ✓]
```

---

**Carried by:** [Builder](../BUILDER.md)
