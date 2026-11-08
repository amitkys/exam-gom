"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAccountAction } from "../lib/action";
import type { CreateAccountInput } from "../lib/zod-type/account";

export function useCreateAccountMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccountAction(input), gcTime: 0,
    onSuccess: async (result) => {
      if (!result.success) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["get-users", userId] }),
        queryClient.invalidateQueries({ queryKey: ["search-faculty", userId] }),
      ]);
    },
  });
}
