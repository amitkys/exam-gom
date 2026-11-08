"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAssignmentAction } from "../lib/action";
import type { CreateAssignmentInput } from "../lib/zod-type/assignment";

export function useCreateAssignmentMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssignmentInput) => createAssignmentAction(input),
    onSuccess: async (result) => {
      if (result.success) await queryClient.invalidateQueries({ queryKey: ["get-assignments", userId] });
    },
  });
}
