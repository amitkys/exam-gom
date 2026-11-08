import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254)
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(1, { error: "Enter your password." })
    .max(128, { error: "Password must be 128 characters or fewer." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
