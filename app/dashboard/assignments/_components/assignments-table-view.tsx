"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useGetAssignmentsQuery } from "../query/get";
import type { GetAssignmentsInput } from "../lib/zod-type/assignment-list";
import { AssignmentsDataTable } from "../data-table";

export function AssignmentsTableView({ userId }: { userId: string }) {
  const [search, setSearch] = useState("");
  const [input, setInput] = useState<GetAssignmentsInput>({ search: "", page: 1, limit: 20 });
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = search.trim();
      setInput((value) => value.search === nextSearch ? value : { ...value, search: nextSearch, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const assignments = useGetAssignmentsQuery(userId, input);
  const searching = assignments.isFetching || search.trim() !== input.search;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">Assignments</h1>
      <Button render={<Link href="/dashboard/assignments/new" />} nativeButton={false}><IconPlus aria-hidden data-icon="inline-start" />Create assignment</Button>
    </div>
    <div role="search" aria-label="Search assignments" className="flex flex-wrap items-end gap-3">
      <Field className="min-w-48 flex-1"><FieldLabel htmlFor="assignments-search">Search assignments</FieldLabel><Input id="assignments-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="Search by title" /></Field>
      {search && <Button variant="ghost" onClick={() => { setSearch(""); setInput({ search: "", page: 1, limit: 20 }); }}>Clear search</Button>}
    </div>
    {assignments.isPending ? <p role="status" className="p-8 text-muted-foreground">Loading assignments…</p> : assignments.isError ?
      <div role="alert" className="space-y-3"><p className="text-destructive">{assignments.error.message}</p><Button variant="outline" onClick={() => void assignments.refetch()}>Retry</Button></div> : <>
        <AssignmentsDataTable data={assignments.data.items} filtered={Boolean(input.search)} />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm" aria-busy={searching}>
          <p role="status">{assignments.data.pagination.total} {assignments.data.pagination.total === 1 ? "assignment" : "assignments"} · Page {assignments.data.pagination.page} of {assignments.data.pagination.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={searching || assignments.data.pagination.page <= 1} onClick={() => setInput((value) => ({ ...value, page: assignments.data.pagination.page - 1 }))}>Previous</Button>
            <Button variant="outline" disabled={searching || assignments.data.pagination.page >= assignments.data.pagination.totalPages} onClick={() => setInput((value) => ({ ...value, page: assignments.data.pagination.page + 1 }))}>Next</Button>
          </div>
        </div>
      </>}
  </div>;
}
