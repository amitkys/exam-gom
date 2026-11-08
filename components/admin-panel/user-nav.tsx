"use client";

import Link from "next/link";
import { LayoutGrid, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaceUser } from "./workspace-context";
import { WorkspaceUserNav } from "./workspace-user-nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function UserNav() {
  const user = useWorkspaceUser();
  if (user) return <WorkspaceUserNav user={user} />;
  return (
    <DropdownMenu>
      <TooltipProvider delay={100}>
        <Tooltip disableHoverablePopup>
          <TooltipTrigger render={<DropdownMenuTrigger render={<Button variant="outline" className="relative h-8 w-8 rounded-full" />} />}><Avatar className="h-8 w-8">
                                                          <AvatarImage src="#" alt="Avatar" />
                                                          <AvatarFallback className="bg-transparent">JD</AvatarFallback>
                                                        </Avatar></TooltipTrigger>
          <TooltipContent side="bottom">Profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">John Doe</p>
            <p className="text-xs leading-none text-muted-foreground">
              johndoe@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:cursor-pointer" render={<Link href="/dashboard" className="flex items-center" />}><LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />Dashboard
                              </DropdownMenuItem>
          <DropdownMenuItem className="hover:cursor-pointer" render={<Link href="/account" className="flex items-center" />}><User className="w-4 h-4 mr-3 text-muted-foreground" />Account
                              </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:cursor-pointer" onClick={() => {}}>
          <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
