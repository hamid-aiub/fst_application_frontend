"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, CircleAlert, FileSpreadsheet, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { useAdminUser } from "@/components/admin/admin-shell";
import { hasPermission } from "@/resources/auth/service/auth.service";
import { RESOURCE_MAP } from "@/resources/management/config/resources";
import { useSemester } from "@/components/admin/semester-context";
import { createResource, deleteResource, importResource, listResource, updateResource } from "@/resources/management/service/resource.service";
import type { GenericRecord, ResourceField } from "@/resources/management/types/resource.types";

type FieldValues = Record<string, string | boolean>;
const msg = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";

function nestedValue(record: GenericRecord, path: string): unknown {
  let value: unknown = record;
  for (const key of path.split(".")) {
    if (value && typeof value === "object") value = (value as Record<string, unknown>)[key];
    else return undefined;
  }
  return value;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    return String(item.name ?? item.title ?? item.email ?? item.id ?? "—");
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleDateString();
  return String(value);
}

function initialValues(fields: ResourceField[], record?: GenericRecord): FieldValues {
  return Object.fromEntries(fields.map((field) => {
    const value = record?.[field.key];
    if (field.type === "boolean") return [field.key, typeof value === "boolean" ? value : false];
    if (field.type === "date" || field.type === "datetime") {
      const raw = typeof value === "string" ? value : value instanceof Date ? value.toISOString() : "";
      return [field.key, raw ? raw.slice(0, field.type === "date" ? 10 : 16) : ""];
    }
    return [field.key, value == null ? "" : String(value)];
  }));
}

function ResourceEditor({
  title,
  fields,
  record,
  semesterId,
  busy,
  onClose,
  onSave,
}: {
  title: string;
  fields: ResourceField[];
  record?: GenericRecord;
  semesterId: string;
  busy: boolean;
  onClose: () => void;
  onSave: (values: Record<string, unknown>) => Promise<void>;
}) {
  const [values, setValues] = useState<FieldValues>(() => initialValues(fields, record));
  const [options, setOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const remoteFields = fields.filter((field) => field.optionsResource);
    Promise.allSettled(remoteFields.map(async (field) => {
      const usesSemester = ["courses", "sections", "tasks", "class_cancellations"].includes(field.optionsResource!);
      const result = await listResource(field.optionsResource!, 1, 100, usesSemester ? { semesterId } : undefined);
      return [field.key, result.data.map((item) => ({
        value: String(item.id),
        label: field.optionsResource === "permissions"
          ? `${String(item.module ?? "")} · ${String(item.name ?? "")}`
          : String(nestedValue(item, field.optionLabel ?? "name") ?? item.name ?? item.id),
      }))] as const;
    })).then((results) => {
      if (!active) return;
      const next: Record<string, Array<{ value: string; label: string }>> = {};
      for (const result of results) if (result.status === "fulfilled") next[result.value[0]] = result.value[1];
      setOptions(next);
    });
    return () => { active = false; };
  }, [fields, semesterId]);

  function updateField(field: ResourceField, value: string | boolean) {
    setValues((current) => ({ ...current, [field.key]: value }));
    setErrors((current) => ({ ...current, [field.key]: "" }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = values[field.key];
      if (field.required && (value === "" || value === undefined || value === null)) nextErrors[field.key] = `${field.label} is required.`;
      if (field.type === "number" && value !== "" && value !== undefined && !Number.isFinite(Number(value))) nextErrors[field.key] = `Enter a valid ${field.label.toLowerCase()}.`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      const value = values[field.key];
      if (value === "" || value === undefined) continue;
      body[field.key] = field.type === "number" ? Number(value) : value;
    }
    await onSave(body);
  }

  function renderField(field: ResourceField) {
    const value = values[field.key];
    const className = "mt-1.5 h-10 w-full rounded-lg border border-[#dfe5ee] bg-white px-3 text-sm text-[#33435c] outline-none focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10";
    const ariaInvalid = Boolean(errors[field.key]);
    return <label key={field.key} className="block text-xs font-medium text-[#45556e]">{field.label}{field.required && <span className="ml-1 text-rose-500">*</span>}
      {field.type === "textarea" ? <textarea value={String(value ?? "")} onChange={(event) => updateField(field, event.target.value)} rows={3} aria-invalid={ariaInvalid} className="mt-1.5 w-full resize-y rounded-lg border border-[#dfe5ee] bg-white px-3 py-2 text-sm text-[#33435c] outline-none focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10" />
        : field.type === "boolean" ? <span className="mt-3 flex items-center gap-2 text-xs font-normal text-[#53627a]"><input type="checkbox" checked={Boolean(value)} onChange={(event) => updateField(field, event.target.checked)} className="size-4 accent-[#5268c6]" /> Enabled</span>
          : field.type === "select" ? <select value={String(value ?? "")} onChange={(event) => updateField(field, event.target.value)} aria-invalid={ariaInvalid} className={className}><option value="">Choose {field.label.toLowerCase()}</option>{(field.options ?? options[field.key] ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            : <input type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : field.type} step={field.type === "number" ? "0.01" : undefined} value={String(value ?? "")} onChange={(event) => updateField(field, event.target.value)} aria-invalid={ariaInvalid} className={className} />}
      {errors[field.key] && <span className="mt-1 block text-[11px] text-rose-600">{errors[field.key]}</span>}
    </label>;
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172235]/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="resource-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#edf0f5] px-6 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a88a1]">Resource record</p><h2 id="resource-dialog-title" className="mt-1 text-lg font-semibold text-[#20314d]">{record ? "Edit" : "Add"} {title.toLowerCase()}</h2></div><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#8b96a8] hover:bg-[#f3f5f9]"><X className="size-4" /></button></div>
      <form onSubmit={submit} className="max-h-[calc(90vh-76px)] overflow-y-auto px-6 py-5"><div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">{fields.map(renderField)}</div><div className="mt-5 flex justify-end gap-2 border-t border-[#edf0f5] pt-4"><Button type="button" variant="outline" disabled={busy} onClick={onClose} className="h-9 rounded-lg px-4 text-xs">Cancel</Button><Button type="submit" disabled={busy} className="h-9 rounded-lg bg-[#293b5b] px-4 text-xs text-white hover:bg-[#344a70]">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{record ? "Save changes" : "Create record"}</Button></div></form>
    </section>
  </div>;
}

export default function ManagedResourcePage({ resourceOverride }: { resourceOverride?: string } = {}) {
  const params = useParams<{ resource: string }>();
  const router = useRouter();
  const slug = resourceOverride ?? params.resource;
  const config = RESOURCE_MAP[slug];
  const admin = useAdminUser();
  const { semesterId } = useSemester();
  const [records, setRecords] = useState<GenericRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{ record?: GenericRecord } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GenericRecord | null>(null);
  const [importResult, setImportResult] = useState<GenericRecord | null>(null);
  const [importSemesterId, setImportSemesterId] = useState("");
  const [semesterOptions, setSemesterOptions] = useState<Array<{ value: string; label: string }>>([]);
  const importInput = useRef<HTMLInputElement>(null);

  const read = Boolean(config && hasPermission(admin?.permissions ?? [], config.slug, "read"));
  const canCreate = Boolean(config && hasPermission(admin?.permissions ?? [], config.slug, "create"));
  const canUpdate = Boolean(config && hasPermission(admin?.permissions ?? [], config.slug, "update"));
  const canDelete = Boolean(config && hasPermission(admin?.permissions ?? [], config.slug, "delete"));

  const loadRecords = useCallback(async () => {
    if (!config || !read) return;
    setLoading(true);
    setError("");
    try {
      const usesSemester = ["courses", "sections", "tasks", "class_cancellations"].includes(config.slug);
      const result = await listResource(config.slug, page, limit, usesSemester ? { semesterId } : undefined);
      setRecords(result.data);
      setPagination(result.pagination);
    } catch (reason) { setError(msg(reason)); }
    finally { setLoading(false); }
  }, [config, read, page, limit, semesterId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  useEffect(() => {
    if (!config?.import) return;
    listResource("semesters", 1, 100).then((result) => setSemesterOptions(result.data.map((record) => ({ value: record.id, label: String(record.name ?? record.id) })))).catch(() => setSemesterOptions([]));
  }, [config]);

  async function saveRecord(body: Record<string, unknown>) {
    if (!config) return;
    setPending(true);
    try {
      if (editor?.record) {
        await updateResource(config.slug, editor.record.id, body);
        setNotice(`${config.title.slice(0, -1)} updated.`);
      } else {
        await createResource(config.slug, body);
        setNotice(`${config.title.slice(0, -1)} created.`);
      }
      setEditor(null);
      await loadRecords();
    } catch (reason) { setError(msg(reason)); }
    finally { setPending(false); }
  }

  async function removeRecord() {
    if (!config || !deleteTarget) return;
    setPending(true);
    try {
      await deleteResource(config.slug, deleteTarget.id);
      setDeleteTarget(null);
      setNotice("Record removed.");
      if (records.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadRecords();
    } catch (reason) { setError(msg(reason)); }
    finally { setPending(false); }
  }

  async function handleImport(file?: File) {
    if (!file || !config?.import) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) { setError("Choose an .xlsx workbook."); return; }
    if (!importSemesterId) { setError("Select a semester before importing this workbook."); return; }
    setPending(true);
    setError("");
    try {
      const result = await importResource(config.slug, file, config.import.requiredField, importSemesterId);
      setImportResult(result);
      setNotice(`Import completed. ${String(result.createdCount ?? 0)} created and ${String(result.skippedCount ?? 0)} skipped.`);
      setPage(1);
      await loadRecords();
    } catch (reason) { setError(msg(reason)); }
    finally { setPending(false); if (importInput.current) importInput.current.value = ""; }
  }

  if (!config) return <section className="rounded-2xl border border-[#e7ebf2] bg-white p-8"><h1 className="text-lg font-semibold text-[#24344f]">Module not found</h1><p className="mt-2 text-sm text-[#758198]">This resource is not available in the frontend.</p><a href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#5268c6]"><ArrowLeft className="size-4" /> Return to overview</a></section>;
  if (!read) return <section className="mx-auto mt-12 max-w-xl rounded-2xl border border-[#e8edf4] bg-white p-8 text-center"><CircleAlert className="mx-auto size-8 text-[#bd8152]" /><h1 className="mt-4 text-lg font-semibold text-[#253651]">Access permission required</h1><p className="mt-2 text-sm text-[#7d899d]">Your account does not have the {config.slug}.read permission.</p></section>;

  const start = pagination.total ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, pagination.total);
  const columns: DataColumn<GenericRecord>[] = config.columns.map((column) => ({
    ...column,
    render: (record) => {
      const cell = nestedValue(record, column.key);
      if (config.slug === "courses" && column.key === "name") return <span className="font-semibold text-[#40516c]">{formatValue(cell)}<span className="ml-2 text-[10px] font-medium text-[#5d70c7]">View</span></span>;
      return formatValue(cell);
    },
  }));
  if (canUpdate || canDelete) columns.push({
    key: "actions", label: "Actions", sortable: false, className: "w-[120px] text-right",
    render: (record) => <div onClick={(event) => event.stopPropagation()} className="flex justify-end gap-1.5">
      {canUpdate && <Button variant="outline" size="sm" onClick={() => setEditor({ record })} className="h-8 rounded-lg border-[#e5e9f0] px-2.5 text-[11px] text-[#586985]">Edit</Button>}
      {canDelete && <Button variant="ghost" size="icon-sm" aria-label={`Delete ${config.title} record`} onClick={() => setDeleteTarget(record)} className="rounded-lg text-[#8792a4] hover:bg-rose-50 hover:text-rose-600"><Trash2 className="size-4" /></Button>}
    </div>,
  });

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a96a9]"><span>{config.group}</span><span className="text-[#c4cad4]">/</span><span className="text-[#5e6fc5]">{config.title}</span></div><h1 className="text-[30px] font-semibold tracking-[-0.045em] text-[#1d2b42]">{config.title}</h1><p className="mt-1.5 text-sm text-[#78859a]">{config.description}</p></div><div className="flex flex-wrap items-center gap-2">{config.import && <><select value={importSemesterId} onChange={(event) => setImportSemesterId(event.target.value)} aria-label="Choose semester for import" className="h-10 rounded-lg border border-[#dfe5ee] bg-white px-3 text-xs text-[#53627a]"><option value="">Select semester</option>{semesterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><input ref={importInput} type="file" accept=".xlsx" className="sr-only" onChange={(event) => void handleImport(event.currentTarget.files?.[0])} /><Button variant="outline" disabled={!canCreate || pending} onClick={() => importInput.current?.click()} className="h-10 gap-2 rounded-lg border-[#dfe5ee] bg-white px-3.5 text-xs"><FileSpreadsheet className="size-4 text-[#548a69]" /> Import Excel</Button></>}{canCreate && <Button disabled={pending} onClick={() => setEditor({})} className="h-10 gap-2 rounded-lg bg-[#293b5b] px-4 text-xs font-semibold text-white hover:bg-[#344a70]"><Plus className="size-4" /> Add record</Button>}</div></div>

    {(error || notice) && <div role={error ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#d9e9dd] bg-[#f0f8f2] text-[#477958]"}`}>{error ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <span className="mt-1 size-2 shrink-0 rounded-full bg-[#63a174]" />}<span className="flex-1">{error || notice}</span><button onClick={() => { setError(""); setNotice(""); }} aria-label="Dismiss message"><X className="size-4" /></button></div>}
    {importResult && <div className="rounded-xl border border-[#e4eadf] bg-[#f3f8f0] p-4 text-xs text-[#526b43]"><p className="font-semibold">Import report</p><p className="mt-1">{String(importResult.createdCount ?? 0)} created · {String(importResult.skippedCount ?? 0)} skipped out of {String(importResult.totalRows ?? 0)} rows.</p>{Array.isArray(importResult.skippedRows) && importResult.skippedRows.length > 0 && <ul className="mt-2 max-h-28 space-y-1 overflow-auto">{importResult.skippedRows.map((row, index) => <li key={index}>Row {String(row.row)}: {String(row.reason)}</li>)}</ul>}</div>}

    <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)]">
      <div className="flex items-center justify-between border-b border-[#edf0f5] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#293952]">Records</h2><p className="mt-0.5 text-[11px] text-[#8d98aa]">{pagination.total.toLocaleString()} total</p></div><span className="text-xs text-[#8290a5]">{config.title}</span></div>
      <DataTable rows={records} columns={columns} loading={loading} onRowClick={config.slug === "courses" ? (record) => router.push(`/admin/courses/${record.id}`) : undefined} emptyTitle="No records yet" emptyDescription={`Create a record to start managing ${config.title.toLowerCase()}.`} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f5] px-4 py-3.5 sm:px-5"><div className="flex items-center gap-2 text-[11px] text-[#8b96a8]">Rows per page <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="h-7 rounded-md border border-[#e2e7ee] bg-white px-1.5 text-[11px] text-[#53627a]"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span>· {start}–{end} of {pagination.total}</span></div><div className="flex items-center gap-2"><span className="mr-1 text-[11px] text-[#8b96a8]">Page {page} of {Math.max(1, pagination.totalPages)}</span><Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="size-8 rounded-lg border-[#e2e7ee]"><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="size-8 rounded-lg border-[#e2e7ee]"><ChevronRight className="size-4" /></Button></div></div>
    </section>

    {editor && <ResourceEditor title={config.title} fields={config.fields} record={editor.record} semesterId={semesterId} busy={pending} onClose={() => setEditor(null)} onSave={saveRecord} />}
    {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172235]/35 p-4 backdrop-blur-sm"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-record-title" className="w-full max-w-md rounded-2xl border border-white bg-white p-6 shadow-2xl"><div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><Trash2 className="size-5" /></div><h2 id="delete-record-title" className="mt-4 text-lg font-semibold text-[#263650]">Delete this record?</h2><p className="mt-2 text-sm text-[#748198]">This action cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><Button variant="outline" disabled={pending} onClick={() => setDeleteTarget(null)} className="h-9 rounded-lg px-4 text-xs">Cancel</Button><Button variant="destructive" disabled={pending} onClick={() => void removeRecord()} className="h-9 rounded-lg px-4 text-xs">{pending && <LoaderCircle className="size-4 animate-spin" />} Delete</Button></div></section></div>}
  </div>;
}
