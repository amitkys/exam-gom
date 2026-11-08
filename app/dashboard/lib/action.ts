"use server";

import { logAuthError } from "@/lib/auth/log";
import { revokeSession } from "@/lib/auth/session";

export async function logoutAction() {
  try {
    await revokeSession();
    return { success: true as const, data: { redirectTo: "/login" } };
  } catch (error) {
    logAuthError("logoutAction", error);
    return { success: false as const, message: "Unable to sign out. Please try again." };
  }
}
