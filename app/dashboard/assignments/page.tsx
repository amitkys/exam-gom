import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { requireUser } from "@/lib/auth/session";
import { AssignmentsTableView } from "./_components/assignments-table-view";

export const metadata: Metadata = { title: "Assignments" };

async function Assignments() {
  const user = await requireUser();
  if (!user.roles.includes("exam_controller")) redirect("/dashboard");
  return <ContentLayout title="Assignments"><AssignmentsTableView userId={user.id} /></ContentLayout>;
}

export default function AssignmentsPage() {
  return <Suspense fallback={<p role="status" className="p-8">Loading assignments…</p>}><Assignments /></Suspense>;
}
