<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent instructions

## Working rules

- Inspect the relevant code, configuration, and existing diff before editing. Preserve unrelated changes and user work.
- Keep changes focused on the requested behavior. Avoid unrelated refactors, dependency upgrades, or infrastructure changes.
- Follow existing conventions unless they conflict with the task. Resolve routine implementation choices independently; ask when missing information materially changes behavior or scope.
- Before finishing, review the diff for unintended changes, temporary debugging code, and stale documentation. Report the result, validation performed, and any unresolved limitations.

## Code quality and types

- Use descriptive names and cohesive functions/modules with small public interfaces. Keep business rules separate from presentation and infrastructure details where that improves clarity or testability.
- Prefer existing libraries and built-ins. Introduce abstractions for demonstrated needs; avoid designing for hypothetical scale or reuse.
- Keep code close to its feature; promote it to shared modules when multiple features need the same behavior. Avoid circular dependencies and imports into unrelated modules' internals.
- Preserve strict typing. Use `unknown` and narrowing for untrusted values; avoid `any`, unnecessary assertions, and suppressing checks. Document unavoidable exceptions.
- Derive types when they represent the same contract; define distinct types for distinct domain concepts. Validate external data at runtime.
- Handle expected failures and relevant edge cases explicitly. Preserve useful error context rather than swallowing errors.
- Optimize measured bottlenecks. Bound potentially large reads with pagination, batching, or streaming; cache only with clear freshness and access-control rules.

## Comments and documentation

- Explain intent, business rules, security requirements, edge cases, and constraints that are not clear from the code alone. Avoid restating names, types, or obvious operations.
- Keep comments concise and beside the relevant code. Use definition-level documentation when callers need a contract, usage guidance, or an explanation of side effects.
- In schemas, explain non-obvious relationships, constraints, sensitive data handling, and rules that require application logic.
- Update or remove comments when behavior changes. Clearly distinguish implemented guarantees from requirements still awaiting implementation.
- Update relevant documentation when setup, usage, configuration, or public behavior changes.

## Validation

- Run focused checks appropriate to the change: types, lint, tests, or a manual behavior check. Use the repository's configured tools; avoid introducing tooling just to validate a small edit.
- Choose tests according to risk. Cover changed behavior and meaningful edge cases; add a regression test for a bug when practical. Avoid tests that merely mirror implementation or require all test categories for every edit.
- Run a build when changes affect bundling, routing, configuration, or deployment. Avoid repeating full-project checks unless new edits, failures, or unresolved concerns justify them.
- Report which checks passed, failed, or could not run. Distinguish pre-existing failures from failures introduced by the change.

## Security and data

- Keep secrets in environment variables or secret managers. Exclude secret-bearing environment files, build output, and caches from commits; allow sanitized example configuration and generated artifacts intended for version control, such as migrations and lockfiles.
- Validate input at trust boundaries, use parameterized queries, and apply context-appropriate output escaping.
- Enforce authentication and authorization server-side for protected operations. Check access to the specific resource, not just the presence of a session or role in the UI.
- Keep database clients, credentials, and privileged operations in server-only code. Server Components may call the server data-access layer; client components must not import it.
- Use structured logs for important operations and failures, with safe diagnostic context. Never log secrets, tokens, or sensitive personal data. Add metrics or tracing when the workflow needs them.
- Treat schema edits, migration generation, and migration application as separate actions. Editing a schema alone does not authorize changing a database or its stored data. Report which actions were performed.

## Project conventions

These conventions apply to this repository; adapt this section when reusing the file in another project.

### Package management

- Use Bun for dependency management and scripts (`bun install`, `bun add`, `bun run`, `bunx`). Use the existing lockfile; avoid creating competing package-manager lockfiles.
- Read `package.json` for available scripts. Reuse an existing development server instead of starting a duplicate.

### Next.js structure

- Place routes under `app/`, following the framework guidance above.
- Colocate route-specific components, utilities, and types with their route. Use `_components/` for route-local components; the underscore excludes a folder from routing, but does not enforce import privacy.
- Create supporting folders only when needed. Add query hooks only when a feature uses the relevant query library.
- Place shared code in top-level `components/`, `lib/`, or `types/` when it has actual shared consumers.

### Data fetching and TanStack Query

- Use route-owned Next.js Server Actions for application reads and writes, wrapped in TanStack Query hooks for client fetching. Do not add an Axios/REST API layer for these operations.
- Before creating or changing server actions, query options, query/mutation hooks, cache keys, or invalidation behavior, read [docs/data-fetching.md](docs/data-fetching.md).

### Forms and validation

- Before building or modifying forms, adding form fields, or changing form Zod schemas, read [docs/react-hook-form.md](docs/react-hook-form.md). Use React Hook Form with Zod validation and shadcn Field primitives.

### Shared client state and Zustand

- Before creating or changing Zustand stores, selectors, persistence, or shared client state, read [docs/zustand.md](docs/zustand.md). Use Zustand for shared client state, TanStack Query for server state, and React Hook Form for form state.

### Database schema

- Keep Drizzle schemas in `db/schema/` and export them through `db/schema/schema.ts`.
- Use Drizzle's `text()` for string columns; do not use `varchar()`.
