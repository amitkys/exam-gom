import { sql } from "drizzle-orm";
import { check, index, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { accountStatusEnum, userRoleEnum } from "./enums";

export const authUsersTable = pgTable("auth_users", {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    // Normalize emails before writes and lookups; this uniqueness check is case-sensitive.
    email: text().notNull().unique(),
    // Auth checks must reject disabled users even if their sessions are still valid.
    status: accountStatusEnum().default("active").notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    // Drizzle maintains this on updates; raw SQL writers must set it explicitly.
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull()
        .$onUpdate(() => new Date()),
});

// A user can hold multiple roles; the composite key prevents duplicate grants.
// Deleting a user also removes their roles, login identities, and sessions.
export const userRolesTable = pgTable("user_roles", {
    userId: uuid().notNull().references(() => authUsersTable.id, { onDelete: "cascade" }),
    role: userRoleEnum().notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.role] })]);

// Supports multiple login providers without duplicating the person/account.
export const authAccountsTable = pgTable("auth_accounts", {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid().notNull().references(() => authUsersTable.id, { onDelete: "cascade" }),
    provider: text().notNull(),
    // Use the provider's stable user ID, or normalized email for credentials login.
    providerAccountId: text().notNull(),
    // Store a secure password hash, never the plaintext password.
    passwordHash: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    // A provider identity must belong to only one local user.
    unique("auth_provider_account_unique").on(t.provider, t.providerAccountId),
    index("auth_accounts_user_idx").on(t.userId),
    // Credentials accounts require a hash; other providers must leave it NULL.
    check("password_provider_hash", sql`(${t.provider} = 'credentials') = (${t.passwordHash} IS NOT NULL)`),
]);

export const sessionsTable = pgTable("auth_sessions", {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid().notNull().references(() => authUsersTable.id, { onDelete: "cascade" }),
    // Hash the bearer token before storing it; the raw token stays with the client.
    tokenHash: text().notNull().unique(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    // On every authenticated request, application code must check expiry and revocation.
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
}, (t) => [
    index("sessions_user_idx").on(t.userId),
    index("sessions_expiry_idx").on(t.expiresAt),
    check("session_expiry_valid", sql`${t.expiresAt} > ${t.createdAt}`),
]);
