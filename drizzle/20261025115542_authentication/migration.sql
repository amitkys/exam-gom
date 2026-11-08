CREATE TYPE "account_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('superadmin', 'exam_controller', 'faculty', 'reviewer', 'paper_setter');--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"userId" uuid NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"passwordHash" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_provider_account_unique" UNIQUE("provider","providerAccountId"),
	CONSTRAINT "password_provider_hash" CHECK (("provider" = 'credentials') = ("passwordHash" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"status" "account_status" DEFAULT 'active'::"account_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"userId" uuid NOT NULL,
	"tokenHash" text NOT NULL UNIQUE,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"revokedAt" timestamp with time zone,
	CONSTRAINT "session_expiry_valid" CHECK ("expiresAt" > "createdAt")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"userId" uuid,
	"role" "user_role",
	CONSTRAINT "user_roles_pkey" PRIMARY KEY("userId","role")
);
--> statement-breakpoint
CREATE TABLE "auth_login_limits" (
	"key" text PRIMARY KEY,
	"attempts" integer NOT NULL,
	"resetsAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_accounts_user_idx" ON "auth_accounts" ("userId");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "auth_sessions" ("userId");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "auth_sessions" ("expiresAt");--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_auth_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_auth_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_auth_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE;