import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Shared across app instances. Hash normalized emails, including unknown
// accounts, so limiting does not disclose account existence.
export const loginLimitsTable = pgTable("auth_login_limits", {
  key: text().primaryKey(),
  attempts: integer().notNull(),
  resetsAt: timestamp({ withTimezone: true }).notNull(),
});
