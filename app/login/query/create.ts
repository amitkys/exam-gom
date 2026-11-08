"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginAction } from "../lib/action";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginAction,
    gcTime: 0,
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.clear();
    },
  });
}
