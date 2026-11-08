# shadcn UI conventions

Read this guide before adding, composing, styling, or updating UI components.
These rules carry over the shared-primitive approach used in `mm`, while keeping
this project's configured design system. `components.json`, installed component
source, and `app/globals.css` are the sources of truth for aliases, primitive base,
icons, theme, and available props.

## Inspect and install

1. Inspect the existing UI components and nearby feature usage first. Reuse
   primitives from the configured UI alias and keep business logic route-local.
2. Use `bunx --bun shadcn@latest info --json` when resolving project configuration.
   Before using an unfamiliar component, run
   `bunx --bun shadcn@latest docs <component>` and read the returned documentation.
3. Install missing official primitives with
   `bunx --bun shadcn@latest add <component>`. Generate their source through the
   CLI, then make intentional local customizations; preserve existing changes.
4. For existing components, preview upstream changes with `add <component>
   --dry-run` and `add <component> --diff <file>` before merging. Overwriting local
   source requires explicit user authorization.
5. Use an explicitly selected registry for third-party components or blocks.
   Review generated imports, icons, dependencies, and composition before use.

Adopting this guide does not install components or dependencies. Inspect what is
present before importing anything. Keep the target's preset and icon library;
transferring conventions is not a preset migration.

## Composition and accessibility

- Use shadcn components before creating custom styled replacements: Button for
  actions, Badge for status, Alert for callouts, Empty for empty panels, Separator
  for dividers, and Skeleton for loading placeholders. A table's empty state can
  remain a semantic table row as described in [data-tables.md](data-tables.md).
- Compose Cards with their Header, Title, Description, Content, and Footer as
  applicable. Use accessible headings within the page hierarchy.
- Match the installed primitive base. This project's Base UI components use
  `render` for custom triggers, for example
  `<SheetTrigger render={<Button />}>Add record</SheetTrigger>` after Sheet is
  installed. Verify exported props rather than borrowing Radix `asChild` examples.
- Provide a Title for every Dialog, Sheet, or Drawer, using `sr-only` when a
  visible title is unnecessary. Supply descriptions where they clarify the action.
- Keep items in their matching groups: SelectItem in SelectGroup,
  DropdownMenuItem in DropdownMenuGroup, and CommandItem in CommandGroup.
- Keep TabsTrigger inside TabsList and give Avatar an AvatarFallback.
- Preserve primitive focus handling, keyboard behavior, and overlay stacking.
  Give icon-only controls accessible names and associate labels with inputs.
- Use the configured icon library (currently Tabler) for new UI. Decorative icons
  are `aria-hidden`; icons in Buttons use `data-icon="inline-start"` or
  `data-icon="inline-end"`. Let the component's CSS determine their size.

## Styling

- Prefer built-in `variant` and `size` props. Use `className` for layout and
  intentional feature-specific adjustments while preserving component styles.
- Use semantic tokens such as `bg-background`, `bg-card`, `text-foreground`,
  `text-muted-foreground`, `border-border`, and `text-destructive`. Define shared
  theme changes in the configured global CSS file so light/dark modes agree.
- Use flex/grid `gap-*` for spacing, `size-*` for equal dimensions, and `truncate`
  for single-line ellipsis. Use the project's existing `cn` helper/import for
  conditional classes; inspect local source to choose the correct import.
- Keep shared component variants in the component or its variant definition.
  Avoid scattering repeated color, typography, or shape overrides across callers.
- Build responsive layouts that stack/wrap controls and retain readable labels,
  reachable actions, and visible focus indicators on narrow screens.

## Forms, tables, and feedback

- Follow [react-hook-form.md](react-hook-form.md) for form state, Zod schemas,
  Controller integration, Field composition, errors, and required labels.
  Use FieldGroup for simple vertical field stacks; retain the existing guide's
  responsive grids when arranging related field groups.
- Use installed shadcn Input/NativeSelect/Select controls instead of copying
  styled native controls from older feature files. For input addons, use
  InputGroup with InputGroupInput/InputGroupTextarea and InputGroupAddon.
- Follow [data-tables.md](data-tables.md) for table ownership, columns, view states,
  responsive sheets, and row actions.
- Reuse `LoadingSwap` from `@/components/ui/loading-swap` for pending buttons,
  together with `disabled` on Button. Expose pending state through accessible text
  or `aria-busy` on the relevant region. A Button does not gain `isLoading` or
  `isPending` props merely because a mutation is pending.
- For section loading, reuse or extend shared loading UI when needed. The source
  project's custom `Spinner` and its size variants are not installed here; verify
  local exports before adopting examples that use them.
- Keep failure and success messages accessible and near their context. Reuse an
  established toast system if present; inspect/install the appropriate component
  before introducing toast calls. Keep recoverable form errors visible in the form.

## Verification

Review new UI at narrow and desktop widths, with keyboard navigation and visible
focus. Check the affected disabled, pending, invalid, empty, and error states.
After CLI additions, inspect the generated files for correct aliases, icons,
subcomponent composition, and preservation of local customizations.
