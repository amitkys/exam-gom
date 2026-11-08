# Authentication schema

One user can have multiple roles and multiple login providers. Separate role-specific
login screens can share these tables.

| Table | Purpose |
| --- | --- |
| `auth_users` | Auth user profile with UUID, name, email, account status, and creation/update timestamps |
| `user_roles` | Superadmin, exam controller, faculty, reviewer, and paper setter roles; unique per user/role |
| `auth_accounts` | Login identities, unique per provider/account ID; password hashes for the `credentials` provider |
| `auth_sessions` | Hashed session tokens, expiration, and revocation |
| `auth_login_limits` | Shared per-email sign-in attempt limits with hashed keys |

The dummy user/post schemas and their example seed script have been removed.
Assignment creation adds `exam_assignments` (controller-owned title and
instructions) and `exam_assignment_faculty` (unique membership per assignment
and faculty). See [assignment workflow](../../docs/assignments.md) for permissions,
limits, and schema setup. Question, paper, and review-job tables are
not included yet.

## Authentication rules

- Normalize email addresses before saving or looking them up. Provider account IDs
  must use the provider's canonical identifier; use normalized email for credentials.
- Store only secure password hashes and session token hashes in the database.
  Never store plaintext passwords or raw session tokens.
- On login and on every authenticated request, require an active user and an
  unrevoked, unexpired session. Look up current roles server-side.
- Withdrawing all login access means disabling the user and revoking their sessions
  in one transaction. Login must reject disabled accounts even with valid credentials.
- Grant roles only through an authorized manager or a trusted initial setup.
  Controllers can provision ordinary exam roles; only superadmins can provision
  controllers. The UI cannot create superadmins.
  Having a valid login does not itself grant an exam role.
- Assignment creation records selected active faculty; it does not implement
  faculty editing or submission-triggered lockout yet. Global account status is
  not assignment-specific.
- The implemented Server Action flow, setup, and deferred invitations are described
  in [docs/authentication.md](../../docs/authentication.md). `$onUpdate` runs on
  Drizzle updates, not raw SQL writes.
