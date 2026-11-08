"use client";

import { useId } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateAssignmentInput } from "../lib/zod-type/assignment";

export function AssignmentFields({ form, disabled }: { form: UseFormReturn<CreateAssignmentInput>; disabled: boolean }) {
  const id = useId();
  return (
    <fieldset disabled={disabled} className="grid gap-6" aria-label="Assignment details">
      <Controller control={form.control} name="title" render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={`${id}-title`} requiredLable>Assignment title</FieldLabel>
          <FieldContent>
            <Input {...field} id={`${id}-title`} maxLength={200} placeholder="e.g. Mathematics — Semester 1"
              aria-required="true" aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? `${id}-title-error` : undefined} />
            <FieldError id={`${id}-title-error`} errors={[fieldState.error]} />
          </FieldContent>
        </Field>
      )} />
      <Controller control={form.control} name="instructions" render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={`${id}-instructions`} requiredLable>Instructions</FieldLabel>
          <FieldContent>
            <Textarea {...field} id={`${id}-instructions`} maxLength={10000} rows={6}
              placeholder="Describe the syllabus, question requirements, and any preparation guidelines."
              aria-required="true" aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? `${id}-instructions-error` : undefined} />
            <FieldError id={`${id}-instructions-error`} errors={[fieldState.error]} />
          </FieldContent>
        </Field>
      )} />
    </fieldset>
  );
}
