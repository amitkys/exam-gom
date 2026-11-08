import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowUpRight, IconBook2, IconUserPlus, IconUsers } from "@tabler/icons-react";
import { requireUser } from "@/lib/auth/session";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { canManageAccounts } from "@/lib/auth/account-permissions";
import { workspaceRoleLabels } from "@/lib/menu-list";
import type { WorkspaceRole } from "@/types/workspace";

export const metadata: Metadata = { title: "Workspace" };

const workspaceTitles: Record<WorkspaceRole, string> = {
  superadmin: "Administration",
  exam_controller: "Examination workspace",
  faculty: "Faculty workspace",
  reviewer: "Review workspace",
  paper_setter: "Paper setting workspace",
};

async function Workspace() {
  const user = await requireUser();
  const role = user.roles.length === 1 ? user.roles[0] : undefined;
  const title = role ? workspaceTitles[role] : "Your workspace";
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
  const actions = [
    ...(user.roles.includes("exam_controller") ? [{
      title: "Assignments", href: "/dashboard/assignments", icon: IconBook2, button: "View assignments",
    }] : []),
    ...(canManageAccounts(user.roles) ? [
      { title: "Users", href: "/dashboard/users", icon: IconUsers, button: "Manage users" },
      { title: "Create account", href: "/dashboard/users/new", icon: IconUserPlus, button: "New account" },
    ] : []),
  ];

  return (
    <ContentLayout title={title}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Card>
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="size-14 shrink-0 sm:size-16">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials || "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">{title}</p>
                <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{user.name}</h1>
                <p className="break-all text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:max-w-xs sm:justify-end" aria-label="Assigned roles">
              {user.roles.length ? user.roles.map((assignedRole) => (
                <Badge key={assignedRole} variant="secondary">{workspaceRoleLabels[assignedRole]}</Badge>
              )) : <p className="text-sm text-muted-foreground">No roles assigned. Contact your administrator.</p>}
            </div>
          </CardContent>
        </Card>

        {actions.length > 0 && (
          <section aria-labelledby="workspace-actions" className="space-y-4">
            <h2 id="workspace-actions" className="text-sm font-semibold">Quick actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {actions.map(({ title: actionTitle, href, icon: Icon, button }) => (
                <Card key={href} className="justify-between">
                  <CardHeader>
                    <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" aria-hidden /></span>
                    <CardTitle><h3>{actionTitle}</h3></CardTitle>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full justify-between" render={<Link href={href} />} nativeButton={false}>
                      {button}<IconArrowUpRight aria-hidden data-icon="inline-end" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </ContentLayout>
  );
}

export default function DashboardPage() {
  return <Suspense fallback={<p role="status" className="p-8 text-muted-foreground">Loading workspace…</p>}><Workspace /></Suspense>;
}
