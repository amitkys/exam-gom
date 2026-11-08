import { sql } from "drizzle-orm";
import { check, index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsersTable } from "./auth";

export const assignmentsTable = pgTable("exam_assignments", {
  id: uuid().defaultRandom().primaryKey(),
  // Ownership comes from the authenticated controller, never from form input.
  controllerId: uuid().notNull().references(() => authUsersTable.id, { onDelete: "restrict" }),
  title: text().notNull(),
  instructions: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("exam_assignments_controller_idx").on(table.controllerId),
  check("assignment_title_length", sql`char_length(trim(${table.title})) between 1 and 200`),
  check("assignment_instructions_length", sql`char_length(trim(${table.instructions})) between 1 and 10000`),
]);

// Membership is assignment-specific; it does not change global roles or login
// access. Active faculty eligibility is verified in the creation transaction.
export const assignmentFacultyTable = pgTable("exam_assignment_faculty", {
  assignmentId: uuid().notNull().references(() => assignmentsTable.id, { onDelete: "cascade" }),
  facultyId: uuid().notNull().references(() => authUsersTable.id, { onDelete: "restrict" }),
  assignedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.assignmentId, table.facultyId] }),
  index("exam_assignment_faculty_user_idx").on(table.facultyId),
]);
