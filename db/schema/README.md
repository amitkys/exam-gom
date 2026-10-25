# Authentication schema

One user can have multiple roles and multiple login providers. Separate role-specific
login screens can share these tables.

| Table | Purpose |
| --- | --- |
| `auth_users` | Auth user profile with UUID, name, email, account status, and creation/update timestamps |
| `user_roles` | Exam controller, faculty, reviewer, and paper setter roles; unique per user/role |
| `auth_accounts` | Login identities, unique per provider/account ID; password hashes for the `credentials` provider |
| `auth_sessions` | Hashed session tokens, expiration, and revocation |

The dummy user/post schemas and their example seed script have been removed.
No question, paper, job, or assignment tables are included yet.

## Rules for the future auth implementation

- Normalize email addresses before saving or looking them up. Provider account IDs
  must use the provider's canonical identifier; use normalized email for credentials.
- Store only secure password hashes and session token hashes in the database.
  Never store plaintext passwords or raw session tokens.
- On login and on every authenticated request, require an active user and an
  unrevoked, unexpired session. Look up current roles server-side.
- Withdrawing all login access means disabling the user and revoking their sessions
  in one transaction. Login must reject disabled accounts even with valid credentials.
- Grant roles only through an authorized controller or a trusted initial setup.
  Having a valid login does not itself grant an exam role.
- Access to individual assignments and submission-triggered lockout will be modeled
  with the exam workflow later. Global account status is not assignment-specific.
- These files define storage only; no login endpoints, middleware, or auth provider
  integration is implemented. `$onUpdate` runs on Drizzle updates, not raw SQL writes.
