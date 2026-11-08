"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { workspaceRoleLabels } from "@/lib/menu-list";
import { UserRowActions } from "./_components/user-row-actions";
import type { UserItem } from "./query/get";
import type { UserTableFeatures } from "./data-table-feature";

const columnHelper = createColumnHelper<UserTableFeatures, UserItem>();

export function createUserColumns(managerId: string, onFeedback: (message: string) => void) {
  return columnHelper.columns([
    columnHelper.accessor("name", { header: "Name", cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> }),
    columnHelper.accessor("email", { header: "Email" }),
    columnHelper.accessor("roles", { header: "Roles", cell: ({ getValue }) => getValue().map((role) => workspaceRoleLabels[role]).join(", ") || "No roles" }),
    columnHelper.accessor("status", { header: "Status", cell: ({ getValue }) => <Badge className="bg-green-700 text-white" variant={getValue() === "active" ? "secondary" : "outline"}>{getValue() === "active" ? "Active" : "Disabled"}</Badge> }),
    columnHelper.accessor("createdAt", { header: "Created", cell: ({ getValue }) => getValue().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) }),
    columnHelper.display({ id: "actions", header: "Actions", cell: ({ row }) => <UserRowActions user={row.original} managerId={managerId} onFeedback={onFeedback} /> }),
  ]);
}
