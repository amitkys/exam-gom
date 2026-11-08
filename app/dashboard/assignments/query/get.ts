"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { getAssignmentsAction } from "../lib/action";
import type { GetAssignmentsInput } from "../lib/zod-type/assignment-list";

export function getAssignmentsQuery(userId: string, input: GetAssignmentsInput) {
  return queryOptions({
    queryKey: ["get-assignments", userId, input],
    queryFn: async () => {
      const result = await getAssignmentsAction(input);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });
}

export function useGetAssignmentsQuery(userId: string, input: GetAssignmentsInput) {
  return useQuery(getAssignmentsQuery(userId, input));
}

export type AssignmentItem = NonNullable<ReturnType<typeof useGetAssignmentsQuery>["data"]>["items"][number];
