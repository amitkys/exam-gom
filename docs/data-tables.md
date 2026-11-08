# Data tables

Read this guide before building or changing a data table, its columns, filters,
pagination, selection, or row actions. It adapts the route-local table architecture
used in `mm` to this project. For primitives and styling, follow
[shadcn-ui.md](shadcn-ui.md); for reads, mutations, and cache behavior, follow
[data-fetching.md](data-fetching.md).

## File ownership

Keep each table with its route. Create supporting files only as needed:

```text
app/<route>/
├── page.tsx
├── column.tsx
├── data-table.tsx
├── data-table-feature.tsx
├── _components/
│   ├── <feature>-table-view.tsx
│   ├── add-<feature>-sheet.tsx
│   └── <feature>-row-actions.tsx
├── lib/action.ts
└── query/
    ├── get.ts
    ├── create.ts
    ├── update.ts
    └── delete.ts
```

- `page.tsx` owns route composition. The client table view owns query hooks,
  loading/error states, the header, add action, and table data.
- `column.tsx` owns column definitions and delegates interactive cells to small
  route-local components. Keep the Actions column last.
- `data-table.tsx` owns table rendering and table interaction state. Keep database
  access and mutation orchestration outside the rendering wrapper.
- Promote a wrapper to shared `components/` only when multiple real consumers
  need the same contract. Keep feature-specific filters and labels route-local.

## TanStack Table and shadcn composition

TanStack Table and the shadcn Table primitive are not installed merely by adopting
these rules. Inspect `package.json` and `components/ui/` before implementation.
Use `bun add @tanstack/react-table` and the shadcn CLI when the first feature needs
them. Check the installed package's types/documentation before choosing an API.

The source project uses TanStack Table v9:

- Register required features with `tableFeatures({...})` in
  `data-table-feature.tsx`; export `type DataTableFeatures = typeof features`.
- Define columns with `createColumnHelper<DataTableFeatures, Entity>()` and
  `columnHelper.columns([...])`. Use accessor columns for data and display columns
  for actions. Derive `Entity` from the read hook's data contract in `query/get.ts`
  instead of duplicating the server result shape.
- Type wrapper props using `TData extends RowData` and
  `ColumnDef<DataTableFeatures, TData>[]`; initialize with
  `useTable({ features, data, columns })`.
- Render header groups and visible row cells through `table.FlexRender`, skipping
  placeholder headers. Use stable header, row, and cell IDs as React keys.
- Register sorting, filtering, selection, visibility, and pagination features and
  row models only when the UI uses them. Provide controls for enabled interactions.

These names describe v9. If the target installs v8, use its matching
`useReactTable`, `flexRender`, and row-model APIs throughout; keep one consistent
version rather than combining examples from both.

Compose the installed shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`,
`TableHead`, and `TableCell` components. Use a rounded border container and allow
horizontal scrolling on narrow screens. Retain semantic table markup and associate
the table with a visible heading or caption.

## View states and controls

- Put the title/description on the left and the add action on the right; let the
  header wrap or stack on small screens.
- Handle initial loading and query failure before passing `data ?? []` to the
  table. Use the project's shared loading UI and an accessible error message.
- Render a feature-specific empty row spanning all visible columns. Distinguish
  an empty dataset from filters with no matches; offer a filter reset when useful.
- Use labeled shadcn controls for filters. Keep filter values and table state in
  sync, and provide reset and accurate result counts when filtering is supported.
- Format dates, numbers, and missing values consistently. Use `Badge` for status
  values. Preserve full values through accessible details when truncating cells.
- Use typed accessors or typed feature-specific wrappers for specialized filters;
  preserve row types instead of casting generic data to `any[]`.
- When selection is enabled, supply `getRowId` from the entity's stable ID. Expose
  selection through labeled checkboxes, and sorting through keyboard-accessible
  buttons with the current sort direction communicated accessibly.
- Choose client or server pagination deliberately. Server pagination keeps page,
  page size, sorting, and filters in query keys and preserves server totals.
  Reset or clamp the current page after filters or deletions change available rows.

## Add, edit, and delete

- Use route-local shadcn Sheets for compact add/edit workflows. Follow
  [react-hook-form.md](react-hook-form.md) for form ownership, schemas, fields, and
  validation. Existing full-page forms can retain their Card composition.
- Use `side={isMobile ? "bottom" : "right"}` for Sheets, with a mobile breakpoint
  of 640px. Inspect an existing mobile hook or add one when needed; ensure the
  content scrolls and the footer remains reachable on small screens.
- Include `SheetTitle` and a useful `SheetDescription`. Follow Base UI trigger
  composition and let the primitive manage focus and dismissal.
- Row action components receive a typed entity. Give icon-only actions accessible
  names; disable the relevant action while its mutation is pending.
- On confirmed mutation success, invalidate the affected query keys. Reset/close
  forms only after success; keep errors visible and inputs recoverable on failure.
  Apply the result-envelope and invalidation rules in `data-fetching.md`.

## Verification

Check populated, loading, error, empty, and filtered-empty states; narrow-screen
scrolling; keyboard access; and successful/failed mutations with cache refresh.
Exercise sorting, pagination, selection, and visibility only when implemented.
Use focused checks appropriate to the change.
