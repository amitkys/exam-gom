import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { loginLimitsTable } from "@/db/schema/login-limits";
import { hashToken } from "./token";

export async function consumeLoginAttempt(email: string) {
  // The atomic upsert locks the row, preventing concurrent bypasses. Database
  // time keeps the window consistent across app instances.
  const [limit] = await db.insert(loginLimitsTable).values({
    key: hashToken(email), attempts: 1, resetsAt: sql`now() + interval '15 minutes'`,
  }).onConflictDoUpdate({
    target: loginLimitsTable.key,
    set: {
      attempts: sql`case when ${loginLimitsTable.resetsAt} <= now() then 1 else least(${loginLimitsTable.attempts} + 1, 6) end`,
      resetsAt: sql`case when ${loginLimitsTable.resetsAt} <= now() then now() + interval '15 minutes' else ${loginLimitsTable.resetsAt} end`,
    },
  }).returning({ attempts: loginLimitsTable.attempts });
  return Boolean(limit && limit.attempts <= 5);
}
