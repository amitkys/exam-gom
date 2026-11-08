"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setAccountStatusAction } from "../lib/action";
import type { SetAccountStatusInput } from "../lib/zod-type/manage-account";

export function useSetAccountStatusMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetAccountStatusInput) => setAccountStatusAction(input),
    onSuccess: async (result) => {
      if (!result.success) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["get-users", userId] }),
        queryClient.invalidateQueries({ queryKey: ["search-faculty", userId] }),
      ]);
    },
  });
}
