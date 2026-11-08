import { Suspense } from "react";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { requireUser } from "@/lib/auth/session";

async function AuthenticatedWorkspace({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AdminPanelLayout user={user}>{children}</AdminPanelLayout>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p role="status" className="p-8 text-muted-foreground">Loading workspace…</p>}>
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}
