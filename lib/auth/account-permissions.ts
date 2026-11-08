import { userRoleEnum } from "@/db/schema/enums";
import type { WorkspaceRole } from "@/types/workspace";

export function canManageAccounts(roles: readonly WorkspaceRole[]) {
  return roles.includes("superadmin") || roles.includes("exam_controller");
}

export function getCreatableAccountRoles(roles: readonly WorkspaceRole[]) {
  return userRoleEnum.enumValues.filter((role) => role !== "superadmin").filter((role) =>
    (roles.includes("superadmin") || (roles.includes("exam_controller") && role !== "exam_controller")));
}

export function canManageAccount(actor: { id: string; roles: readonly WorkspaceRole[] }, target: { id: string; roles: readonly WorkspaceRole[] }) {
  if (actor.id === target.id || !canManageAccounts(actor.roles)) return false;
  return actor.roles.includes("superadmin") || !target.roles.some((role) => role === "superadmin" || role === "exam_controller");
}
