"use client";

import Link from "next/link";
import { IconArrowUpRight } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { AssignmentItem } from "./query/get";
import type { AssignmentTableFeatures } from "./data-table-feature";

const columnHelper = createColumnHelper<AssignmentTableFeatures, AssignmentItem>();

export const assignmentColumns = columnHelper.columns([
  columnHelper.accessor("title", {
    header: "Assignment",
    cell: ({ row, getValue }) => <div className="min-w-64 max-w-xl space-y-1 whitespace-normal">
      <Link href={`/dashboard/assignments/${row.original.id}`} className="font-medium text-foreground underline-offset-4 [overflow-wrap:anywhere] hover:text-primary hover:underline">{getValue()}</Link>
      <p className="line-clamp-2 text-sm text-muted-foreground [overflow-wrap:anywhere]">{row.original.instructionsPreview}</p>
    </div>,
  }),
  columnHelper.accessor("facultyCount", { header: "Faculty", cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span> }),
  columnHelper.accessor("createdAt", { header: "Created", cell: ({ getValue }) => getValue().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) }),
  columnHelper.display({
    id: "actions", header: "Actions",
    cell: ({ row }) => <Button variant="outline" size="sm" render={<Link href={`/dashboard/assignments/${row.original.id}`} aria-label={`View assignment: ${row.original.title}`} />} nativeButton={false}>
      View assignment<IconArrowUpRight aria-hidden data-icon="inline-end" />
    </Button>,
  }),
]);
