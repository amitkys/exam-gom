"use server";

import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { assignmentFacultyTable, assignmentsTable } from "@/db/schema/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getAssignmentsSchema } from "./zod-type/assignment-list";

export async function getAssignmentsAction(input: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user?.roles.includes("exam_controller")) {
      return { success: false as const, message: "Only exam controllers can view their assignments." };
    }
    const parsed = getAssignmentsSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, message: "Check the assignment search and pagination." };
    const { search, limit } = parsed.data;
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    const where = and(eq(assignmentsTable.controllerId, user.id), ilike(assignmentsTable.title, pattern));
    return await db.transaction(async (tx) => {
      const [count] = await tx.select({ total: sql<number>`count(*)::int` }).from(assignmentsTable).where(where);
      const total = count?.total ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const page = Math.min(parsed.data.page, totalPages);
      const items = await tx.select({
        id: assignmentsTable.id,
        title: assignmentsTable.title,
        instructionsPreview: sql<string>`left(${assignmentsTable.instructions}, 160)`,
        createdAt: assignmentsTable.createdAt,
        facultyCount: sql<number>`(select count(*)::int from ${assignmentFacultyTable} where ${assignmentFacultyTable.assignmentId} = ${assignmentsTable.id})`,
      }).from(assignmentsTable).where(where)
        .orderBy(desc(assignmentsTable.createdAt), asc(assignmentsTable.id)).limit(limit).offset((page - 1) * limit);
      return { success: true as const, data: { items, pagination: { total, page, limit, totalPages } } };
    }, { isolationLevel: "repeatable read", accessMode: "read only" });
  } catch (error) {
    console.error("getAssignmentsAction error", { type: error instanceof Error ? error.name : "UnknownError" });
    return { success: false as const, message: "Unable to load assignments. Please try again." };
  }
}
