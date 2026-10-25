import { pgEnum } from "drizzle-orm/pg-core";

export const accountStatusEnum = pgEnum("account_status", ["active", "disabled"]);
export const userRoleEnum = pgEnum("user_role", ["superadmin", "exam_controller", "faculty", "reviewer", "paper_setter"]);
