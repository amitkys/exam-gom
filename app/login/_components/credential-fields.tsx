"use client";

import { useId, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { LoginInput } from "../lib/zod-type/login";

export function CredentialFields({ form, disabled }: { form: UseFormReturn<LoginInput>; disabled: boolean }) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-6">
      <Controller control={form.control} name="email" render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={`${id}-email`} requiredLable>Email address</FieldLabel>
          <FieldContent>
            <Input {...field} id={`${id}-email`} type="email" autoComplete="username" inputMode="email"
              autoCapitalize="none" spellCheck={false} disabled={disabled} aria-required="true"
              aria-invalid={fieldState.invalid} aria-describedby={fieldState.error ? `${id}-email-error` : undefined}
              placeholder="you@institution.edu" className="h-12 rounded-xl bg-background px-4" />
            <FieldError id={`${id}-email-error`} errors={[fieldState.error]} />
          </FieldContent>
        </Field>
      )} />
      <Controller control={form.control} name="password" render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={`${id}-password`} requiredLable>Password</FieldLabel>
          <FieldContent>
            <div className="relative">
              <Input {...field} id={`${id}-password`} type={showPassword ? "text" : "password"}
                autoComplete="current-password" disabled={disabled} aria-required="true"
                aria-invalid={fieldState.invalid} aria-describedby={fieldState.error ? `${id}-password-error` : undefined}
                placeholder="Enter your password" className="h-12 rounded-xl bg-background pr-12 pl-4" />
              <Button type="button" variant="ghost" size="icon" disabled={disabled}
                aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                aria-controls={`${id}-password`} className="absolute top-1.5 right-1.5 rounded-lg"
                onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </Button>
            </div>
            <FieldError id={`${id}-password-error`} errors={[fieldState.error]} />
          </FieldContent>
        </Field>
      )} />
    </div>
  );
}
