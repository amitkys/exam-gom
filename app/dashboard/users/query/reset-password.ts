"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resetAccountPasswordAction } from "../lib/action";
import type { ResetAccountPasswordInput } from "../lib/zod-type/manage-account";

export function useResetAccountPasswordMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResetAccountPasswordInput) => resetAccountPasswordAction(input), gcTime: 0,
    onSuccess: async (result) => {
      if (result.success) await queryClient.invalidateQueries({ queryKey: ["get-users", userId] });
    },
  });
}
