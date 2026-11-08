"use client";

import { useTable } from "@tanstack/react-table";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assignmentTableFeatures } from "./data-table-feature";
import { assignmentColumns } from "./column";
import type { AssignmentItem } from "./query/get";

export function AssignmentsDataTable({ data, filtered }: { data: AssignmentItem[]; filtered: boolean }) {
  const table = useTable({ features: assignmentTableFeatures, columns: assignmentColumns, data, getRowId: (row) => row.id });
  return <div className="overflow-x-auto rounded-lg border bg-card">
    <Table>
      <TableCaption className="sr-only">Assignments you have created</TableCaption>
      <TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</TableHead>)}</TableRow>)}</TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getAllCells().map((cell) => <TableCell key={cell.id}><table.FlexRender cell={cell} /></TableCell>)}</TableRow>) :
          <TableRow><TableCell colSpan={assignmentColumns.length} className="h-32 text-center text-muted-foreground">{filtered ? "No assignments match your search." : "You haven’t created any assignments yet."}</TableCell></TableRow>}
      </TableBody>
    </Table>
  </div>;
}
