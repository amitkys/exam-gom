"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutAction } from "../lib/action";

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutAction,
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.clear();
      window.location.replace(result.data.redirectTo);
    },
  });
}
