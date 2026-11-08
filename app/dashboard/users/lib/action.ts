"use server";

import { createCredentialAccount } from "./provision-account";
import { getCurrentUser } from "@/lib/auth/session";
import { logAuthError } from "@/lib/auth/log";
import { createAccountSchema } from "./zod-type/account";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { authAccountsTable, authUsersTable, sessionsTable, userRolesTable } from "@/db/schema/schema";
import { canManageAccount, canManageAccounts, getCreatableAccountRoles } from "@/lib/auth/account-permissions";
import { hashPassword } from "@/lib/auth/password";
import { getUsersSchema, resetAccountPasswordSchema, setAccountStatusSchema } from "./zod-type/manage-account";

export async function createAccountAction(input: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageAccounts(user.roles)) {
      return { success: false as const, message: "You do not have permission to create accounts." };
    }
    const parsed = createAccountSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, message: "Check the account details and try again." };
    if (!getCreatableAccountRoles(user.roles).includes(parsed.data.role)) {
      return { success: false as const, message: "You do not have permission to create an account with that role." };
    }
    return await createCredentialAccount(parsed.data);
  } catch (error) {
    logAuthError("createAccountAction", error);
    return { success: false as const, message: "Unable to create the account. Please try again." };
  }
}

export async function getUsersAction(input: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageAccounts(user.roles)) return { success: false as const, message: "You do not have permission to view users." };
    const parsed = getUsersSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, message: "Check the user search and pagination." };
    const { search, status, limit } = parsed.data;
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    const where = and(
      status === "all" ? undefined : eq(authUsersTable.status, status),
      or(ilike(authUsersTable.name, pattern), ilike(authUsersTable.email, pattern)),
    );
    // Keep totals and page contents consistent within this read transaction.
    return await db.transaction(async (tx) => {
      const [count] = await tx.select({ total: sql<number>`count(*)::int` }).from(authUsersTable).where(where);
      const total = count?.total ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const page = Math.min(parsed.data.page, totalPages);
      const users = await tx.select({
        id: authUsersTable.id, name: authUsersTable.name, email: authUsersTable.email,
        status: authUsersTable.status, createdAt: authUsersTable.createdAt,
        hasCredentials: sql<boolean>`exists (select 1 from ${authAccountsTable} where ${authAccountsTable.userId} = ${authUsersTable.id} and ${authAccountsTable.provider} = 'credentials')`,
      }).from(authUsersTable).where(where).orderBy(desc(authUsersTable.createdAt), asc(authUsersTable.id)).limit(limit).offset((page - 1) * limit);
      const roles = users.length ? await tx.select({ userId: userRolesTable.userId, role: userRolesTable.role })
        .from(userRolesTable).where(inArray(userRolesTable.userId, users.map((item) => item.id))) : [];
      const items = users.map((item) => {
        const assignedRoles = roles.filter((role) => role.userId === item.id).map((role) => role.role);
        return { ...item, roles: assignedRoles, canManage: canManageAccount(user, { id: item.id, roles: assignedRoles }) };
      });
      return { success: true as const, data: { items, pagination: { total, page, limit, totalPages } } };
    }, { isolationLevel: "repeatable read", accessMode: "read only" });
  } catch (error) {
    logAuthError("getUsersAction", error);
    return { success: false as const, message: "Unable to load users. Please try again." };
  }
}

export async function resetAccountPasswordAction(input: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageAccounts(user.roles)) return { success: false as const, message: "You do not have permission to reset passwords." };
    const parsed = resetAccountPasswordSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, message: "Use matching passwords of 8–128 characters." };
    const passwordHash = await hashPassword(parsed.data.password);
    const result = await db.transaction(async (tx) => {
      const [target] = await tx.select({ id: authUsersTable.id }).from(authUsersTable).where(eq(authUsersTable.id, parsed.data.id)).for("update");
      const roles = target ? await tx.select({ role: userRolesTable.role }).from(userRolesTable).where(eq(userRolesTable.userId, target.id)).for("share") : [];
      if (!target || !canManageAccount(user, { ...target, roles: roles.map((item) => item.role) })) {
        return { success: false as const, message: "User not found or you do not have permission to manage this account." };
      }
      const changed = await tx.update(authAccountsTable).set({ passwordHash })
        .where(and(eq(authAccountsTable.userId, target.id), eq(authAccountsTable.provider, "credentials"))).returning({ id: authAccountsTable.id });
      if (!changed.length) return { success: false as const, message: "This account does not use password sign-in." };
      await tx.update(sessionsTable).set({ revokedAt: new Date() }).where(and(eq(sessionsTable.userId, target.id), isNull(sessionsTable.revokedAt)));
      return { success: true as const, data: { id: target.id } };
    });
    if (result.success) console.info("resetAccountPasswordAction", { outcome: "success" });
    return result;
  } catch (error) {
    logAuthError("resetAccountPasswordAction", error);
    return { success: false as const, message: "Unable to reset the password. Please try again." };
  }
}

export async function setAccountStatusAction(input: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageAccounts(user.roles)) return { success: false as const, message: "You do not have permission to change account access." };
    const parsed = setAccountStatusSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, message: "Check the account and status." };
    const result = await db.transaction(async (tx) => {
      const [target] = await tx.select({ id: authUsersTable.id }).from(authUsersTable).where(eq(authUsersTable.id, parsed.data.id)).for("update");
      const roles = target ? await tx.select({ role: userRolesTable.role }).from(userRolesTable).where(eq(userRolesTable.userId, target.id)).for("share") : [];
      if (!target || !canManageAccount(user, { ...target, roles: roles.map((item) => item.role) })) {
        return { success: false as const, message: "User not found or you do not have permission to manage this account." };
      }
      await tx.update(authUsersTable).set({ status: parsed.data.status }).where(eq(authUsersTable.id, target.id));
      if (parsed.data.status === "disabled") {
        await tx.update(sessionsTable).set({ revokedAt: new Date() }).where(and(eq(sessionsTable.userId, target.id), isNull(sessionsTable.revokedAt)));
      }
      return { success: true as const, data: { id: target.id, status: parsed.data.status } };
    });
    if (result.success) console.info("setAccountStatusAction", { outcome: "success", status: result.data.status });
    return result;
  } catch (error) {
    logAuthError("setAccountStatusAction", error);
    return { success: false as const, message: "Unable to change account access. Please try again." };
  }
}
