# Zustand state management

Use these conventions when implementing shared client state, creating Zustand
stores, or changing selectors, middleware, and persistence. This document defines
patterns, not an installed integration. Add dependencies only when implementing
a feature that needs them.

## State ownership

- Use Zustand for shared client state such as panel visibility, selections,
  client workflow state, and UI preferences.
- Use TanStack Query for server data, fetch loading/error state, mutations, and
  optimistic server updates. Follow [data-fetching.md](data-fetching.md).
- Use React Hook Form for form values, validation, and submission state. Follow
  [react-hook-form.md](react-hook-form.md).
- Keep state used by one component local to that component. Derive values from
  existing state where possible rather than synchronizing duplicate copies.

Keep stores focused on domains, fully typed, and simple. A store must not become
a second cache of server records or an independent source of authentication truth.

## Store organization

- Colocate a feature's store in `app/<route>/store/<domain>.ts`. Move it to shared
  `lib/stores/` only when multiple features actually consume it.
- Group state-changing actions in a stable `actions` object.
- Export typed selector hooks for the state and actions consumers need. Infer
  hook return types from the store instead of duplicating them.
- Use slices when a large store has distinct, cohesive sections. Create slices
  as plain state creators; apply middleware once to the combined store.
- Keep helpers and types beside the store unless other modules consume them.
- Use the feature's barrel export if one already exists; direct imports are
  sufficient otherwise.
- Document non-obvious action behavior, persistence, and reset semantics beside
  the store. Keep the public interface small.

## Typed store and selector hooks

```ts
"use client";

import { create } from "zustand";

interface PanelState {
  isOpen: boolean;
  selectedId: string | null;
  actions: {
    setOpen: (isOpen: boolean) => void;
    select: (id: string | null) => void;
    reset: () => void;
  };
}

const initialState = { isOpen: false, selectedId: null };

const usePanelStore = create<PanelState>()((set) => ({
  ...initialState,
  actions: {
    setOpen: (isOpen) => set({ isOpen }),
    select: (selectedId) => set({ selectedId }),
    reset: () => set(initialState),
  },
}));

export const usePanelOpen = () => usePanelStore((state) => state.isOpen);
export const useSelectedId = () => usePanelStore((state) => state.selectedId);
export const usePanelActions = () => usePanelStore((state) => state.actions);
```

Subscribe to the needed slice rather than calling the store hook without a
selector. Return stable references from selectors. When selecting multiple
values in a newly created object or array, use `useShallow` from
`zustand/react/shallow`, or expose separate selectors. This avoids needless
rerenders and unstable snapshots.

Use functional `set` updates when the next value depends on current state.
Preserve the `actions` object during reset; the example merges initial data
rather than replacing the entire store.

## Middleware

Use middleware for demonstrated needs: `devtools` for inspection, `persist` for
durable UI preferences, and `immer` for complex nested updates. Simple stores
can use the plain pattern above. Install Immer when using its middleware.

When all three apply, use this order: `devtools(persist(immer(...)))`.
Keep devtools outermost and assign descriptive domain-specific names.

```ts
"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface PreferencesState {
  preferences: {
    compact: boolean;
  };
  actions: {
    setCompact: (compact: boolean) => void;
    reset: () => void;
  };
}

const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      immer((set) => ({
        preferences: { compact: false },
        actions: {
          setCompact: (compact) => set((state) => {
            state.preferences.compact = compact;
          }),
          reset: () => set((state) => {
            state.preferences = { compact: false };
          }),
        },
      })),
      {
        name: "exam-gom-ui-preferences",
        partialize: (state) => ({ preferences: state.preferences }),
        skipHydration: true,
      },
    ),
    { name: "ui-preferences", enabled: process.env.NODE_ENV !== "production" },
  ),
);

export const useCompactPreference = () =>
  usePreferencesStore((state) => state.preferences.compact);
export const usePreferencesActions = () =>
  usePreferencesStore((state) => state.actions);

// Call from the owning client provider's mount effect, after hydration.
export const hydratePreferences = () => usePreferencesStore.persist.rehydrate();
```

Mutable-style updates are valid inside Immer producers. Without Immer, return
immutable updates. Keep slices' middleware typing aligned with the composed store;
preserve strict types rather than introducing assertions to bypass errors.

## Persistence and hydration

- Use `partialize` to persist only necessary UI preferences. Keep actions,
  transient loading/error state, open dialogs, and server query results out of
  storage.
- Keep credentials, tokens, session truth, and sensitive personal data out of
  persisted stores and devtools. Server-side authorization remains authoritative.
- Choose a unique storage key per domain. Add a persistence version and migration
  when changing a stored shape. Treat persisted browser data as untrusted;
  validate it before merging and fall back to safe defaults when invalid.
- Make server output and the first client render agree. The example uses
  `skipHydration: true`; an owning client provider calls `hydratePreferences()`
  in a mount effect. Handle rehydration failures and track hydration completion
  when the UI depends on it. Provide defaults or a loading placeholder until then.
- A state reset and clearing persisted storage have different effects. Explicitly
  clear storage when the workflow requires removing saved data, and reset any
  account-specific client state on logout or account/tenant changes.

## Next.js store lifetime

Keep React store hooks in client components. Server Components and Server Actions
must not read or mutate a shared client store. Never put request-specific user
data in a module-level server singleton.

For state initialized from server props or scoped to a mounted route, create a
store instance with `createStore` from `zustand/vanilla` in a client context
provider. Retain that instance for the provider's lifetime and expose typed
selector hooks using `useStore`. Give separate requests and provider instances
separate stores; initialize server and client from the same safe values.

Use the module-level `create` pattern only for client UI state intended to share
the browser session's lifetime. It must not hold per-request server state.

## Async client workflows

Keep server reads and writes in TanStack Query hooks. Zustand async actions are
appropriate for client-only workflows that several components share. Model their
pending, success, and failure state explicitly, preserve useful error context,
and ensure stale completions cannot overwrite newer state or repopulate a reset
store. Use cancellation or operation identifiers when requests can overlap.

Optimistic updates of server records belong in the TanStack Query cache, with
rollback and invalidation. Store only the associated shared UI state in Zustand.

## Completion checklist

- Store ownership and lifetime fit the domain and its consumers.
- State and grouped actions are typed; public selector hooks subscribe narrowly.
- Middleware matches actual needs and uses the documented composition order.
- Persisted state is allowlisted, safe, validated, and hydrated consistently.
- Reset, logout, and account-switch behavior do not retain inappropriate state.
- Validate meaningful transitions, selectors, reset, nested updates, persistence,
  hydration, and async races as applicable. Add focused store tests when their
  complexity or risk warrants them, following the repository's validation rules.
