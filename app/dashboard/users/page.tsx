import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { UsersTableView } from "./_components/users-table-view";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { canManageAccounts } from "@/lib/auth/account-permissions";

export const metadata: Metadata = { title: "Users" };

async function AccountManagement() {
  const user = await requireUser();
  if (!canManageAccounts(user.roles)) redirect("/dashboard");
  return (
    <ContentLayout title="Users">
      <UsersTableView userId={user.id} />
    </ContentLayout>
  );
}

export default function UsersPage() {
  return <Suspense fallback={<p role="status" className="p-8">Loading account management…</p>}><AccountManagement /></Suspense>;
}
