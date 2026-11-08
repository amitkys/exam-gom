"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { searchFacultyAction } from "../lib/action";

export function searchFacultyQuery(userId: string, search: string) {
  return queryOptions({
    queryKey: ["search-faculty", userId, search],
    queryFn: async () => {
      const result = await searchFacultyAction({ search });
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });
}

export function useSearchFacultyQuery(userId: string, search: string) {
  return useQuery(searchFacultyQuery(userId, search));
}

export type FacultyItem = NonNullable<ReturnType<typeof useSearchFacultyQuery>["data"]>["items"][number];
