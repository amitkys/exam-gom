import { z } from "zod";

export const getAssignmentsSchema = z.strictObject({
  search: z.string().trim().max(100),
  page: z.number().int().min(1).max(100000),
  limit: z.number().int().min(1).max(50),
});

export type GetAssignmentsInput = z.infer<typeof getAssignmentsSchema>;
