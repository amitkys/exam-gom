# User management

Open **Users** in the sidebar at `/dashboard/users`. Both superadmins and exam
controllers see all users, including existing accounts. The list supports literal
name/email search as you type (with a 300 ms debounce), status filtering, and
server pagination (20 users per page). Search changes return to the first page.
The old account-creation page now lives at `/dashboard/users/new`.

| Operation | Superadmin | Exam controller |
| --- | --- | --- |
| View all users | Yes | Yes |
| Create controller accounts | Yes | No |
| Create faculty, reviewers, paper setters | Yes | Yes |
| Reset passwords or change account status | Other accounts | Faculty, reviewers, paper setters and other non-privileged accounts |
| Reset or change own account status | No | No |
| Create superadmins through the UI | No | No |

Management checks use every current role on the target account. Adding a faculty
role to a superadmin or controller does not let another controller manage it.
Read-only rows identify the current account or display **View only**. Server
Actions repeat the checks; hiding row buttons does not authorize a request.

## Password reset and access

Choose **Reset password** and enter the new password twice (8–128 characters).
The form becomes a bottom sheet on mobile. The manager must share the password
privately; no email or invitation is sent. Existing passwords cannot be viewed.
Password sign-in must already exist; this operation does not add credentials to
an external-provider account. Resetting a disabled account leaves it disabled.

Password changes and session revocation commit together. Account disabling also
revokes sessions in the same transaction. Enabling requires a new login; it does
not reactivate old sessions. Session creation rechecks the verified password hash
and active status under the same user-row lock used by management operations,
preventing a stale login from creating a session after a reset or disable.

Password values are never returned by actions or logged. Password mutation data
and form fields are discarded after submission settles or the sheet closes.
Successful resets/status changes log only the operation, outcome, and status
where applicable; failures log the error classification without personal data.
No self-service recovery, forced first-login password change, or notification
delivery is implemented by this feature.

## Server Action contract

All actions are owned by `app/dashboard/users/lib/action.ts` and return
`{ success: true, data }` or `{ success: false, message }`.

- `getUsersAction({ search, status, page, limit })`: maximum search length 100,
  status `all`/`active`/`disabled`, positive integer page, limit 1–50. Returns safe
  profile fields, current roles, credential availability, management permission,
  and pagination metadata. Credential hashes and sessions are never returned.
  An out-of-range page is clamped to the last page. Totals and items are read in
  one repeatable-read transaction.
- `createAccountAction({ name, email, password, role })`: runtime validation and
  role checks run on the server. Provisioning remains transactional.
- `resetAccountPasswordAction({ id, password, confirmPassword })`: checks current
  manager and target permissions, updates password credentials, revokes sessions,
  and returns only the target ID.
- `setAccountStatusAction({ id, status })`: checks manager/target permissions and
  returns the resulting status. Disabling revokes sessions; enabling does not.

Queries include the signed-in user, search, status and page in their cache keys.
Successful creation/status changes invalidate the user list and faculty searches.
Password resets refresh the user list. Failed mutations retain accessible errors.

## Verification and database

No schema change or database push is required. No existing credentials, account
statuses, or sessions are changed until a manager performs an action in the app.

`bun test` covers all-user visibility, manager permissions, controller creation
limits, literal searches, pagination bounds, password reset, stale credentials,
disable/re-enable, self-management prevention, current roles/status, and rollback
when session revocation fails. Tests use isolated PostgreSQL (PGlite), never the
configured application database. TypeScript and lint validate the UI integration.
