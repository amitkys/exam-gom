"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useLogoutMutation } from "../query/delete";
import { IconLogout } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function LogoutButton({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  const mutation = useLogoutMutation();
  const error = mutation.isError ? "Unable to sign out. Please try again." :
    mutation.data && !mutation.data.success ? mutation.data.message : null;
  return (
    <div className={cn("flex flex-col items-end gap-2", className)}>
      <Button variant="outline" aria-label="Sign out" title={collapsed ? "Sign out" : undefined} className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        <LoadingSwap isLoading={mutation.isPending}><span className="inline-flex items-center gap-2"><IconLogout aria-hidden />{!collapsed && "Sign out"}</span></LoadingSwap>
      </Button>
      {error && <p role="alert" className="max-w-xs text-sm text-destructive">{error}</p>}
    </div>
  );
}
