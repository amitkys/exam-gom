import { z } from "zod";

export const maxAssignmentFaculty = 50;

export const createAssignmentSchema = z.strictObject({
  title: z.string().trim().min(1, { error: "Enter an assignment title." }).max(200),
  instructions: z.string().trim().min(1, { error: "Enter instructions for the faculty." }).max(10000),
  facultyIds: z.array(z.uuid()).min(1, { error: "Select at least one faculty member." })
    .max(maxAssignmentFaculty, { error: "Select up to 50 faculty members." })
    .refine((ids) => new Set(ids).size === ids.length, { error: "Select each faculty member only once." }),
});

export const searchFacultySchema = z.strictObject({ search: z.string().trim().max(100) });
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
