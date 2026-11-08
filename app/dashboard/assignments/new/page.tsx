import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { CreateAssignmentForm } from "./_components/main-form";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export const metadata: Metadata = { title: "Create assignment" };

async function NewAssignment() {
  const user = await requireUser();
  if (!user.roles.includes("exam_controller")) redirect("/dashboard");
  return (
    <ContentLayout title="Create assignment">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Link href="/dashboard/assignments" className="text-sm text-primary hover:underline">← Back to assignments</Link>
        <CreateAssignmentForm userId={user.id} />
      </div>
    </ContentLayout>
  );
}

export default function NewAssignmentPage() {
  return <Suspense fallback={<p role="status" className="p-8">Loading assignment form…</p>}><NewAssignment /></Suspense>;
}
