"use server";

import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { assignmentFacultyTable, assignmentsTable, authUsersTable, userRolesTable } from "@/db/schema/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { createAssignmentSchema, searchFacultySchema } from "./zod-type/assignment";

export async function searchFacultyAction(input: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user?.roles.includes("exam_controller")) {
      return { success: false as const, message: "Only exam controllers can select faculty." };
    }
    const parsed = searchFacultySchema.safeParse(input);
    if (!parsed.success) return { success: false as const, message: "Enter a search of up to 100 characters." };
    // Escape LIKE metacharacters so searches match literal names and emails.
    const search = `%${parsed.data.search.replace(/[\\%_]/g, "\\$&")}%`;
    const rows = await db.select({ id: authUsersTable.id, name: authUsersTable.name, email: authUsersTable.email })
      .from(authUsersTable).innerJoin(userRolesTable, eq(userRolesTable.userId, authUsersTable.id))
      .where(and(eq(authUsersTable.status, "active"), eq(userRolesTable.role, "faculty"),
        or(ilike(authUsersTable.name, search), ilike(authUsersTable.email, search))))
      .orderBy(asc(authUsersTable.name), asc(authUsersTable.id)).limit(21);
    return { success: true as const, data: { items: rows.slice(0, 20), hasMore: rows.length > 20 } };
  } catch (error) {
    console.error("searchFacultyAction error", { type: error instanceof Error ? error.name : "UnknownError" });
    return { success: false as const, message: "Unable to load faculty. Please try again." };
  }
}

export async function createAssignmentAction(input: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user?.roles.includes("exam_controller")) {
      return { success: false as const, message: "Only exam controllers can create assignments." };
    }
    const parsed = createAssignmentSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, message: "Check the title, instructions, and selected faculty." };
    const { title, instructions, facultyIds } = parsed.data;
    return await db.transaction(async (tx) => {
      // Keep eligibility stable until the assignment and every membership commit.
      const faculty = await tx.select({ id: authUsersTable.id }).from(authUsersTable)
        .innerJoin(userRolesTable, eq(userRolesTable.userId, authUsersTable.id))
        .where(and(inArray(authUsersTable.id, facultyIds), eq(authUsersTable.status, "active"), eq(userRolesTable.role, "faculty")))
        .for("share");
      if (faculty.length !== facultyIds.length) {
        return { success: false as const, message: "Some selected faculty are no longer available. Refresh the faculty search and update your selection." };
      }
      const [assignment] = await tx.insert(assignmentsTable).values({ controllerId: user.id, title, instructions })
        .returning({ id: assignmentsTable.id, title: assignmentsTable.title });
      if (!assignment) throw new Error("Assignment insert returned no row");
      await tx.insert(assignmentFacultyTable).values(facultyIds.map((facultyId) => ({ assignmentId: assignment.id, facultyId })));
      return { success: true as const, data: assignment };
    });
  } catch (error) {
    console.error("createAssignmentAction error", { type: error instanceof Error ? error.name : "UnknownError" });
    return { success: false as const, message: "Unable to create the assignment. Please try again." };
  }
}
