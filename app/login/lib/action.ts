"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { authAccountsTable, authUsersTable } from "@/db/schema/schema";
import { consumeLoginAttempt } from "@/lib/auth/login-limit";
import { logAuthError } from "@/lib/auth/log";
import { dummyPasswordHash, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema, type LoginInput } from "./zod-type/login";

export async function loginAction(input: LoginInput) {
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, message: "Enter a valid email and password." };
    const { email, password } = parsed.data;
    if (!await consumeLoginAttempt(email)) {
      return { success: false as const, message: "Too many sign-in attempts. Please try again in 15 minutes." };
    }

    const [account] = await db.select({
      userId: authUsersTable.id, status: authUsersTable.status,
      passwordHash: authAccountsTable.passwordHash,
    }).from(authAccountsTable)
      .innerJoin(authUsersTable, eq(authAccountsTable.userId, authUsersTable.id))
      .where(and(eq(authAccountsTable.provider, "credentials"), eq(authAccountsTable.providerAccountId, email)))
      .limit(1);
    const matches = await verifyPassword(password, account?.passwordHash ?? dummyPasswordHash);
    if (!account || !account.passwordHash || !matches || account.status !== "active") {
      return { success: false as const, message: "Email or password is incorrect." };
    }
    if (!await createSession(account.userId, account.passwordHash)) {
      return { success: false as const, message: "Email or password is incorrect." };
    }
    return { success: true as const, data: { redirectTo: "/dashboard" } };
  } catch (error) {
    logAuthError("loginAction", error);
    return { success: false as const, message: "Unable to sign in right now. Please try again." };
  }
}
