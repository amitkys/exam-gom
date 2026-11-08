import { z } from "zod";
import { userRoleEnum } from "@/db/schema/enums";

export const firstSuperadminSchema = z.object({
  name: z.string().trim().min(1, { error: "Enter the member’s name." }).max(100),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(8, { error: "Use at least 8 characters for the initial password." })
    .max(128, { error: "Use 128 characters or fewer." }),
});

export const createAccountSchema = firstSuperadminSchema.extend({
  role: z.enum(userRoleEnum.enumValues, { error: "Choose a valid role." }).exclude(["superadmin"]),
});

// The form can hold an empty selection, but submission still requires a role.
export const createAccountFormSchema = createAccountSchema.extend({
  role: z.union([createAccountSchema.shape.role, z.literal("")]).pipe(createAccountSchema.shape.role),
});

export type FirstSuperadminInput = z.infer<typeof firstSuperadminSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type CreateAccountFormValues = z.input<typeof createAccountFormSchema>;
