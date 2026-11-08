import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { canManageAccounts } from "@/lib/auth/account-permissions";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { CreateAccountForm } from "../_components/main-form";

export const metadata: Metadata = { title: "Create account" };

async function CreateUser() {
  const user = await requireUser();
  if (!canManageAccounts(user.roles)) redirect("/dashboard");
  return <ContentLayout title="Create account"><div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
    <Link href="/dashboard/users" className="text-sm text-primary hover:underline">← Back to users</Link>
    <CreateAccountForm user={user} />
  </div></ContentLayout>;
}

export default function NewUserPage() {
  return <Suspense fallback={<p role="status" className="p-8">Loading account creation…</p>}><CreateUser /></Suspense>;
}
