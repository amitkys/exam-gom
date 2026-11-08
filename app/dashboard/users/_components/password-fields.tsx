"use client";

import { useId } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ResetAccountPasswordInput } from "../lib/zod-type/manage-account";

export function PasswordFields({ form, disabled }: { form: UseFormReturn<ResetAccountPasswordInput>; disabled: boolean }) {
  const id = useId();
  return <fieldset disabled={disabled} className="grid gap-6" aria-label="New password">
    {(["password", "confirmPassword"] as const).map((name) => <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid || undefined}>
        <FieldLabel htmlFor={`${id}-${name}`} requiredLable>{name === "password" ? "New password" : "Confirm password"}</FieldLabel>
        <FieldContent>
          <Input {...field} id={`${id}-${name}`} type="password" autoComplete="new-password" maxLength={128}
            aria-required="true" aria-invalid={fieldState.invalid} aria-describedby={fieldState.error ? `${id}-${name}-error` : undefined} />
          <FieldError id={`${id}-${name}-error`} errors={[fieldState.error]} />
        </FieldContent>
      </Field>
    )} />)}
  </fieldset>;
}
