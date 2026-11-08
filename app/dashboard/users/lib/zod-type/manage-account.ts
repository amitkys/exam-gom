import { z } from "zod";
import { accountStatusEnum } from "@/db/schema/enums";
import { firstSuperadminSchema } from "./account";

export const getUsersSchema = z.strictObject({
  search: z.string().trim().max(100),
  status: z.enum(["all", ...accountStatusEnum.enumValues]),
  page: z.number().int().min(1).max(100000),
  limit: z.number().int().min(1).max(50),
});

export const resetAccountPasswordSchema = z.strictObject({
  id: z.uuid(),
  password: firstSuperadminSchema.shape.password,
  confirmPassword: z.string().max(128),
}).refine((data) => data.password === data.confirmPassword, {
  error: "Passwords do not match.", path: ["confirmPassword"],
});

export const setAccountStatusSchema = z.strictObject({
  id: z.uuid(), status: z.enum(accountStatusEnum.enumValues),
});

export type GetUsersInput = z.infer<typeof getUsersSchema>;
export type ResetAccountPasswordInput = z.infer<typeof resetAccountPasswordSchema>;
export type SetAccountStatusInput = z.infer<typeof setAccountStatusSchema>;
