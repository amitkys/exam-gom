# React Hook Form + Zod + shadcn UI

Use these conventions when building or modifying forms, adding form fields, or
working with form Zod schemas. This document covers UI form composition. For
server actions and query/mutation integration, follow [data-fetching.md](data-fetching.md).

These are conventions, not an installed integration. Examples describe components
and dependencies that may need to be added when implementing a form. Create only
the files and install only the dependencies needed by the feature.

## UI primitives installation and customization

Install official UI components through the CLI rather than writing their files
from scratch. Inspect existing components first and preserve local customizations.

```bash
bunx --bun shadcn@latest add field
```

Add the `requiredLable` prop to the generated `components/ui/field.tsx`.
Keep this spelling as the project convention. Preserve the generated styling;
the following shows the required label customization:

```tsx
function FieldLabel({
  className,
  requiredLable,
  children,
  ...props
}: React.ComponentProps<typeof Label> & {
  requiredLable?: boolean;
}) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-1.5 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:bg-input/30 has-[>[data-slot=field]]:rounded-2xl has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-input/40 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 *:data-[slot=field]:p-4",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {requiredLable && (
        <span aria-hidden="true" className="form-required leading-none">*</span>
      )}
    </Label>
  );
}
```

Add the companion CSS to `app/globals.css`:

```css
/* Align the required asterisk with the label text. */
.form-required {
  @apply text-destructive inline-block translate-y-[2px] transform text-[0.95em];
}
```

`<FieldLabel requiredLable>` appends a red asterisk. Also communicate required
state on the control with `required` or `aria-required` as appropriate; the
asterisk is visual decoration, and Zod owns validation.

## File ownership

Keep form components in the route's `_components/` directory. For a simple route:

```text
app/<route>/
├── _components/
│   ├── main-form.tsx
│   ├── contact-fields.tsx
│   ├── identity-fields.tsx
│   └── <feature>-helpers.ts
└── lib/
    ├── action.ts
    └── zod-type/
        └── <form-name>.ts
```

When a route has multiple forms or modules, group each feature:

```text
app/<route>/
├── _components/
│   ├── <feature_name>/
│   │   ├── main.tsx
│   │   ├── contact-fields.tsx
│   │   ├── identity-fields.tsx
│   │   ├── <feature>-helpers.ts
│   │   ├── <feature>-action-button.tsx
│   │   └── <feature>-preview.tsx
│   └── <another_feature>/
└── lib/
    ├── action.ts
    └── zod-type/
        └── <form-name>.ts
```

Create helpers and sub-components when needed. Route actions use the singular
`lib/action.ts`; query files and hook names follow `data-fetching.md`.

## Zod schemas

- Define the complete schema in the route's `lib/zod-type/<form-name>.ts`.
- Export the schema and its inferred TypeScript type, using names such as
  `addEntitySchema` and `AddEntitySchema`.
- Keep validation rules, required fields, enum values, and transformations in
  the schema. Use Zod v4's `{ error: "..." }` option for custom messages.
- Reuse existing Drizzle enums with `z.enum(myEnum.enumValues)` instead of
  duplicating their values. Import from the client-safe enum module
  `@/db/schema/enums`; keep database clients and privileged code out of the
  form's import graph.

```ts
import { z } from "zod";

export const addEntitySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, { error: "Name is required" }),
  email: z.string().trim().pipe(z.email({ error: "Valid email is required" })),
});

export type AddEntitySchema = z.infer<typeof addEntitySchema>;
```

When transformations make schema input and output types differ, export both
using `z.input` and `z.output`, and use
`useForm<InputValues, unknown, OutputValues>`. Type child form props with the
same generics. Defaults match the input type; submission receives the output type.

## Main form component

The form owner (`main-form.tsx` or `<feature_name>/main.tsx`) initializes the form
and owns submission:

- Start with `"use client"` when using `useForm`, event handlers, or client hooks.
- Initialize `useForm<FormValues>` with `zodResolver(formSchema)` and complete
  `defaultValues` matching the form type.
- Own the top-level `<form>`, `form.handleSubmit`, and submission state.
- Wrap fields in a shadcn `Card`: `CardHeader` and `CardTitle` for the heading,
  `CardContent` for the fields grid, and `CardFooter` for the submit button.
- Use `LoadingSwap` inside the submit `Button` during `isPending`. Inspect the
  project's implementation first; it is a project component, not assumed to be
  an installed shadcn primitive. Add it when the first form needs it.
- Pass the typed form instance to field-group components through a `form` prop.

The following example assumes a route mutation hook implementing
`data-fetching.md`, including failure feedback through `onSuccess`/`onError`.
Using `mutate` here avoids an unhandled `mutateAsync` rejection. If submission
needs to await `mutateAsync`, explicitly handle both rejected promises and
`success: false` results.

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  addEntitySchema, type AddEntitySchema,
} from "../../lib/zod-type/add-entity";
import { useCreateEntityMutation } from "../../query/create";
import { ContactFields } from "./contact-fields";
import { IdentityFields } from "./identity-fields";

export function AddEntityForm({ entityId }: { entityId: string }) {
  const form = useForm<AddEntitySchema>({
    resolver: zodResolver(addEntitySchema),
    defaultValues: { id: entityId, name: "", email: "" },
  });
  const { mutate: addEntity, isPending } = useCreateEntityMutation();

  return (
    <form onSubmit={form.handleSubmit((data) => addEntity(data))}>
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="max-w-none">Section Title</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ContactFields form={form} />
            <IdentityFields form={form} />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button disabled={isPending} type="submit" size="lg" className="px-8 text-base">
            <LoadingSwap isLoading={isPending}>Save Details</LoadingSwap>
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
```

## Child field groups and Controller

- Name child files after logical groups, such as `contact-fields.tsx`,
  `identity-fields.tsx`, or `address-fields.tsx`.
- Receive `form` as `UseFormReturn<FormValues>`.
- Use `Controller` for controlled shadcn inputs, selects, custom controls, and
  file inputs. Connect each to `form.control` with its exact field name.
- Keep field display and interaction logic in the child; initialization stays
  in the form owner. Extract complex previews or upload buttons into siblings.
- Compose fields with `Field`, `FieldLabel`, `FieldContent`, `FieldDescription`,
  and `FieldError`. Render schema errors through `FieldError` rather than
  duplicating validation messages in JSX.
- Associate labels with controls using matching `htmlFor` and `id`. Use IDs
  unique to the form instance, such as IDs derived from React's `useId`.
- Set `aria-invalid={fieldState.invalid}` on controls. Add
  `data-invalid={fieldState.invalid || undefined}` to `Field` when parent-level
  invalid styling is needed, particularly for custom controls and file inputs.
- Connect descriptions and errors with `aria-describedby` and matching IDs.
  Hide `FieldDescription` while an error is shown.

```tsx
import { useId } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import {
  Field, FieldContent, FieldError, FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AddEntitySchema } from "../../lib/zod-type/add-entity";

export function IdentityFields({ form }: { form: UseFormReturn<AddEntitySchema> }) {
  const nameId = useId();

  return (
    <Controller
      control={form.control}
      name="name"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={nameId} requiredLable>Name</FieldLabel>
          <FieldContent>
            <Input
              {...field}
              id={nameId}
              aria-required="true"
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? `${nameId}-error` : undefined}
              placeholder="Enter full name"
            />
            <FieldError id={`${nameId}-error`} errors={[fieldState.error]} />
          </FieldContent>
        </Field>
      )}
    />
  );
}
```

### Selects and custom controls

Use the appropriate shadcn control: `Input`, `Textarea`, `Select`, `NativeSelect`,
`Checkbox`, `RadioGroup`, or a project-specific control. Use `register` only for
simple native inputs where it fits the existing pattern.

For a `NativeSelect` enum field, spread `field` onto the control and render
`NativeSelectOption` entries from a typed options list. Derive option values from
the existing enum; display labels can use a typed mapping. For example, the
existing `accountStatusEnum` values are `active` and `disabled`.

```tsx
<NativeSelect {...field} id={statusId} aria-invalid={fieldState.invalid} className="w-full">
  {statusOptions.map((option) => (
    <NativeSelectOption key={option.value} value={option.value}>
      {option.label}
    </NativeSelectOption>
  ))}
</NativeSelect>
```

Place this control inside the same `Controller`/`Field` composition, including
its associated label and `FieldError`. For other custom controls, adapt
`field.onChange`, `field.onBlur`, `field.value`, `field.name`, and `field.ref` to
the control's API rather than spreading incompatible props.

### File inputs

- Validate the selected file in the field component; keep validation rules in
  the schema or reusable validators rather than duplicating them in JSX.
- Use `form.setError` and `form.clearErrors` for selection/upload failures.
  Update the form value only after the selected or uploaded value is ready.
- Forward the input's name, blur handler, and ref; read selected files through
  the change event. Native file inputs cannot receive a controlled file value.
- Show `FieldDescription` (for example, accepted types and the actual size limit)
  only when `fieldState.error` is absent. Render `FieldError` consistently.
- Keep required, invalid, label, description, and error associations accessible
  using the same composition as other fields.

## Helper extraction

Extract complex file validation, uploads, and constants into a sibling
`<feature>-helpers.ts` in the feature folder. Export focused constants such as
`ACCEPTED_FILE_TYPES` and `MAX_FILE_SIZE`, pure validators such as
`isAcceptedFileType` and `isWithinSizeLimit`, and client-safe async operations
such as an upload client. Keep helper-only types beside their helpers.
Privileged upload implementation belongs in server-only code.

## Completion checks

- Schema and form types agree, including transformed input/output and defaults.
- Field groups receive typed forms; each control is wired to its named field.
- Labels, required state, descriptions, errors, and pending state are accessible.
- Required-field, invalid-input, and submission failure behavior works.
- Generated UI customizations are preserved and server-only imports stay out
  of the client graph. Run repository checks appropriate to the implementation.
