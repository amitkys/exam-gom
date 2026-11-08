# Authentication

Email/password authentication uses Next.js Server Actions and database sessions.
Public registration is closed. The first superadmin is created only through the
terminal bootstrap command. Active superadmins can create exam controllers,
faculty, reviewers, and paper setters. Exam controllers can create faculty,
reviewers, and paper setters. The UI and its Server Action reject superadmin
creation. Both manager roles can view all users and manage permitted accounts;
see [user management](user-management.md). Invitations and self-service password
recovery are deferred; managers can reset passwords through the workspace.

## Setup

1. Run `bun install` and configure `DATABASE_URL` in the ignored `.env` file.
2. Review the schema before updating a database. The generated
   `drizzle/20261025115542_authentication/migration.sql` is a baseline for a new
   database, including the existing auth tables and new `auth_login_limits`.
   Do not apply it verbatim to a database that already has those tables.
   For the existing development workflow, `bun run db:push` reconciles the schema;
   review its proposed changes before approving them. Schema application requires
   separate authorization; generation does not apply anything.
3. In a trusted interactive terminal, run `bun run auth:create-admin`. Enter the
   first admin's name, email, and a password of 8–128 characters. Password entry
   is hidden and is never accepted through CLI arguments or logged. Setup refuses
   to bootstrap when a superadmin already exists. The command uses the
   `react-server` export condition to load server-only modules outside Next.js.
4. Run `bun run dev`, open `/login`, and sign in. Choose **Users**, then
   **Create account**, to provision additional members and assign a role.

Provisioning writes the user, credential, and role together in one transaction.
Until invitations are implemented, admins assign an initial password and share
it privately. No email is sent. Existing credential hashes must use this
implementation's `scrypt-v1` format.

## Routes and boundaries

| Route | Access |
| --- | --- |
| `/` | Redirects to the workspace, which requires sign-in |
| `/login` | Sign-in form; authenticated visitors continue to `/dashboard` |
| `/dashboard` | Valid session and active account |
| `/dashboard/users` | Current superadmin or exam-controller role; lists all users |
| `/dashboard/users/new` | Current superadmin or exam-controller role; allowed creation roles differ |

Session-dependent components render behind Suspense boundaries to work with
Cache Components. Protected actions independently repeat session and permission
checks. Future protected pages must call `requireUser()` and check their resource
and role permissions; a shared layout is not an authorization boundary.

Dashboard pages share the sidebar demonstrated at `/admin-testing`, with menus
selected from the authenticated user's roles. The live account menu displays the
current user and signs out through the existing action. See
[workspace navigation](navigation.md) for role-specific links and demo behavior.

Forms use React Hook Form, Zod v4, shadcn Field primitives, and TanStack Query
mutations. Authentication boundaries clear query caches and perform full
navigations. Mutation variables containing passwords are discarded when the
submission settles. No shared client store is needed for this flow.

## Security behavior

- Emails are trimmed and lowercased; passwords are preserved exactly.
- Passwords use salted scrypt (`N=16384`, `r=8`, `p=5`), 64-byte keys, and
  constant-time comparison: an [OWASP-listed profile](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- Unknown accounts take a dummy password verification path. Incorrect, unknown,
  and disabled credentials return the same failure message.
- Sessions expire after 12 hours without sliding renewal. Cookies hold random
  256-bit tokens; the database stores only their SHA-256 hashes.
- Cookies are HttpOnly, SameSite=Lax, and path `/`. Production uses Secure and
  the `__Host-` prefix; production hosting must use HTTPS.
- Each authenticated operation reads current account status, roles, session
  expiry, and revocation from the database. Results are not cached across requests.
  Expiry is compared against the database clock to avoid synchronous timestamp
  reads during partial prerendering.
- Login rotates the existing browser session. Logout revokes it before expiring
  the cookie, reporting failure when revocation cannot be saved.
- Password reset and account-disable operations revoke the target's sessions in
  the same transaction as the change. Disabled accounts reject valid cookies.
  Re-enabling an account does not restore revoked sessions. Session creation
  rechecks account status and the verified credential hash under a user-row lock
  so a concurrent old-password login cannot survive a completed reset.
- Next.js's Server Action origin protections remain enabled. Configure allowed
  origins only for trusted reverse proxies; inputs never supply trusted identity.
- Logs contain operation names and error classification only, excluding raw
  database errors, query parameters, passwords, emails, and tokens.

## Limits and housekeeping

`auth_login_limits` permits five attempts per normalized email per 15-minute
window, including unknown emails. Atomic database upserts prevent concurrent
bypasses across instances. Attempts include successful logins and are not cleared
on success. After five attempts, wait for the window to end.

Configure perimeter request limits before deployment to bound traffic across
many email addresses; this limiter is per account, not per IP or global.
Schedule cleanup of expired sessions and expired login-limit rows to bound
retention. Active login-limit windows must remain intact. No cleanup job is
installed by this change.

## Validation

- `bun run test:auth` runs action queries against an isolated PostgreSQL engine
  (PGlite), without using the configured `DATABASE_URL`.
- `bunx tsc --noEmit`, `bun run lint`, and `bun run build` validate types, lint,
  bundling, and Cache Components integration.

Tests cover credentials, normalization, session storage, rotation, replay after
logout, expiry, disabled users, live role changes, concurrent limits, provisioning
permissions, and first-admin setup. Browser navigation and actual framework
cookies need a smoke test against a configured database after schema application.
