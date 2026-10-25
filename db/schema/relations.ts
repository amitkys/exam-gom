import { defineRelations } from 'drizzle-orm';
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
    authUsersTable: {
        roles: r.many.userRolesTable({ from: r.authUsersTable.id, to: r.userRolesTable.userId }),
        accounts: r.many.authAccountsTable({ from: r.authUsersTable.id, to: r.authAccountsTable.userId }),
        sessions: r.many.sessionsTable({ from: r.authUsersTable.id, to: r.sessionsTable.userId }),
    },
    userRolesTable: {
        user: r.one.authUsersTable({ from: r.userRolesTable.userId, to: r.authUsersTable.id }),
    },
    authAccountsTable: {
        user: r.one.authUsersTable({ from: r.authAccountsTable.userId, to: r.authUsersTable.id }),
    },
    sessionsTable: {
        user: r.one.authUsersTable({ from: r.sessionsTable.userId, to: r.authUsersTable.id }),
    },
}));
