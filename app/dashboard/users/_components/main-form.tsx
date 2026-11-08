"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { AccountFields } from "./account-fields";
import { createAccountFormSchema, type CreateAccountFormValues, type CreateAccountInput } from "../lib/zod-type/account";
import { useCreateAccountMutation } from "../query/create";
import type { WorkspaceUser } from "@/types/workspace";
import { getCreatableAccountRoles } from "@/lib/auth/account-permissions";

export function CreateAccountForm({ user }: { user: WorkspaceUser }) {
  const [createdName, setCreatedName] = useState<string | null>(null);
  const form = useForm<CreateAccountFormValues, unknown, CreateAccountInput>({
    resolver: zodResolver(createAccountFormSchema),
    defaultValues: { name: "", email: "", password: "", role: "" },
  });
  const mutation = useCreateAccountMutation(user.id);
  const submit = (input: CreateAccountInput) => {
    form.clearErrors("root");
    setCreatedName(null);
    mutation.mutate(input, {
      onSuccess: (result) => {
        if (!result.success) {
          form.setValue("password", "");
          form.setError("root", { message: result.message });
          return;
        }
        setCreatedName(result.data.name);
        form.reset();
      },
      onError: () => {
        form.setValue("password", "");
        form.setError("root", { message: "Unable to create the account. Check your connection and try again." });
      },
      onSettled: () => mutation.reset(),
    });
  };
  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate aria-busy={mutation.isPending}>
      <Card className="rounded-2xl">
        <CardHeader><CardTitle><h1 className="text-2xl font-semibold">Create an account</h1></CardTitle><CardDescription>Add a member and assign their initial access.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          {createdName && <p role="status" className="rounded-lg bg-primary/10 p-3 text-sm text-primary">Account created for {createdName}. They can now sign in with their email and initial password. No invitation email has been sent.</p>}
          <AccountFields form={form} disabled={mutation.isPending} allowedRoles={getCreatableAccountRoles(user.roles)} />
          {form.formState.errors.root && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
        </CardContent>
        <CardFooter className="justify-end"><Button type="submit" disabled={mutation.isPending} className="rounded-lg"><LoadingSwap isLoading={mutation.isPending}>Create account</LoadingSwap></Button></CardFooter>
      </Card>
    </form>
  );
}
