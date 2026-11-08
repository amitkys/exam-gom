"use client";

import { useId } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { CreateAccountFormValues, CreateAccountInput } from "../lib/zod-type/account";

const labels: Record<CreateAccountInput["role"], string> = {
  exam_controller: "Exam controller", faculty: "Faculty",
  reviewer: "Reviewer", paper_setter: "Paper setter",
};

export function AccountFields({ form, disabled, allowedRoles }: { form: UseFormReturn<CreateAccountFormValues, unknown, CreateAccountInput>; disabled: boolean; allowedRoles: readonly CreateAccountInput["role"][] }) {
  const id = useId();
  return (
    <fieldset disabled={disabled} className="grid gap-6" aria-label="Account details">
      {(["name", "email", "password"] as const).map((name) => (
        <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={`${id}-${name}`} requiredLable>{name === "name" ? "Full name" : name === "email" ? "Email address" : "Initial password"}</FieldLabel>
            <FieldContent>
              <Input {...field} id={`${id}-${name}`} type={name === "password" ? "password" : name === "email" ? "email" : "text"}
                autoComplete={name === "password" ? "new-password" : "off"} aria-required="true"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? `${id}-${name}-error` : name === "password" ? `${id}-password-help` : undefined}
                className="h-11 rounded-lg" />
              {name === "password" && !fieldState.error && <FieldDescription id={`${id}-password-help`}>Use at least 8 characters. Share the initial password privately with the member.</FieldDescription>}
              <FieldError id={`${id}-${name}-error`} errors={[fieldState.error]} />
            </FieldContent>
          </Field>
        )} />
      ))}
      <Controller control={form.control} name="role" render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={`${id}-role`} requiredLable>Role</FieldLabel>
          <FieldContent>
            <NativeSelect {...field} id={`${id}-role`} aria-required="true" aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? `${id}-role-error` : undefined} className="h-11 w-full rounded-lg">
              <NativeSelectOption value="">Select a role</NativeSelectOption>
              {allowedRoles.map((role) => <NativeSelectOption key={role} value={role}>{labels[role]}</NativeSelectOption>)}
            </NativeSelect>
            <FieldError id={`${id}-role-error`} errors={[fieldState.error]} />
          </FieldContent>
        </Field>
      )} />
    </fieldset>
  );
}
