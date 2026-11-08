"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useGetUsersQuery } from "../query/get";
import type { GetUsersInput } from "../lib/zod-type/manage-account";
import { createUserColumns } from "../column";
import { UsersDataTable } from "../data-table";

export function UsersTableView({ userId }: { userId: string }) {
  const [input, setInput] = useState<GetUsersInput>({ search: "", status: "all", page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = search.trim();
      setInput((value) => value.search === nextSearch ? value : { ...value, search: nextSearch, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const users = useGetUsersQuery(userId, input);
  const columns = useMemo(() => createUserColumns(userId, setFeedback), [userId]);
  const filtered = Boolean(input.search || input.status !== "all");
  const searching = users.isFetching || search.trim() !== input.search;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <h1 className="text-2xl font-semibold">Users</h1>
      <Button render={<Link href="/dashboard/users/new" />} nativeButton={false}>Create account</Button>
    </div>
    {feedback && <p role="status" className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{feedback}</p>}
    <div role="search" aria-label="Filter users" className="flex flex-wrap items-end gap-3">
      <Field className="min-w-48 flex-1"><FieldLabel htmlFor="users-search">Search users</FieldLabel><Input id="users-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="Name or email" /></Field>
      <Field className="w-40"><FieldLabel htmlFor="users-status">Account status</FieldLabel>
        <NativeSelect id="users-status" value={input.status} onChange={(event) => {
          const status = event.target.value;
          if (status === "all" || status === "active" || status === "disabled") setInput((value) => ({ ...value, status, page: 1 }));
        }}><NativeSelectOption value="all">All statuses</NativeSelectOption><NativeSelectOption value="active">Active</NativeSelectOption><NativeSelectOption value="disabled">Disabled</NativeSelectOption></NativeSelect>
      </Field>
      {filtered && <Button type="button" variant="ghost" onClick={() => { setSearch(""); setInput({ search: "", status: "all", page: 1, limit: 20 }); }}>Reset filters</Button>}
    </div>
    {users.isPending ? <p role="status" className="p-8 text-muted-foreground">Loading users…</p> : users.isError ?
      <div role="alert" className="space-y-3"><p className="text-destructive">{users.error.message}</p><Button variant="outline" onClick={() => void users.refetch()}>Retry</Button></div> : <>
        <UsersDataTable data={users.data.items} columns={columns} filtered={filtered} />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm" aria-busy={searching}>
          <p role="status">{users.data.pagination.total} users · Page {users.data.pagination.page} of {users.data.pagination.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={searching || users.data.pagination.page <= 1} onClick={() => setInput((value) => ({ ...value, page: users.data.pagination.page - 1 }))}>Previous</Button>
            <Button variant="outline" disabled={searching || users.data.pagination.page >= users.data.pagination.totalPages} onClick={() => setInput((value) => ({ ...value, page: users.data.pagination.page + 1 }))}>Next</Button>
          </div>
        </div>
      </>}
  </div>;
}
