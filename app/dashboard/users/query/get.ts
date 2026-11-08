"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { getUsersAction } from "../lib/action";
import type { GetUsersInput } from "../lib/zod-type/manage-account";

export function getUsersQuery(userId: string, input: GetUsersInput) {
  return queryOptions({
    queryKey: ["get-users", userId, input],
    queryFn: async () => {
      const result = await getUsersAction(input);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });
}

export function useGetUsersQuery(userId: string, input: GetUsersInput) {
  return useQuery(getUsersQuery(userId, input));
}
export type UserItem = NonNullable<ReturnType<typeof useGetUsersQuery>["data"]>["items"][number];
