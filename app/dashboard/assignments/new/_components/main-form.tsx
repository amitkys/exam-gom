"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { createAssignmentSchema, type CreateAssignmentInput } from "../lib/zod-type/assignment";
import { useCreateAssignmentMutation } from "../query/create";
import { AssignmentFields } from "./assignment-fields";
import { FacultyFields } from "./faculty-fields";

export function CreateAssignmentForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const form = useForm<CreateAssignmentInput>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: { title: "", instructions: "", facultyIds: [] },
  });
  const mutation = useCreateAssignmentMutation(userId);
  const disabled = mutation.isPending || createdId !== null;
  const submit = (input: CreateAssignmentInput) => {
    if (disabled) return;
    form.clearErrors("root");
    mutation.mutate(input, {
      onSuccess: (result) => {
        if (!result.success) {
          form.setError("root", { message: result.message });
          return;
        }
        setCreatedId(result.data.id);
        router.push(`/dashboard/assignments/${result.data.id}`);
      },
      onError: () => form.setError("root", { message: "Unable to create the assignment. Check your connection and try again." }),
    });
  };
  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate aria-busy={mutation.isPending}>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle><h1 className="text-2xl font-semibold">Create an assignment</h1></CardTitle>
          <CardDescription>Set the preparation instructions and choose the faculty responsible.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <AssignmentFields form={form} disabled={disabled} />
          <FacultyFields form={form} userId={userId} disabled={disabled} />
          {form.formState.errors.root && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
          {createdId && <p role="status" className="text-sm text-primary">Assignment created. <a href={`/dashboard/assignments/${createdId}`} className="underline">View assignment</a></p>}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={disabled}><LoadingSwap isLoading={mutation.isPending}>Create assignment</LoadingSwap></Button>
        </CardFooter>
      </Card>
    </form>
  );
}
