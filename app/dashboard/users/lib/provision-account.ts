import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { authAccountsTable, authUsersTable, userRolesTable } from "@/db/schema/schema";
import { hashPassword } from "@/lib/auth/password";
import { createAccountSchema, firstSuperadminSchema, type CreateAccountInput, type FirstSuperadminInput } from "./zod-type/account";

// Public callers must verify management access and the requested role in their
// Server Action; bootstrap is restricted to a trusted local command.
export async function createCredentialAccount(input: CreateAccountInput) {
  const data = createAccountSchema.parse(input);
  return provisionAccount(data, data.role);
}

// Called only by the trusted terminal bootstrap, never by a Server Action.
export async function createFirstSuperadmin(input: FirstSuperadminInput) {
  return provisionAccount(firstSuperadminSchema.parse(input), "superadmin");
}

async function provisionAccount(data: FirstSuperadminInput, role: typeof userRolesTable.$inferInsert.role) {
  const passwordHash = await hashPassword(data.password);
  return db.transaction(async (tx) => {
    if (role === "superadmin") {
      // Serialize competing first-admin commands. The lock lives only for this
      // transaction and never changes existing accounts or grants.
      await tx.execute(sql`select pg_advisory_xact_lock(740112)`);
      const [admin] = await tx.select({ userId: userRolesTable.userId }).from(userRolesTable)
        .where(eq(userRolesTable.role, "superadmin")).limit(1);
      if (admin) return { success: false as const, message: "A superadmin already exists. Sign in to create more accounts." };
    }

    const [user] = await tx.insert(authUsersTable).values({ name: data.name, email: data.email })
      .onConflictDoNothing({ target: authUsersTable.email }).returning({ id: authUsersTable.id });
    if (!user) return { success: false as const, message: "An account with this email already exists." };
    await tx.insert(authAccountsTable).values({
      userId: user.id, provider: "credentials", providerAccountId: data.email, passwordHash,
    });
    await tx.insert(userRolesTable).values({ userId: user.id, role });
    return { success: true as const, data: { id: user.id, name: data.name } };
  });
}
