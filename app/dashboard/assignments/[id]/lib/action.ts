"use server";

import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assignmentFacultyTable, assignmentsTable, authUsersTable } from "@/db/schema/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function getAssignmentAction(input: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user?.roles.includes("exam_controller")) {
      return { success: false as const, message: "Only exam controllers can view their assignments." };
    }
    const parsed = z.uuid().safeParse(input);
    if (!parsed.success) return { success: true as const, data: null };
    const [assignment] = await db.select({
      id: assignmentsTable.id, title: assignmentsTable.title,
      instructions: assignmentsTable.instructions, createdAt: assignmentsTable.createdAt,
    }).from(assignmentsTable)
      .where(and(eq(assignmentsTable.id, parsed.data), eq(assignmentsTable.controllerId, user.id))).limit(1);
    if (!assignment) return { success: true as const, data: null };
    const faculty = await db.select({ id: authUsersTable.id, name: authUsersTable.name, email: authUsersTable.email })
      .from(assignmentFacultyTable).innerJoin(authUsersTable, eq(authUsersTable.id, assignmentFacultyTable.facultyId))
      .where(eq(assignmentFacultyTable.assignmentId, assignment.id))
      .orderBy(asc(authUsersTable.name), asc(authUsersTable.id)).limit(50);
    return { success: true as const, data: { ...assignment, faculty } };
  } catch (error) {
    console.error("getAssignmentAction error", { type: error instanceof Error ? error.name : "UnknownError" });
    return { success: false as const, message: "Unable to load the assignment. Please try again." };
  }
}
