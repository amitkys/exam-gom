ExamGom is an examination management workspace built with Next.js and Drizzle.

Email/password sign-in, database sessions, and role-based account management are
implemented. See [authentication setup](docs/authentication.md) for database
preparation, first-admin provisioning, and the deferred invitation workflow.

Exam controllers can also [create assignments](docs/assignments.md) with
instructions and selected faculty. Apply the Drizzle schema with `bun run db:push`.

Dashboard pages share [role-specific sidebar navigation](docs/navigation.md),
based on the `/admin-testing` sidebar demonstration.

Superadmins and exam controllers can [view all users](docs/user-management.md),
create permitted accounts, reset passwords, and enable or disable account access.

## Getting Started

First, run the development server:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Validate with `bun run test:auth`, `bunx tsc --noEmit`, `bun run lint`, and
`bun run build`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
