import "server-only";

import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { authAccountsTable, authUsersTable, sessionsTable, userRolesTable } from "@/db/schema/schema";
import { createSessionToken, hashToken, isSessionToken, sessionLifetimeSeconds } from "./token";

const cookieName = process.env.NODE_ENV === "production" ? "__Host-exam-session" : "exam-session";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export async function getCurrentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !isSessionToken(token)) return null;

  const [user] = await db.select({
    id: authUsersTable.id, name: authUsersTable.name, email: authUsersTable.email,
  }).from(sessionsTable)
    .innerJoin(authUsersTable, eq(sessionsTable.userId, authUsersTable.id))
    .where(and(
      eq(sessionsTable.tokenHash, hashToken(token)),
      // Evaluate expiry on the database clock, without a synchronous render-time read.
      gt(sessionsTable.expiresAt, sql`now()`),
      isNull(sessionsTable.revokedAt),
      eq(authUsersTable.status, "active"),
    )).limit(1);
  if (!user) return null;

  const roles = await db.select({ role: userRolesTable.role }).from(userRolesTable)
    .where(eq(userRolesTable.userId, user.id));
  return { ...user, roles: roles.map(({ role }) => role) };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function createSession(userId: string, verifiedPasswordHash?: string) {
  // Rotate any existing browser session rather than retaining another bearer.
  await revokeSession();
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000);
  const created = await db.transaction(async (tx) => {
    // Password reset and account-disable operations lock this same user row.
    // Recheck the verified hash so an in-flight old-password login cannot create
    // a new session after a reset has revoked existing sessions.
    const [user] = await tx.select({ id: authUsersTable.id }).from(authUsersTable)
      .where(and(eq(authUsersTable.id, userId), eq(authUsersTable.status, "active"))).for("share");
    if (!user) return false;
    if (verifiedPasswordHash !== undefined) {
      const [account] = await tx.select({ id: authAccountsTable.id }).from(authAccountsTable)
        .where(and(eq(authAccountsTable.userId, userId), eq(authAccountsTable.provider, "credentials"), eq(authAccountsTable.passwordHash, verifiedPasswordHash))).limit(1);
      if (!account) return false;
    }
    await tx.insert(sessionsTable).values({ userId, tokenHash: hashToken(token), expiresAt });
    return true;
  });
  if (!created) return false;
  (await cookies()).set(cookieName, token, {
    ...cookieOptions, expires: expiresAt, maxAge: sessionLifetimeSeconds,
  });
  return true;
}

export async function revokeSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (token && isSessionToken(token)) {
    await db.update(sessionsTable).set({ revokedAt: new Date() })
      .where(and(eq(sessionsTable.tokenHash, hashToken(token)), isNull(sessionsTable.revokedAt)));
  }
  cookieStore.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
}
