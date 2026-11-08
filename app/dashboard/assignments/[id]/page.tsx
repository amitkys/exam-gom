import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getAssignmentAction } from "./lib/action";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export const metadata: Metadata = { title: "Assignment" };

async function AssignmentDetails({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user.roles.includes("exam_controller")) redirect("/dashboard");
  const { id } = await params;
  const result = await getAssignmentAction(id);
  if (result.success && !result.data) notFound();
  return (
    <ContentLayout title="Assignment details">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Link href="/dashboard/assignments" className="text-sm text-primary hover:underline">← Back to assignments</Link>
        {!result.success ? <p role="alert" className="text-destructive">{result.message}</p> : result.data && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Assignment saved · {result.data.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</CardDescription>
              <CardTitle><h1 className="break-words text-2xl font-semibold">{result.data.title}</h1></CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-3"><h2 className="font-medium">Instructions</h2><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{result.data.instructions}</p></section>
              <section className="space-y-3">
                <h2 className="font-medium">Assigned faculty ({result.data.faculty.length})</h2>
                <ul className="grid gap-3 sm:grid-cols-2">{result.data.faculty.map((member) => <li key={member.id} className="rounded-lg border p-3"><p className="break-words font-medium">{member.name}</p><p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{member.email}</p></li>)}</ul>
              </section>
            </CardContent>
          </Card>
        )}
        <Link href="/dashboard/assignments/new" className="inline-block text-sm text-primary hover:underline">Create another assignment →</Link>
      </div>
    </ContentLayout>
  );
}

export default function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p role="status" className="p-8">Loading assignment…</p>}><AssignmentDetails params={params} /></Suspense>;
}
