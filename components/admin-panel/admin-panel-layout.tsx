"use client";

import { Sidebar } from "@/components/admin-panel/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { WorkspaceContext } from "./workspace-context";
import type { WorkspaceUser } from "@/types/workspace";

export function AdminPanelLayout({
  children,
  isEmbedded = false,
  user
}: {
  children: React.ReactNode;
  isEmbedded?: boolean;
  user?: WorkspaceUser;
}) {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { getOpenState, settings } = sidebar;
  return (
    <WorkspaceContext.Provider value={user ?? null}>
    <div className={cn("relative flex flex-col min-h-screen", isEmbedded && "min-h-full")}>
      <Sidebar isEmbedded={isEmbedded} />
      <main
        className={cn(
          "min-h-[calc(100vh_-_56px)] bg-zinc-50 dark:bg-zinc-900 transition-[margin-left] ease-in-out duration-300 flex-1",
          isEmbedded && "min-h-[450px]",
          !settings.disabled && (!getOpenState() ? "lg:ml-[90px]" : "lg:ml-72")
        )}
      >
        {children}
      </main>
    </div>
    </WorkspaceContext.Provider>
  );
}

export default AdminPanelLayout;
