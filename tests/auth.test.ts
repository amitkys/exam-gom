import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api-postgres";
import * as schema from "../db/schema/schema";
import { eq, sql } from "drizzle-orm";
import { assignmentFacultyTable, assignmentsTable, authAccountsTable, authUsersTable, sessionsTable, userRolesTable } from "../db/schema/schema";
import { loginLimitsTable } from "../db/schema/login-limits";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { createSessionToken, hashToken, isSessionToken } from "../lib/auth/token";
import { loginSchema } from "../app/login/lib/zod-type/login";
import { createAccountSchema } from "../app/dashboard/users/lib/zod-type/account";

// Execute the actual schema and action queries in isolated PostgreSQL. Only the
// framework request cookie jar and production connection are replaced.
const postgres = new PGlite();
const database = drizzle({ client: postgres });
type CookieOptions = { httpOnly?: boolean; secure?: boolean; sameSite?: string; path?: string; maxAge?: number; expires?: Date };
const jar = new Map<string, { value: string; options: CookieOptions }>();
mock.module("server-only", () => ({}));
mock.module("@/db", () => ({ db: database }));
mock.module("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => jar.get(name),
    set: (name: string, value: string, options: CookieOptions) => {
      if (options.maxAge === 0) jar.delete(name);
      else jar.set(name, { value, options });
    },
  }),
}));
const { loginAction } = await import("../app/login/lib/action");
const { logoutAction } = await import("../app/dashboard/lib/action");
const { createAccountAction, getUsersAction, resetAccountPasswordAction, setAccountStatusAction } = await import("../app/dashboard/users/lib/action");
const { createFirstSuperadmin } = await import("../app/dashboard/users/lib/provision-account");
const { getCurrentUser, createSession } = await import("../lib/auth/session");
const { consumeLoginAttempt } = await import("../lib/auth/login-limit");
const { createAssignmentAction, searchFacultyAction } = await import("../app/dashboard/assignments/new/lib/action");
const { getAssignmentAction } = await import("../app/dashboard/assignments/[id]/lib/action");
const { getAssignmentsAction } = await import("../app/dashboard/assignments/lib/action");

const password = "correct horse battery staple";
let passwordHash: string;
const accountInput = { name: "New Member", email: "member@example.com", password, role: "faculty" } as const;

beforeAll(async () => {
  const schemaPush = await pushSchema(schema, database);
  await schemaPush.apply();
  passwordHash = await hashPassword(password);
}, 30000);

beforeEach(async () => {
  jar.clear();
  await database.execute(sql`truncate auth_users, auth_accounts, auth_sessions, user_roles, auth_login_limits cascade`);
});

describe("assignment creation and access", () => {
  async function seedFaculty(name = "Faculty Member", status: "active" | "disabled" = "active") {
    const [user] = await database.insert(authUsersTable).values({ name, status, email: `${crypto.randomUUID()}@example.com` }).returning();
    if (!user) throw new Error("Faculty seed failed");
    await database.insert(userRolesTable).values({ userId: user.id, role: "faculty" });
    return user;
  }

  const assignmentInput = (facultyIds: string[]) => ({ title: "  Mathematics  ", instructions: "  Prepare five questions.\nCover units 1–3.  ", facultyIds });
  const listInput = { search: "", page: 1, limit: 20 };

  test("lists only the current controller's assignments with bounded previews and faculty counts", async () => {
    const controller = await seedUser("exam_controller");
    const first = await seedFaculty("First Faculty");
    const second = await seedFaculty("Second Faculty");
    const ownId = crypto.randomUUID();
    const otherId = crypto.randomUUID();
    await database.insert(assignmentsTable).values([
      { id: ownId, controllerId: controller.id, title: "Own assignment", instructions: "x".repeat(300) },
      { id: otherId, controllerId: first.id, title: "Other controller assignment", instructions: "Private instructions" },
    ]);
    await database.insert(assignmentFacultyTable).values([
      { assignmentId: ownId, facultyId: first.id }, { assignmentId: ownId, facultyId: second.id },
    ]);
    await createSession(controller.id);
    const result = await getAssignmentsAction(listInput);
    if (!result.success) throw new Error(result.message);
    expect(result.data.pagination.total).toBe(1);
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]).toMatchObject({ id: ownId, title: "Own assignment", facultyCount: 2, instructionsPreview: "x".repeat(160) });
    expect(result.data.items[0]).not.toHaveProperty("controllerId");
    expect(result.data.items[0]).not.toHaveProperty("instructions");
    expect(JSON.stringify(result.data)).not.toContain(otherId);
  });

  test("searches assignment titles literally and paginates newest first", async () => {
    const controller = await seedUser("exam_controller");
    const rows = await database.insert(assignmentsTable).values([
      { controllerId: controller.id, title: "Mathematics %_", instructions: "First", createdAt: new Date("2026-01-01T00:00:00Z") },
      { controllerId: controller.id, title: "Mathematics revision", instructions: "Second", createdAt: new Date("2026-01-02T00:00:00Z") },
      { controllerId: controller.id, title: "History", instructions: "Third", createdAt: new Date("2026-01-03T00:00:00Z") },
    ]).returning();
    await createSession(controller.id);
    const firstPage = await getAssignmentsAction({ ...listInput, limit: 2 });
    if (!firstPage.success) throw new Error(firstPage.message);
    expect(firstPage.data.pagination).toEqual({ total: 3, page: 1, limit: 2, totalPages: 2 });
    expect(firstPage.data.items.map((item) => item.title)).toEqual(["History", "Mathematics revision"]);
    const lastPage = await getAssignmentsAction({ ...listInput, page: 99, limit: 2 });
    if (!lastPage.success) throw new Error(lastPage.message);
    expect(lastPage.data.pagination.page).toBe(2);
    expect(lastPage.data.items[0]?.id).toBe(rows[0]?.id);
    const literal = await getAssignmentsAction({ ...listInput, search: "%_" });
    if (!literal.success) throw new Error(literal.message);
    expect(literal.data.items.map((item) => item.title)).toEqual(["Mathematics %_"]);
    const matching = await getAssignmentsAction({ ...listInput, search: " MATHEMATICS " });
    expect(matching.success && matching.data.pagination.total).toBe(2);
    const empty = await getAssignmentsAction({ ...listInput, search: "missing" });
    expect(empty.success && empty.data.items.length).toBe(0);
  });

  test("validates assignment list inputs and handles a controller with no assignments", async () => {
    const controller = await seedUser("exam_controller");
    await createSession(controller.id);
    for (const input of [null, { ...listInput, page: 0 }, { ...listInput, limit: 51 },
      { ...listInput, search: "x".repeat(101) }, { ...listInput, controllerId: crypto.randomUUID() }]) {
      expect((await getAssignmentsAction(input)).success).toBe(false);
    }
    expect(await getAssignmentsAction(listInput)).toEqual({ success: true, data: { items: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } } });
  });

  test("requires an authenticated controller for every assignment action", async () => {
    const input = assignmentInput([crypto.randomUUID()]);
    expect((await createAssignmentAction(input)).success).toBe(false);
    expect((await searchFacultyAction({ search: "" })).success).toBe(false);
    expect((await getAssignmentAction(crypto.randomUUID())).success).toBe(false);
    expect((await getAssignmentsAction(listInput)).success).toBe(false);
    for (const role of ["superadmin", "faculty", "reviewer", "paper_setter"] as const) {
      const [user] = await database.insert(authUsersTable).values({ name: role, email: `${role}@example.com` }).returning();
      if (!user) throw new Error("Role seed failed");
      await database.insert(userRolesTable).values({ userId: user.id, role });
      await createSession(user.id);
      expect((await createAssignmentAction(input)).success).toBe(false);
      expect((await searchFacultyAction({ search: "" })).success).toBe(false);
      expect((await getAssignmentAction(crypto.randomUUID())).success).toBe(false);
      expect((await getAssignmentsAction(listInput)).success).toBe(false);
    }
    expect(await database.select().from(assignmentsTable)).toHaveLength(0);
  });

  test("saves an assignment and all faculty atomically with the session owner", async () => {
    const controller = await seedUser("exam_controller");
    const first = await seedFaculty("First Faculty");
    const second = await seedFaculty("Second Faculty");
    await createSession(controller.id);
    const result = await createAssignmentAction(assignmentInput([first.id, second.id]));
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.message);
    const [assignment] = await database.select().from(assignmentsTable);
    expect(assignment).toMatchObject({ id: result.data.id, controllerId: controller.id, title: "Mathematics", instructions: "Prepare five questions.\nCover units 1–3." });
    expect(await database.select().from(assignmentFacultyTable)).toHaveLength(2);
    const details = await getAssignmentAction(result.data.id);
    expect(details.success).toBe(true);
    if (!details.success || !details.data) throw new Error("Missing assignment details");
    expect(details.data.faculty.map(({ id }) => id)).toEqual([first.id, second.id]);
    expect(details.data).not.toHaveProperty("controllerId");
  });

  test("rejects invalid, oversized, duplicate, and forged assignment payloads", async () => {
    const controller = await seedUser("exam_controller");
    const faculty = await seedFaculty();
    await createSession(controller.id);
    const valid = assignmentInput([faculty.id]);
    for (const input of [null, {}, { ...valid, title: "   " }, { ...valid, instructions: " " },
      { ...valid, title: "x".repeat(201) }, { ...valid, instructions: "x".repeat(10001) },
      { ...valid, facultyIds: [] }, { ...valid, facultyIds: ["bad"] },
      { ...valid, facultyIds: [faculty.id, faculty.id] }, { ...valid, facultyIds: Array.from({ length: 51 }, () => crypto.randomUUID()) },
      { ...valid, controllerId: faculty.id }, { ...valid, status: "accepted" }]) {
      expect((await createAssignmentAction(input)).success).toBe(false);
    }
    expect(await database.select().from(assignmentsTable)).toHaveLength(0);
    expect(await database.select().from(assignmentFacultyTable)).toHaveLength(0);
  });

  test("rejects missing, disabled, non-faculty, and newly ineligible members without partial data", async () => {
    const controller = await seedUser("exam_controller");
    const active = await seedFaculty();
    const disabled = await seedFaculty("Disabled", "disabled");
    const revoked = await seedFaculty("Revoked");
    await database.delete(userRolesTable).where(eq(userRolesTable.userId, revoked.id));
    await createSession(controller.id);
    for (const unavailable of [crypto.randomUUID(), disabled.id, controller.id, revoked.id]) {
      expect((await createAssignmentAction(assignmentInput([active.id, unavailable]))).success).toBe(false);
    }
    expect(await database.select().from(assignmentsTable)).toHaveLength(0);
    expect(await database.select().from(assignmentFacultyTable)).toHaveLength(0);
  });

  test("bounds faculty search and matches literal case-insensitive names and emails", async () => {
    const controller = await seedUser("exam_controller");
    const literal = await seedFaculty("Literal %_ Faculty");
    await seedFaculty("Disabled %_ Faculty", "disabled");
    for (let index = 0; index < 22; index++) await seedFaculty(`Member ${index}`);
    await createSession(controller.id);
    const results = await searchFacultyAction({ search: "" });
    expect(results.success).toBe(true);
    if (!results.success) throw new Error(results.message);
    expect(results.data.items).toHaveLength(20);
    expect(results.data.hasMore).toBe(true);
    const matches = await searchFacultyAction({ search: "%_" });
    expect(matches.success).toBe(true);
    if (!matches.success) throw new Error(matches.message);
    expect(matches.data.items.map(({ id }) => id)).toEqual([literal.id]);
    const byEmail = await searchFacultyAction({ search: literal.email.toUpperCase() });
    expect(byEmail.success && byEmail.data.items[0]?.id).toBe(literal.id);
    expect((await searchFacultyAction({ search: "x".repeat(101) })).success).toBe(false);
  });

  test("prevents other controllers and assigned faculty from reading an assignment", async () => {
    const owner = await seedUser("exam_controller");
    const member = await seedFaculty();
    await createSession(owner.id);
    const created = await createAssignmentAction(assignmentInput([member.id]));
    if (!created.success) throw new Error(created.message);
    const [other] = await database.insert(authUsersTable).values({ name: "Other Controller", email: "other@example.com" }).returning();
    if (!other) throw new Error("Controller seed failed");
    await database.insert(userRolesTable).values({ userId: other.id, role: "exam_controller" });
    await createSession(other.id);
    expect(await getAssignmentAction(created.data.id)).toEqual({ success: true, data: null });
    expect(await getAssignmentAction("invalid")).toEqual({ success: true, data: null });
    expect(await getAssignmentAction(crypto.randomUUID())).toEqual({ success: true, data: null });
    await createSession(member.id);
    expect((await getAssignmentAction(created.data.id)).success).toBe(false);
  });

  test("enforces current controller privileges, account status, and session revocation", async () => {
    const controller = await seedUser("exam_controller");
    const member = await seedFaculty();
    await createSession(controller.id);
    const created = await createAssignmentAction(assignmentInput([member.id]));
    if (!created.success) throw new Error(created.message);
    const checkDenied = async () => {
      expect((await createAssignmentAction(assignmentInput([member.id]))).success).toBe(false);
      expect((await searchFacultyAction({ search: "" })).success).toBe(false);
      expect((await getAssignmentAction(created.data.id)).success).toBe(false);
      expect((await getAssignmentsAction(listInput)).success).toBe(false);
    };
    await database.delete(userRolesTable).where(eq(userRolesTable.userId, controller.id));
    await checkDenied();
    await database.insert(userRolesTable).values({ userId: controller.id, role: "exam_controller" });
    await database.update(authUsersTable).set({ status: "disabled" }).where(eq(authUsersTable.id, controller.id));
    await checkDenied();
    await database.update(authUsersTable).set({ status: "active" }).where(eq(authUsersTable.id, controller.id));
    await database.update(sessionsTable).set({ revokedAt: new Date() });
    await checkDenied();
  });

  test("rolls back an assignment when membership insertion fails and redacts logs", async () => {
    const controller = await seedUser("exam_controller");
    const member = await seedFaculty();
    await createSession(controller.id);
    await postgres.exec(`create function reject_assignment_member() returns trigger language plpgsql as $$ begin raise exception 'membership insert failure'; end $$;
      create trigger reject_assignment_member before insert on exam_assignment_faculty for each row execute function reject_assignment_member();`);
    const logged = mock(() => {});
    const originalError = console.error;
    console.error = logged;
    try {
      expect((await createAssignmentAction(assignmentInput([member.id]))).success).toBe(false);
      expect(await database.select().from(assignmentsTable)).toHaveLength(0);
      expect(await database.select().from(assignmentFacultyTable)).toHaveLength(0);
      const output = JSON.stringify(logged.mock.calls);
      expect(output).toContain("createAssignmentAction error");
      expect(output).not.toContain(member.id);
      expect(output).not.toContain("Mathematics");
    } finally {
      console.error = originalError;
      await postgres.exec("drop trigger reject_assignment_member on exam_assignment_faculty; drop function reject_assignment_member();");
    }
  });
});
afterAll(async () => postgres.close());

async function seedUser(role: typeof userRolesTable.$inferInsert.role = "faculty") {
  const [user] = await database.insert(authUsersTable).values({ name: "Test Member", email: "test@example.com" }).returning();
  if (!user) throw new Error("User seed failed");
  await database.insert(authAccountsTable).values({ userId: user.id, provider: "credentials", providerAccountId: user.email, passwordHash });
  await database.insert(userRolesTable).values({ userId: user.id, role });
  return user;
}

describe("passwords, inputs, and tokens", () => {
  test("salts passwords, verifies exact input, and rejects malformed hashes", async () => {
    expect(await verifyPassword(password, passwordHash)).toBe(true);
    expect(await verifyPassword(`${password} `, passwordHash)).toBe(false);
    expect(await hashPassword(password)).not.toBe(passwordHash);
    expect(await verifyPassword(password, "scrypt-v1$bad$bad")).toBe(false);
    expect(await verifyPassword(password, `${passwordHash}$extra`)).toBe(false);
  });

  test("normalizes email without trimming passwords", () => {
    const parsed = loginSchema.parse({ email: " TEST@EXAMPLE.COM ", password: " secret " });
    expect(parsed).toEqual({ email: "test@example.com", password: " secret " });
    expect(loginSchema.safeParse({ email: "bad", password }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "test@example.com", password: "x".repeat(129) }).success).toBe(false);
    expect(createAccountSchema.safeParse({ ...accountInput, password: "1234567" }).success).toBe(false);
    expect(createAccountSchema.safeParse({ ...accountInput, password: "12345678" }).success).toBe(true);
    expect(createAccountSchema.safeParse({ ...accountInput, role: "owner" }).success).toBe(false);
  });

  test("creates random valid tokens and stores deterministic hashes", () => {
    const token = createSessionToken();
    expect(isSessionToken(token)).toBe(true);
    expect(createSessionToken()).not.toBe(token);
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).not.toBe(token);
    expect(isSessionToken("invalid")).toBe(false);
  });
});

describe("sign-in and session lifecycle", () => {
  test("signs in, stores only a token hash, and reads current roles", async () => {
    const user = await seedUser();
    const result = await loginAction({ email: " TEST@EXAMPLE.COM ", password });
    expect(result.success).toBe(true);
    const cookie = jar.get("exam-session");
    expect(cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 43200 });
    const [session] = await database.select().from(sessionsTable);
    expect(session?.tokenHash).toBe(hashToken(cookie?.value ?? ""));
    expect(await getCurrentUser()).toEqual({ id: user.id, name: user.name, email: user.email, roles: ["faculty"] });
    await database.insert(userRolesTable).values({ userId: user.id, role: "reviewer" });
    expect((await getCurrentUser())?.roles).toContain("reviewer");
  });

  test("unknown, disabled, and incorrect credentials share the same failure", async () => {
    const user = await seedUser();
    const wrong = await loginAction({ email: user.email, password: "wrong" });
    const unknown = await loginAction({ email: "unknown@example.com", password });
    await database.update(authUsersTable).set({ status: "disabled" }).where(eq(authUsersTable.id, user.id));
    const disabled = await loginAction({ email: user.email, password });
    expect(wrong).toEqual({ success: false, message: "Email or password is incorrect." });
    expect(unknown).toEqual(wrong);
    expect(disabled).toEqual(wrong);
    expect(jar.size).toBe(0);
    expect(await database.select().from(sessionsTable)).toHaveLength(0);
  });

  test("rejects malformed payloads before writing a login limit", async () => {
    expect((await loginAction({ email: "bad", password: "" })).success).toBe(false);
    expect(await database.select().from(loginLimitsTable)).toHaveLength(0);
  });

  test("rejects disabled users, expired sessions, and revoked sessions", async () => {
    const user = await seedUser();
    await createSession(user.id);
    await database.update(authUsersTable).set({ status: "disabled" });
    expect(await getCurrentUser()).toBeNull();
    await database.update(authUsersTable).set({ status: "active" });
    await database.update(sessionsTable).set({
      createdAt: new Date(Date.now() - 120000), expiresAt: new Date(Date.now() - 60000),
    });
    expect(await getCurrentUser()).toBeNull();
    await database.update(sessionsTable).set({ expiresAt: new Date(Date.now() + 60000), revokedAt: new Date() });
    expect(await getCurrentUser()).toBeNull();
  });

  test("logout revokes the database session and clears its cookie", async () => {
    const user = await seedUser();
    await createSession(user.id);
    const token = jar.get("exam-session")?.value;
    expect((await logoutAction()).success).toBe(true);
    expect(jar.size).toBe(0);
    const [session] = await database.select().from(sessionsTable);
    expect(session?.revokedAt).toBeInstanceOf(Date);
    if (!token) throw new Error("Missing test token");
    jar.set("exam-session", { value: token, options: {} });
    expect(await getCurrentUser()).toBeNull();
  });

  test("sign-in rotates an existing browser session", async () => {
    const user = await seedUser();
    await createSession(user.id);
    const oldToken = jar.get("exam-session")?.value;
    await createSession(user.id);
    expect(jar.get("exam-session")?.value).not.toBe(oldToken);
    const sessions = await database.select().from(sessionsTable);
    expect(sessions).toHaveLength(2);
    expect(sessions.filter((session) => session.revokedAt)).toHaveLength(1);
  });

  test("missing and malformed cookies do not authenticate", async () => {
    expect(await getCurrentUser()).toBeNull();
    jar.set("exam-session", { value: "malformed", options: {} });
    expect(await getCurrentUser()).toBeNull();
  });
});

describe("persistent sign-in limits", () => {
  test("caps concurrent attempts, hides emails, and resets after the window", async () => {
    const attempts = await Promise.all(Array.from({ length: 10 }, () => consumeLoginAttempt("test@example.com")));
    expect(attempts.filter(Boolean)).toHaveLength(5);
    const [limit] = await database.select().from(loginLimitsTable);
    expect(limit?.key).toBe(hashToken("test@example.com"));
    await database.update(loginLimitsTable).set({ resetsAt: new Date(Date.now() - 1000) });
    expect(await consumeLoginAttempt("test@example.com")).toBe(true);
    expect(await consumeLoginAttempt("another@example.com")).toBe(true);
  });

  test("the login action enforces the limit before password verification", async () => {
    const user = await seedUser();
    for (let i = 0; i < 5; i++) await consumeLoginAttempt(user.email);
    expect(await loginAction({ email: user.email, password })).toEqual({
      success: false, message: "Too many sign-in attempts. Please try again in 15 minutes.",
    });
    expect(jar.size).toBe(0);
  });
});

describe("account provisioning", () => {
  test("rejects unauthenticated and ordinary members, including forged roles", async () => {
    expect((await createAccountAction(accountInput)).success).toBe(false);
    const user = await seedUser();
    await createSession(user.id);
    expect((await createAccountAction(accountInput)).success).toBe(false);
    expect(await database.select().from(authUsersTable)).toHaveLength(1);
  });

  test.each(createAccountSchema.shape.role.options)("creates an account with the %s role atomically", async (role) => {
    const admin = await seedUser("superadmin");
    await createSession(admin.id);
    const result = await createAccountAction({ ...accountInput, role, email: " MEMBER@EXAMPLE.COM " });
    expect(result.success).toBe(true);
    const [account] = await database.select().from(authAccountsTable).where(eq(authAccountsTable.providerAccountId, accountInput.email));
    expect(account?.passwordHash).not.toBe(password);
    expect(await verifyPassword(password, account?.passwordHash ?? "")).toBe(true);
    jar.clear();
    expect((await loginAction({ email: accountInput.email, password })).success).toBe(true);
    expect((await getCurrentUser())?.roles).toEqual([role]);
  });

  test("rejects superadmin creation through the action even for a signed-in superadmin", async () => {
    const admin = await seedUser("superadmin");
    await createSession(admin.id);
    const forgedInput = { ...accountInput, role: "superadmin" };
    expect((await createAccountAction(forgedInput)).success).toBe(false);
    expect(await database.select().from(authUsersTable)).toHaveLength(1);
    expect(await database.select().from(userRolesTable)).toHaveLength(1);
  });

  test("rejects duplicate emails without partial account data", async () => {
    const admin = await seedUser("superadmin");
    await createSession(admin.id);
    expect((await createAccountAction({ ...accountInput, email: admin.email })).success).toBe(false);
    expect(await database.select().from(authUsersTable)).toHaveLength(1);
    expect(await database.select().from(authAccountsTable)).toHaveLength(1);
  });

  test("rejects revoked administrator privileges immediately", async () => {
    const admin = await seedUser("superadmin");
    await createSession(admin.id);
    await database.delete(userRolesTable);
    expect((await createAccountAction(accountInput)).success).toBe(false);
  });

  test("rolls back provisioning when a credential identity conflicts", async () => {
    const admin = await seedUser("superadmin");
    await createSession(admin.id);
    await database.insert(authAccountsTable).values({
      userId: admin.id, provider: "credentials", providerAccountId: accountInput.email, passwordHash,
    });
    const logged = mock(() => {});
    const originalError = console.error;
    console.error = logged;
    try {
      expect((await createAccountAction(accountInput)).success).toBe(false);
      expect(await database.select().from(authUsersTable)).toHaveLength(1);
      expect(await database.select().from(userRolesTable)).toHaveLength(1);
      const output = JSON.stringify(logged.mock.calls);
      expect(output).toContain("createAccountAction error");
      expect(output).not.toContain(accountInput.email);
      expect(output).not.toContain(password);
    } finally {
      console.error = originalError;
    }
  });

  test("bootstrap creates only the first superadmin", async () => {
    expect((await createFirstSuperadmin(accountInput)).success).toBe(true);
    expect((await createFirstSuperadmin({ ...accountInput, email: "another@example.com" })).success).toBe(false);
    expect(await database.select().from(authUsersTable)).toHaveLength(1);
    expect((await database.select().from(userRolesTable))[0]?.role).toBe("superadmin");
  });
});

describe("user management", () => {
  const listInput = { search: "", status: "all", page: 1, limit: 20 } as const;
  const newPassword = "replacement password for member";
  async function seedMember(role: typeof userRolesTable.$inferInsert.role = "faculty", name = "Managed Member") {
    const [user] = await database.insert(authUsersTable).values({ name, email: `${crypto.randomUUID()}@example.com` }).returning();
    if (!user) throw new Error("Member seed failed");
    await database.insert(userRolesTable).values({ userId: user.id, role });
    await database.insert(authAccountsTable).values({ userId: user.id, provider: "credentials", providerAccountId: user.email, passwordHash });
    return user;
  }
  const resetInput = (id: string) => ({ id, password: newPassword, confirmPassword: newPassword });

  test("denies user management without an active manager session", async () => {
    expect((await getUsersAction(listInput)).success).toBe(false);
    expect((await resetAccountPasswordAction(resetInput(crypto.randomUUID()))).success).toBe(false);
    expect((await setAccountStatusAction({ id: crypto.randomUUID(), status: "disabled" })).success).toBe(false);
    for (const role of ["faculty", "reviewer", "paper_setter"] as const) {
      const member = await seedMember(role);
      await createSession(member.id);
      expect((await getUsersAction(listInput)).success).toBe(false);
      expect((await resetAccountPasswordAction(resetInput(member.id))).success).toBe(false);
      expect((await setAccountStatusAction({ id: member.id, status: "disabled" })).success).toBe(false);
    }
  });

  test.each(["superadmin", "exam_controller"] as const)("lets %s view all existing accounts without credential fields", async (role) => {
    const manager = await seedUser(role);
    const faculty = await seedMember();
    const other = await seedMember("exam_controller");
    await createSession(manager.id);
    const result = await getUsersAction(listInput);
    if (!result.success) throw new Error(result.message);
    expect(result.data.pagination.total).toBe(3);
    expect(result.data.items.map((item) => item.id).sort()).toEqual([manager.id, faculty.id, other.id].sort());
    expect(result.data.items.find((item) => item.id === manager.id)?.canManage).toBe(false);
    expect(result.data.items.find((item) => item.id === faculty.id)?.canManage).toBe(true);
    expect(result.data.items.find((item) => item.id === other.id)?.canManage).toBe(role === "superadmin");
    for (const item of result.data.items) {
      expect(item).not.toHaveProperty("passwordHash");
      expect(item).not.toHaveProperty("tokenHash");
    }
  });

  test("filters names and statuses, escapes literal searches, and bounds pagination", async () => {
    const manager = await seedUser("superadmin");
    const member = await seedMember("faculty", "Literal %_ Member");
    await database.update(authUsersTable).set({ status: "disabled" }).where(eq(authUsersTable.id, member.id));
    await createSession(manager.id);
    const matched = await getUsersAction({ ...listInput, search: "%_", status: "disabled" });
    if (!matched.success) throw new Error(matched.message);
    expect(matched.data.items.map((item) => item.id)).toEqual([member.id]);
    const page = await getUsersAction({ ...listInput, page: 99, limit: 1 });
    if (!page.success) throw new Error(page.message);
    expect(page.data.pagination).toMatchObject({ total: 2, page: 2, limit: 1, totalPages: 2 });
    expect(page.data.items).toHaveLength(1);
    const empty = await getUsersAction({ ...listInput, search: "no matching user" });
    expect(empty.success && empty.data.items.length).toBe(0);
    for (const input of [{ ...listInput, limit: 51 }, { ...listInput, page: 0 }, { ...listInput, search: "x".repeat(101) }, { ...listInput, status: "anything" }]) {
      expect((await getUsersAction(input)).success).toBe(false);
    }
  });

  test("allows controller provisioning of ordinary roles and rejects privilege escalation", async () => {
    const controller = await seedUser("exam_controller");
    await createSession(controller.id);
    for (const role of ["faculty", "reviewer", "paper_setter"] as const) {
      expect((await createAccountAction({ ...accountInput, role, email: `${role}@example.com` })).success).toBe(true);
    }
    for (const role of ["superadmin", "exam_controller"]) {
      expect((await createAccountAction({ ...accountInput, role, email: `${role}@example.com` })).success).toBe(false);
    }
    expect(await database.select().from(authUsersTable)).toHaveLength(4);
  });

  test("resets another user's password, revokes sessions, and rejects stale verified credentials", async () => {
    const manager = await seedUser("exam_controller");
    const member = await seedMember();
    await createSession(member.id);
    const oldToken = jar.get("exam-session")?.value;
    jar.clear();
    await createSession(manager.id);
    expect((await resetAccountPasswordAction(resetInput(member.id))).success).toBe(true);
    const [account] = await database.select().from(authAccountsTable).where(eq(authAccountsTable.userId, member.id));
    expect(await verifyPassword(newPassword, account?.passwordHash ?? "")).toBe(true);
    expect(await verifyPassword(password, account?.passwordHash ?? "")).toBe(false);
    jar.clear();
    if (!oldToken) throw new Error("Missing old session");
    jar.set("exam-session", { value: oldToken, options: {} });
    expect(await getCurrentUser()).toBeNull();
    jar.clear();
    expect(await createSession(member.id, passwordHash)).toBe(false);
    expect(jar.size).toBe(0);
    expect((await loginAction({ email: member.email, password })).success).toBe(false);
    expect((await loginAction({ email: member.email, password: newPassword })).success).toBe(true);
  });

  test("disabling revokes sessions; enabling requires a fresh sign-in", async () => {
    const manager = await seedUser("superadmin");
    const member = await seedMember("exam_controller");
    await createSession(member.id);
    const token = jar.get("exam-session")?.value;
    jar.clear();
    await createSession(manager.id);
    expect((await setAccountStatusAction({ id: member.id, status: "disabled" })).success).toBe(true);
    expect(await createSession(member.id, passwordHash)).toBe(false);
    jar.clear();
    await createSession(manager.id);
    expect((await setAccountStatusAction({ id: member.id, status: "active" })).success).toBe(true);
    jar.clear();
    if (!token) throw new Error("Missing session token");
    jar.set("exam-session", { value: token, options: {} });
    expect(await getCurrentUser()).toBeNull();
    expect((await loginAction({ email: member.email, password })).success).toBe(true);
  });

  test("controllers cannot manage privileged accounts or themselves, including mixed-role accounts", async () => {
    const manager = await seedUser("exam_controller");
    const admin = await seedMember("superadmin");
    const controller = await seedMember("exam_controller");
    await database.insert(userRolesTable).values({ userId: admin.id, role: "faculty" });
    await createSession(manager.id);
    for (const target of [manager, admin, controller, { id: crypto.randomUUID() }]) {
      expect((await resetAccountPasswordAction(resetInput(target.id))).success).toBe(false);
      expect((await setAccountStatusAction({ id: target.id, status: "disabled" })).success).toBe(false);
    }
    await createSession(admin.id);
    expect((await resetAccountPasswordAction(resetInput(admin.id))).success).toBe(false);
    expect((await setAccountStatusAction({ id: admin.id, status: "disabled" })).success).toBe(false);
  });

  test("validates reset payloads and does not re-enable disabled users", async () => {
    const manager = await seedUser("superadmin");
    const member = await seedMember();
    await database.update(authUsersTable).set({ status: "disabled" }).where(eq(authUsersTable.id, member.id));
    await createSession(manager.id);
    for (const input of [{ ...resetInput(member.id), confirmPassword: "different" }, { ...resetInput(member.id), password: "short", confirmPassword: "short" },
      { ...resetInput(member.id), password: "x".repeat(129), confirmPassword: "x".repeat(129) }, { ...resetInput(member.id), roles: ["superadmin"] }]) {
      expect((await resetAccountPasswordAction(input)).success).toBe(false);
    }
    expect((await resetAccountPasswordAction(resetInput(member.id))).success).toBe(true);
    const [target] = await database.select().from(authUsersTable).where(eq(authUsersTable.id, member.id));
    expect(target?.status).toBe("disabled");
    expect((await loginAction({ email: member.email, password: newPassword })).success).toBe(false);
  });

  test("checks live manager roles and status on every operation", async () => {
    const manager = await seedUser("exam_controller");
    const member = await seedMember();
    await createSession(manager.id);
    await database.delete(userRolesTable).where(eq(userRolesTable.userId, manager.id));
    const denied = async () => {
      expect((await getUsersAction(listInput)).success).toBe(false);
      expect((await resetAccountPasswordAction(resetInput(member.id))).success).toBe(false);
      expect((await setAccountStatusAction({ id: member.id, status: "disabled" })).success).toBe(false);
    };
    await denied();
    await database.insert(userRolesTable).values({ userId: manager.id, role: "exam_controller" });
    await database.update(authUsersTable).set({ status: "disabled" }).where(eq(authUsersTable.id, manager.id));
    await denied();
  });

  test("rolls back password and status changes if session revocation fails", async () => {
    const manager = await seedUser("superadmin");
    const member = await seedMember();
    await createSession(member.id);
    jar.clear();
    await createSession(manager.id);
    await postgres.exec(`create function reject_session_revocation() returns trigger language plpgsql as $$ begin raise exception 'revocation failed'; end $$;
      create trigger reject_session_revocation before update on auth_sessions for each row execute function reject_session_revocation();`);
    const originalError = console.error;
    const logged = mock(() => {});
    console.error = logged;
    try {
      expect((await resetAccountPasswordAction(resetInput(member.id))).success).toBe(false);
      expect((await setAccountStatusAction({ id: member.id, status: "disabled" })).success).toBe(false);
      const [account] = await database.select().from(authAccountsTable).where(eq(authAccountsTable.userId, member.id));
      const [target] = await database.select().from(authUsersTable).where(eq(authUsersTable.id, member.id));
      expect(account?.passwordHash).toBe(passwordHash);
      expect(target?.status).toBe("active");
      const output = JSON.stringify(logged.mock.calls);
      expect(output).not.toContain(newPassword);
      expect(output).not.toContain(member.email);
    } finally {
      console.error = originalError;
      await postgres.exec("drop trigger reject_session_revocation on auth_sessions; drop function reject_session_revocation();");
    }
  });
});
