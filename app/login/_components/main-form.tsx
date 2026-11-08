"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowRight, IconLock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { CredentialFields } from "./credential-fields";
import { loginSchema, type LoginInput } from "../lib/zod-type/login";
import { useLoginMutation } from "../query/create";

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" },
  });
  const mutation = useLoginMutation();
  const submit = (input: LoginInput) => {
    form.clearErrors("root");
    mutation.mutate(input, {
      onSuccess: (result) => {
        if (result.success) {
          // A full navigation drops all in-memory private state at the auth boundary.
          window.location.replace(result.data.redirectTo);
        } else {
          form.setValue("password", "");
          form.setError("root", { message: result.message });
        }
      },
      onError: () => {
        form.setValue("password", "");
        form.setError("root", { message: "Unable to sign in. Check your connection and try again." });
      },
      onSettled: () => mutation.reset(),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate aria-label="Sign in" aria-busy={mutation.isPending}>
      <Card className="gap-7 rounded-none bg-transparent py-0 shadow-none ring-0">
        <CardHeader className="gap-3 px-0">
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl border bg-background text-primary">
            <IconLock className="size-5" aria-hidden="true" />
          </div>
          <CardTitle><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1></CardTitle>
          <CardDescription className="text-base leading-relaxed">Sign in to your examination workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-0">
          <CredentialFields form={form} disabled={mutation.isPending} />
          {form.formState.errors.root && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{form.formState.errors.root.message}</p>}
        </CardContent>
        <CardFooter className="flex-col gap-6 px-0">
          <Button type="submit" size="lg" disabled={mutation.isPending} className="h-12 w-full gap-3 rounded-xl text-sm">
            <LoadingSwap isLoading={mutation.isPending}>Sign in</LoadingSwap>
            {!mutation.isPending && <IconArrowRight aria-hidden="true" />}
          </Button>
          <p className="text-center text-sm leading-6 text-muted-foreground">Need access or help with your password?<br /><span className="font-medium text-foreground">Contact your institution administrator.</span></p>
        </CardFooter>
      </Card>
    </form>
  );
}
