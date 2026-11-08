# Workspace navigation

All `/dashboard` pages use the sidebar and mobile navigation from the
`/admin-testing` demonstration. The dashboard layout loads the signed-in user's
profile and current roles on the server and passes safe presentation data to the
sidebar and account menu. Sign-out uses the existing session-revocation action.

| Role | Sidebar links |
| --- | --- |
| Superadmin | Administration, Users |
| Exam controller | Examination workspace, Users, Assignments, Create assignment |
| Faculty | Faculty workspace |
| Reviewer | Review workspace |
| Paper setter | Paper setting workspace |

Every workspace link currently leads to `/dashboard`. Users leads to
`/dashboard/users`, with account creation at `/dashboard/users/new`.
Create assignment leads to `/dashboard/assignments/new`.
Assignments leads to `/dashboard/assignments` and lists only the current
controller's assignments; assignment details link back to this list.
Faculty drafting, review jobs, and paper setting screens will gain links as those
features are implemented. The live sidebar does not include the demo's sample
posts, categories, tags, or account routes.

Users with multiple roles see each assigned role's section. Users without roles
see only My workspace. These menus do not grant permissions: every protected
page and Server Action retains its server-side session and role checks. A
superadmin alone cannot create assignments. Refresh the page after an account's
roles change to update the navigation.

`/admin-testing` retains the sample sidebar independently of authenticated menus.
`bun test tests/menu-list.test.ts` checks role-specific links, multiple roles,
active-route matching, and the no-role fallback.
