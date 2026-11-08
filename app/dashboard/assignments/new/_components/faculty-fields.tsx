"use client";

import { useEffect, useId, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { maxAssignmentFaculty, type CreateAssignmentInput } from "../lib/zod-type/assignment";
import { useSearchFacultyQuery, type FacultyItem } from "../query/search-faculty";

export function FacultyFields({ form, userId, disabled }: {
  form: UseFormReturn<CreateAssignmentInput>; userId: string; disabled: boolean;
}) {
  const id = useId();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FacultyItem[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const facultyQuery = useSearchFacultyQuery(userId, search);
  return (
    <Controller control={form.control} name="facultyIds" render={({ field, fieldState }) => {
      const available = facultyQuery.data?.items.filter((member) => !field.value.includes(member.id)) ?? [];
      const select = (member: FacultyItem, checked: boolean) => {
        setSelected((members) => checked ? [...members, member] : members.filter((item) => item.id !== member.id));
        field.onChange(checked ? [...field.value, member.id] : field.value.filter((value) => value !== member.id));
      };
      const renderMember = (member: FacultyItem, index: number, checked: boolean) => (
        <Field key={member.id} orientation="horizontal" className="items-start rounded-lg border p-3">
          <Checkbox id={`${id}-${member.id}`} name={field.name} value={member.id} checked={checked}
            inputRef={index === 0 ? field.ref : undefined} onBlur={field.onBlur}
            onCheckedChange={(value) => select(member, value)}
            disabled={disabled || (!checked && field.value.length >= maxAssignmentFaculty)}
            aria-invalid={fieldState.invalid} aria-describedby={fieldState.error ? `${id}-error` : `${id}-help`} />
          <FieldLabel htmlFor={`${id}-${member.id}`} className="min-w-0 flex-1">
            <span className="min-w-0"><span className="block break-words">{member.name}</span><span className="block break-all text-xs font-normal text-muted-foreground">{member.email}</span></span>
          </FieldLabel>
        </Field>
      );
      return (
        <fieldset disabled={disabled} className="min-w-0 space-y-4" aria-describedby={fieldState.error ? `${id}-error` : `${id}-help`}>
          <legend className="mb-2 text-sm font-medium">Faculty <span aria-hidden="true" className="text-destructive">*</span><span className="sr-only"> (required)</span></legend>
          {!fieldState.error && <FieldDescription id={`${id}-help`}>Select 1–50 active faculty members. Your selections stay selected when you search.</FieldDescription>}
          <p role="status" className="text-sm font-medium">{field.value.length} selected</p>
          {selected.length > 0 && <div className="grid gap-2" aria-label="Selected faculty">{selected.map((member, index) => renderMember(member, index, true))}</div>}
          <Field>
            <FieldLabel htmlFor={`${id}-search`}>Search faculty</FieldLabel>
            <Input id={`${id}-search`} value={searchInput} onChange={(event) => setSearchInput(event.target.value)}
              maxLength={100} placeholder="Search by name or email" autoComplete="off"
              onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} />
          </Field>
          {facultyQuery.isFetching && <p role="status" className="text-sm text-muted-foreground">Loading faculty…</p>}
          {facultyQuery.isError && <div role="alert" className="space-y-2 text-sm text-destructive">
            <p>{facultyQuery.error.message}</p>
            <Button type="button" variant="outline" disabled={disabled} onClick={() => void facultyQuery.refetch()}>Retry faculty search</Button>
          </div>}
          {facultyQuery.isSuccess && <>
            {facultyQuery.data.items.length === 0 && <p className="text-sm text-muted-foreground">No active faculty found. Try another search, or ask a superadmin to create a faculty account.</p>}
            <div className="grid gap-2" aria-label="Available faculty">{available.map((member, index) => renderMember(member, selected.length + index, false))}</div>
            {facultyQuery.data.hasMore && <p className="text-sm text-muted-foreground">Showing the first 20 matches. Refine your search to find other faculty.</p>}
          </>}
          <FieldError id={`${id}-error`} errors={[fieldState.error]} />
        </fieldset>
      );
    }} />
  );
}
