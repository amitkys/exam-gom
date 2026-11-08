# Assignment creation

Exam controllers can open **Create an assignment** from their workspace at
`/dashboard/assignments/new`. Enter a title, preparation instructions, and select
one or more active faculty accounts. Search matches names or email addresses;
selections remain selected across searches. Superadmins and exam controllers provision faculty accounts
through the existing account creation screen.

After saving, the controller is taken to `/dashboard/assignments/<id>`, where the
stored instructions and assigned faculty can be reviewed. Open **Assignments**
in the sidebar at `/dashboard/assignments` to find assignments you have created.
The table shows titles, instruction previews, faculty counts, and creation dates,
with newest assignments first. Search titles as you type (300 ms debounce), and
use pagination to browse older assignments. Open a title or **View assignment**
to see the full instructions and assigned faculty.

## Permissions and contract

- Only active, signed-in users with the current `exam_controller` role may search
  faculty or create assignments. Superadmin status alone does not grant this role.
- `searchFacultyAction({ search })` accepts a literal, case-insensitive name/email
  search of up to 100 characters. It returns at most 20 active faculty and
  `hasMore`; refine the search when more matches exist.
- `createAssignmentAction({ title, instructions, facultyIds })` accepts a trimmed
  title of 1–200 characters, trimmed instructions of 1–10,000 characters, and
  1–50 distinct faculty UUIDs. Unknown fields are rejected. Ownership and timestamps
  come from the server. Success returns only the assignment ID and title.
- Creation checks current faculty roles and account status inside the same
  transaction that saves the assignment and all memberships. A failed eligibility
  check or membership write leaves no partial assignment.
- `getAssignmentAction(id)` requires the current controller role and scopes the
  database read to assignments owned by the caller. Missing, malformed, and
  other controllers' assignment IDs return `data: null`; the page shows a 404.
- `getAssignmentsAction({ search, page, limit })` requires the controller role
  and scopes all queries and totals to the signed-in controller's assignments.
  Search matches literal title text, case-insensitively, up to 100 characters.
  Page sizes are bounded to 1–50; the UI uses 20. Out-of-range pages clamp to the
  last available page. Results include safe previews and pagination metadata.
  Totals and page rows are read together in a repeatable-read transaction.
- Assignment list caches include the current user, search, and pagination.
  Successful creation invalidates that controller's assignment queries. Role
  checks are repeated on the server independently of cache keys and navigation.
- Actions return `{ success: true, data }` or `{ success: false, message }`.
  Errors expose safe messages; logs contain the action and error classification,
  without instructions, faculty identities, or database parameters.
- Assignment membership does not alter global login access. Faculty drafting,
  submission, review, reassignment, and assignment access withdrawal are later
  workflow steps. No invitation or notification is sent by creation.

## Database rollout and verification

The Drizzle definitions in `db/schema/assignments.ts` add `exam_assignments` and
`exam_assignment_faculty`, their indexes, checks, and foreign keys. Apply the
schema with `bun run db:push`; no separate assignment migration file is needed.
Review any proposed destructive changes before accepting them.

`bun run test:auth` includes assignment tests against isolated PostgreSQL (PGlite)
using the Drizzle schema directly. It covers role and ownership checks, malformed
payloads, ineligible faculty, bounded literal searches, live permission changes,
and rollback after a membership write fails. It never uses `DATABASE_URL`.
Also run `bunx tsc --noEmit`, `bun run lint`, and `bun run build`.

After the schema is applied to a development database, browser-smoke-test a
controller creating an assignment with multiple faculty, persistence after
reload, and rejection for another controller or ordinary member.
