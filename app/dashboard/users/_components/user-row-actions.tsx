"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { resetAccountPasswordSchema, type ResetAccountPasswordInput } from "../lib/zod-type/manage-account";
import { useResetAccountPasswordMutation } from "../query/reset-password";
import { useSetAccountStatusMutation } from "../query/update-status";
import type { UserItem } from "../query/get";
import { PasswordFields } from "./password-fields";

export function UserRowActions({ user, managerId, onFeedback }: { user: UserItem; managerId: string; onFeedback: (message: string) => void }) {
  const [resetOpen, setResetOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const resetMutation = useResetAccountPasswordMutation(managerId);
  const statusMutation = useSetAccountStatusMutation(managerId);
  const form = useForm<ResetAccountPasswordInput>({
    resolver: zodResolver(resetAccountPasswordSchema), defaultValues: { id: user.id, password: "", confirmPassword: "" },
  });
  if (!user.canManage) return <span className="text-xs text-muted-foreground">{user.id === managerId ? "Your account" : "View only"}</span>;
  const pending = resetMutation.isPending || statusMutation.isPending;
  const submitReset = (input: ResetAccountPasswordInput) => {
    if (pending) return;
    form.clearErrors("root");
    resetMutation.mutate(input, {
      onSuccess: (result) => {
        if (!result.success) { form.setError("root", { message: result.message }); return; }
        form.reset(); setResetOpen(false);
        onFeedback(`Password reset for ${user.name}. Existing sessions were revoked. Share the new password privately; no email was sent.`);
      },
      onError: () => form.setError("root", { message: "Unable to reset the password. Please try again." }),
      onSettled: () => { form.setValue("password", ""); form.setValue("confirmPassword", ""); resetMutation.reset(); },
    });
  };
  const statusLabel = user.status === "active" ? "Disable" : "Enable";
  const changeStatus = () => {
    setStatusError(null);
    statusMutation.mutate({ id: user.id, status: user.status === "active" ? "disabled" : "active" }, {
      onSuccess: (result) => {
        if (!result.success) { setStatusError(result.message); return; }
        setStatusOpen(false); onFeedback(`${user.name} is now ${result.data.status}.`);
      },
      onError: () => setStatusError("Unable to change account access. Please try again."),
    });
  };
  return <div className="flex flex-wrap gap-2">
    <Sheet open={resetOpen} onOpenChange={(open) => {
      if (pending) return;
      setResetOpen(open); if (!open) { form.reset(); resetMutation.reset(); }
    }}>
      <SheetTrigger render={<Button variant="outline" size="sm" disabled={pending || !user.hasCredentials} aria-label={`Reset password for ${user.name}`} />}>Reset password</SheetTrigger>
      <SheetContent side={isMobile ? "bottom" : "right"} showCloseButton={!resetMutation.isPending} className="max-h-svh overflow-y-auto data-[side=right]:sm:w-1/2 data-[side=right]:sm:max-w-none">
        <SheetHeader><SheetTitle>Reset password</SheetTitle><SheetDescription className="[overflow-wrap:anywhere]">Set a new password for {user.name} ({user.email}). All existing sessions will be revoked. No reset email is sent.</SheetDescription></SheetHeader>
        <form className="px-4 pb-6" onSubmit={form.handleSubmit(submitReset)} noValidate aria-busy={resetMutation.isPending}>
          <Card>
            <CardHeader><CardTitle>New credentials</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PasswordFields form={form} disabled={resetMutation.isPending} />
              {form.formState.errors.root && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
            </CardContent>
            <CardFooter><Button type="submit" disabled={resetMutation.isPending}><LoadingSwap isLoading={resetMutation.isPending}>Reset password</LoadingSwap></Button></CardFooter>
          </Card>
        </form>
      </SheetContent>
    </Sheet>
    <Dialog open={statusOpen} onOpenChange={(open) => { if (!pending) { setStatusOpen(open); setStatusError(null); } }}>
      <DialogTrigger render={<Button variant="outline" size="sm" disabled={pending} aria-label={`${statusLabel} ${user.name}`} />}>{statusLabel}</DialogTrigger>
      <DialogContent showCloseButton={!statusMutation.isPending}>
        <DialogHeader><DialogTitle>{statusLabel} account?</DialogTitle><DialogDescription className="[overflow-wrap:anywhere]">{user.name} ({user.email}) {user.status === "active" ? "will be signed out and unable to sign in until re-enabled." : "will be able to sign in again. Revoked sessions remain invalid."}</DialogDescription></DialogHeader>
        {statusError && <p role="alert" className="text-sm text-destructive">{statusError}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={statusMutation.isPending} onClick={() => setStatusOpen(false)}>Cancel</Button>
          <Button variant={user.status === "active" ? "destructive" : "default"} disabled={statusMutation.isPending} onClick={changeStatus}><LoadingSwap isLoading={statusMutation.isPending}>{statusLabel} account</LoadingSwap></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
