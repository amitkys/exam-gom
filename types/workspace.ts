import type { userRoleEnum } from "@/db/schema/enums";

export type WorkspaceRole = (typeof userRoleEnum.enumValues)[number];
export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  roles: WorkspaceRole[];
};
