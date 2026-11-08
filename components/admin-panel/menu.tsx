"use client";

import Link from "next/link";
import { IconDots } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { CollapseMenuButton } from "./collapse-menu-button";
import { useWorkspaceUser } from "./workspace-context";
import { LogoutButton } from "@/app/dashboard/_components/logout-button";

interface MenuProps {
  isOpen: boolean | undefined;
  onNavigate?: () => void;
}

export function Menu({ isOpen, onNavigate }: MenuProps) {
  const pathname = usePathname() || "";
  const user = useWorkspaceUser();
  const menuList = getMenuList(pathname, user?.roles);
  const matchesRoute = (href: string) => pathname === href || (href !== "/dashboard" && href !== "" && pathname.startsWith(`${href}/`));

  return (
    <ScrollArea className="min-h-0 flex-1 [&>div>div[style]]:!block">
      <nav aria-label="Workspace navigation" className="mt-8 h-full w-full">
        <ul className="flex min-h-[calc(100vh-200px)] flex-col items-start space-y-1 px-2">
          {menuList.map(({ groupLabel, menus }) => (
            <li className={cn("w-full", groupLabel && "pt-5")} key={groupLabel}>
              {groupLabel && (isOpen !== false ? (
                <p className="max-w-[248px] truncate px-4 pb-2 text-sm font-medium text-muted-foreground">{groupLabel}</p>
              ) : (
                <TooltipProvider delay={100}>
                  <Tooltip>
                    <TooltipTrigger className="flex w-full justify-center pb-2" aria-label={groupLabel}><IconDots className="size-5" aria-hidden /></TooltipTrigger>
                    <TooltipContent side="right">{groupLabel}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {menus.map(({ href, label, icon: Icon, active, submenus }) => {
                const isActive = active ?? (submenus?.length ? submenus.some((submenu) => submenu.active ?? matchesRoute(submenu.href)) : matchesRoute(href));
                if (submenus?.length) {
                  return <CollapseMenuButton key={label} icon={Icon} label={label} active={isActive} submenus={submenus} isOpen={isOpen} />;
                }
                return (
                  <TooltipProvider key={label} delay={100}>
                    <Tooltip disableHoverablePopup>
                      <TooltipTrigger render={
                        <Button variant={isActive ? "secondary" : "ghost"} className="mb-1 h-10 w-full justify-start"
                          render={<Link href={href} aria-current={isActive ? "page" : undefined} onClick={onNavigate} />} nativeButton={false} />
                      }>
                        <Icon size={18} className={cn("shrink-0", isOpen !== false && "mr-4")} aria-hidden />
                        <span className={cn("max-w-[200px] truncate", isOpen === false && "sr-only")}>{label}</span>
                      </TooltipTrigger>
                      {isOpen === false && <TooltipContent side="right">{label}</TooltipContent>}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </li>
          ))}
          {user && <li className="flex w-full grow items-end pt-5"><LogoutButton collapsed={isOpen === false} className="w-full" /></li>}
        </ul>
      </nav>
    </ScrollArea>
  );
}
