# Server Actions, TanStack Query, and feature architecture

Use these conventions when implementing route-level server actions and TanStack
Query integration. This document defines conventions, not an installed integration.
Examples use an illustrative `platformTable` and auth/validation helpers; adapt
them to the actual feature and auth library. Do not add dependencies or example
platform tables merely to match this document.

## Architecture

Application reads and writes use route-owned Next.js Server Actions in
`lib/action.ts`. Client query and mutation hooks call those actions directly.
Actions authenticate, authorize, validate, and access the database on the server.
Use this flow for interactive client features:

```text
UI → TanStack Query hook → Server Action → Drizzle/database
```

Do not add `query/api.ts`, Axios clients, REST endpoints, bearer-token storage,
or a separate backend API layer for these operations. Server Components may use
the server-only data-access layer directly, following the repository's security
rules.

## Feature structure

```text
app/<feature>/
├── page.tsx                         # Renders the feature view
├── column.tsx                       # Table columns, when needed
├── data-table.tsx                   # Table UI, pagination, and sorting
├── data-table-feature.tsx           # Feature registration, if the table setup needs it
├── _components/
│   ├── <feature>-table-view.tsx     # Query hook, header, and table
│   ├── add-<feature>-sheet.tsx
│   ├── edit-<feature>-sheet.tsx
│   ├── <feature>-row-actions.tsx
│   └── <feature>-form-fields.tsx
├── lib/
│   ├── action.ts                   # All actions owned by this route
│   └── zod-type/
│       └── <feature>.ts            # Schemas and inferred form/input types
└── query/
    ├── get.ts                      # Options factory, read hook, inferred item type
    ├── create.ts                   # Create mutation hook
    ├── update.ts                   # Update mutation hook
    └── delete.ts                   # Delete mutation hook
```

Create files only when the feature needs them. Follow the installed table
library's API for columns and feature registration. Table features are not a
prerequisite for routes without tables. For form owners and field-group layout,
follow [react-hook-form.md](react-hook-form.md).

## File ownership and naming

- Keep one `lib/action.ts` per route; do not split a route's actions across files.
- Each file in `query/` maps 1:1 to one action in that route's `lib/action.ts`.
  A read file contains its options factory and hook; a write file contains its
  mutation hook. Create files only for operations the route needs.
- Use verb filenames (`get.ts`, `create.ts`, `update.ts`, `delete.ts`). When a
  route has multiple reads or writes of the same kind, use descriptive filenames
  such as `get-platform.ts` and `get-members.ts` to preserve the 1:1 mapping.

| Layer | File | Name |
| --- | --- | --- |
| Server action | `lib/action.ts` | `getPlatformAction` |
| Read options factory | `query/get.ts` | `getPlatformQuery` |
| Read hook | `query/get.ts` | `useGetPlatformQuery` |
| Inferred item type | `query/get.ts` | `PlatformItem` |
| Write hook | `query/create.ts` | `useCreatePlatformMutation` |
| Write hook | `query/update.ts` | `useUpdatePlatformMutation` |
| Write hook | `query/delete.ts` | `useDeletePlatformMutation` |
| Zod schema | `lib/zod-type/platform.ts` | `createPlatformSchema` |
| Inferred input type | `lib/zod-type/platform.ts` | `CreatePlatformInput` |

Use `<verb><Entity>Action`, `<verb><Entity>Query`, and
`use<Verb><Entity>Query` or `use<Verb><Entity>Mutation`. Only functions that call
`useQuery` or `useMutation` receive the `use` prefix in these layers. Keep names
distinct across layers.

## Inferred types

Derive types from the contract that owns them instead of maintaining duplicate
record or input interfaces:

- Database rows: use `typeof table.$inferSelect` in server code when the full row
  is needed. Use type-only imports for type references. Client-facing results
  should follow the action's safe projection, which may expose fewer fields.
- Forms and action payloads: infer from the feature's Zod schema. Define update
  schemas explicitly for writable fields and required identifiers; infer their
  types rather than assuming `Partial<CreateInput>` enforces update rules.
- Action results: let TypeScript infer the return value from selected Drizzle
  fields and literal success discriminants.
- Table rows and UI items: export types inferred from the actual read hook in
  `query/get.ts`, keeping columns aligned with what the client receives.

```ts
// lib/zod-type/platform.ts
import { z } from "zod";

export const createPlatformSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required" }),
});

export const updatePlatformSchema = createPlatformSchema.extend({
  id: z.string().trim().min(1, { error: "Platform ID is required" }),
});

export type CreatePlatformInput = z.infer<typeof createPlatformSchema>;
export type UpdatePlatformInput = z.infer<typeof updatePlatformSchema>;
```

Use Zod v4 error options and reuse client-safe enum definitions as described in
the form guidance. If schema input and output differ, distinguish them with
`z.input` and `z.output`; runtime-parse action inputs regardless of static typing.

## Action response contract

Use inferred discriminated results rather than a manually annotated generic
`ApiResponse<T>` or `ActionResponse<T>`:

- Reads and mutations succeed with `{ success: true, data }`.
- Failures return `{ success: false, message }` with a user-safe message.
- Paginated reads use `{ success: true, data: { items, pagination } }`, where
  pagination contains `total`, `page`, `limit`, and `totalPages`.
- Create/update results contain the safe fields needed by the client. A delete
  may return `data: { id }` after confirming that the authorized row was deleted.

Keep pagination inside `data` so read hooks can unwrap it without losing metadata.
Validate filters and sort fields, bound page sizes, and paginate large reads on
the server. For a table, pass `res.data.items` and `res.data.pagination` to the
appropriate UI rather than discarding pagination in the hook. Success feedback
belongs to the UI; successful actions do not include a message.

## Server actions

- Start `lib/action.ts` with `"use server"`; export async actions only. Put
  shared validators and other non-action helpers in separate supporting modules.
- Wrap every action body in `try/catch`, including authentication, validation,
  authorization, and database work.
- Infer the return type from the implementation and Drizzle results. Do not
  annotate action return types with `Promise<ActionResponse<T>>` or equivalent.
- Return only `{ success: true, data }` on success, with no success message.
  Return only `{ success: false, message }` on failure, using a user-safe message.
- Preserve literal boolean discriminants with `true as const` and `false as const`
  so callers can narrow the inferred result with `if (!res.success)`.
- In each catch block, use `console.error("<actionName> error", error)` with the
  action's own name. Configure server error redaction before handling sensitive
  data: database errors may include query parameters. Never return raw errors,
  credentials, tokens, or sensitive database fields to the client.
- Authenticate and check current account status and resource permissions on the
  server. Obtain ownership IDs from the verified session, not client input.
- Runtime-validate inputs and allowlist writable fields. A TypeScript type such
  as `$inferInsert` or `Partial<$inferInsert>` does not validate a request or
  prevent clients from supplying protected fields.
- Scope reads, updates, and deletes to authorized resources in the query itself.
  Treat a missing update/delete result as failure, not successful `undefined`.

These examples assume `getActiveSession()` checks account and session validity.
Its implementation belongs to the eventual auth module. The update schema above
validates the identifier and writable name; adapt identifier validation to the
feature's actual ID format.

```ts
// app/home/lib/action.ts — illustrative imports depend on the feature implementation.
"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { platformTable } from "@/db/schema/platform";
import { getActiveSession } from "@/lib/auth";
import { updatePlatformSchema, type UpdatePlatformInput } from "./zod-type/platform";

export async function getPlatformAction() {
  try {
    const session = await getActiveSession();
    if (!session) {
      return { success: false as const, message: "User not authenticated" };
    }

    const platform = await db
      .select({ id: platformTable.id, name: platformTable.name })
      .from(platformTable)
      .where(eq(platformTable.userId, session.user.id));

    return { success: true as const, data: platform };
  } catch (error) {
    console.error("getPlatformAction error", error);
    return { success: false as const, message: "Failed to fetch platform" };
  }
}

export async function updatePlatformAction(input: UpdatePlatformInput) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return { success: false as const, message: "User not authenticated" };
    }

    const parsed = updatePlatformSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, message: "Invalid platform details" };
    }

    const [platform] = await db
      .update(platformTable)
      .set({ name: parsed.data.name })
      .where(and(
        eq(platformTable.id, parsed.data.id),
        eq(platformTable.userId, session.user.id),
      ))
      .returning({ id: platformTable.id, name: platformTable.name });

    if (!platform) {
      return { success: false as const, message: "Platform not found or unavailable" };
    }

    return { success: true as const, data: platform };
  } catch (error) {
    console.error("updatePlatformAction error", error);
    return { success: false as const, message: "Failed to update platform" };
  }
}
```

Create actions follow the same envelope and validation pattern, assigning `userId`
from the session after allowlisting input. Delete actions use the update example's
ownership predicate and missing-result check. Return only fields needed by the UI.

## Read hooks

Use `queryOptions` in the options factory. The `queryFn` unwraps the action result
and throws on failure so TanStack Query supplies `isError` and `error`.

```ts
// app/home/query/get.ts
"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { getPlatformAction } from "@/app/home/lib/action";

export function getPlatformQuery(userId: string) {
  return queryOptions({
    queryKey: ["get-platform", userId],
    queryFn: async () => {
      const res = await getPlatformAction();
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });
}

export function useGetPlatformQuery(userId: string) {
  return useQuery(getPlatformQuery(userId));
}

// This example's read returns an array of safely selected rows.
export type PlatformItem = NonNullable<ReturnType<typeof useGetPlatformQuery>["data"]>[number];
```

For paginated reads returning `{ items, pagination }`, infer the row type with
`NonNullable<ReturnType<typeof useGetPlatformsQuery>["data"]>["items"][number]`.
Column definitions and table components import this item type with `import type`.

Mount authenticated hooks only after session resolution. Include the user/tenant,
resource IDs, filters, and pagination values in keys when they distinguish cached
results. Cache keys do not authorize access; the server independently checks it.
Clear private cached data on logout or account/tenant changes. Give each server
request its own QueryClient when prefetching; do not share private caches across
requests. This client module is not a server-prefetch import; if prefetching is
needed, separate the hook boundary from server-compatible options deliberately.

## Mutation hooks

Return the action envelope directly from `mutationFn`; do not throw for
`success: false`. Check `res.success` inside `onSuccess` before invalidating queries,
showing success feedback, or navigating. Await invalidation when completion should
wait for refreshed data.

```ts
// app/home/query/update.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlatformAction } from "@/app/home/lib/action";
import { getPlatformQuery } from "./get";

export function useUpdatePlatformMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof updatePlatformAction>[0]) =>
      updatePlatformAction(input),
    onSuccess: async (res) => {
      if (!res.success) return;
      await queryClient.invalidateQueries({
        queryKey: getPlatformQuery(userId).queryKey,
      });
    },
  });
}
```

Create/delete hooks use the same pattern with `useCreatePlatformMutation` and
`useDeletePlatformMutation` and the corresponding action. TanStack supplies one
variables value to `mutationFn`; use an object for multiple inputs. If an existing
action takes positional arguments, unpack the variables object in a wrapper rather
than passing that action directly as `mutationFn`.

An application failure envelope still counts as a resolved mutation: `isSuccess`
alone does not indicate business success. Inspect `res.success` for feedback.
Transport/framework failures can still reject; handle those through `onError` or
shared mutation error handling. Callers of `mutateAsync` must handle rejection.

## Completion checklist

- Application reads/writes use Server Actions; client hooks call them directly.
- Feature folders contain only the UI, schemas, and operation files they need.
- One route action file; one matching query file per integrated action.
- Distinct action/factory/hook names with the required suffixes.
- Inputs derive from Zod; UI items derive from hooks; database fields stay server-side.
- Inferred, discriminated response envelopes; `try/catch` and action-specific error logs.
- Server authentication, authorization, input validation, and safe output selection.
- Reads throw on failure; mutations retain the response envelope.
- Paginated reads retain metadata and enforce server-side bounds.
- Mutation success handling checks `res.success`; cache keys and invalidation match.
- Verify success, failure, unauthorized access, and cache refresh behavior as relevant.

## API references

- [TanStack mutation variables and callbacks](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [TanStack useQuery and queryOptions](https://tanstack.com/query/latest/docs/framework/react/reference/functions/useQuery)
- For Next.js server action and security behavior, read the installed guides in
  `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` and
  `node_modules/next/dist/docs/01-app/02-guides/data-security.md`.
