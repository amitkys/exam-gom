"use client";

import Link from "next/link";
import { IconLayoutDashboard } from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/app/dashboard/_components/logout-button";
import { workspaceRoleLabels } from "@/lib/menu-list";
import type { WorkspaceUser } from "@/types/workspace";

export function WorkspaceUserNav({ user }: { user: WorkspaceUser }) {
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="rounded-full" aria-label="Open account menu" />}>
        <Avatar className="size-8"><AvatarFallback>{initials || "?"}</AvatarFallback></Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="space-y-1 font-normal">
            <p className="break-words font-medium">{user.name}</p>
            <p className="break-all text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">{user.roles.map((role) => workspaceRoleLabels[role]).join(", ") || "No roles assigned"}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard" />}><IconLayoutDashboard aria-hidden />My workspace</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="p-1"><LogoutButton className="w-full" /></div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
