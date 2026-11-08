"use client";

import { useTable } from "@tanstack/react-table";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { userTableFeatures } from "./data-table-feature";
import type { UserItem } from "./query/get";
import type { createUserColumns } from "./column";

export function UsersDataTable({ data, columns, filtered }: { data: UserItem[]; columns: ReturnType<typeof createUserColumns>; filtered: boolean }) {
  const table = useTable({ features: userTableFeatures, data, columns, getRowId: (row) => row.id });
  return <div className="overflow-x-auto rounded-lg border bg-card">
    <Table>
      <TableCaption className="sr-only">Institution users and available management actions</TableCaption>
      <TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</TableHead>)}</TableRow>)}</TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getAllCells().map((cell) => <TableCell key={cell.id}><table.FlexRender cell={cell} /></TableCell>)}</TableRow>) :
          <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{filtered ? "No users match these filters." : "No users found."}</TableCell></TableRow>}
      </TableBody>
    </Table>
  </div>;
}
