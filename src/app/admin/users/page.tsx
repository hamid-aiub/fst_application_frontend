"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { ChevronLeft, ChevronRight, CircleAlert, FileSpreadsheet, LoaderCircle, MoreHorizontal, Plus, Search, ShieldBan, Trash2, UserRoundCog, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/admin/user-avatar";
import { useAdminUser } from "@/components/admin/admin-shell";
import { hasPermission, signOutEverywhere } from "@/resources/auth/service/auth.service";
import { createUser, deleteUser, importUsers, listUsers, updateUser } from "@/resources/users/service/users.service";
import type { UserImportResult, UserRecord } from "@/resources/users/types/users.types";

const formSchema = z.object({
  employeeId: z.string().trim().min(1, "Enter an employee ID."),
  name: z.string().trim().min(2, "Enter the user’s full name."),
  email: z.string().trim().email("Enter a valid email address."),
});
type FormValues = { employeeId: string; name: string; email: string; password: string; isActive: boolean };
const emptyForm: FormValues = { employeeId: "", name: "", email: "", password: "", isActive: true };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";

function StatusBadge({ active }: { active?: boolean | null }) {
  const style = active === true ? "bg-[#edf7f0] text-[#45805b]" : active === false ? "bg-[#f3f4f6] text-[#788396]" : "bg-[#fff7e8] text-[#a8792e]";
  const text = active === true ? "Active" : active === false ? "Inactive" : "Not set";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}><span className={`size-1.5 rounded-full ${active === true ? "bg-[#53a370]" : active === false ? "bg-[#9ba4b2]" : "bg-[#c89338]"}`} />{text}</span>;
}

function UserEditor({
  user,
  busy,
  onClose,
  onSave,
}: {
  user: UserRecord | null;
  busy: boolean;
  onClose: () => void;
  onSave: (values: FormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(user ? {
    employeeId: user.employeeId ?? "", name: user.name ?? "", email: user.email ?? "", password: "", isActive: user.isActive ?? true,
  } : emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = formSchema.safeParse(values);
    const next: Record<string, string> = {};
    if (!parsed.success) for (const issue of parsed.error.issues) next[String(issue.path[0])] ||= issue.message;
    if (!user && values.password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length === 0) await onSave(values);
  }

  const update = (key: keyof FormValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172235]/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="user-editor-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-white bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#edf0f5] px-6 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a88a1]">User management</p><h2 id="user-editor-title" className="mt-1 text-lg font-semibold text-[#20314d]">{user ? "Edit user details" : "Add a user"}</h2></div><button type="button" aria-label="Close" disabled={busy} onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#8b96a8] hover:bg-[#f3f5f9]"><X className="size-4" /></button></div>
      <form onSubmit={submit} className="space-y-4 px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-[#45556e]">Employee ID<input autoFocus value={values.employeeId} onChange={(event) => update("employeeId", event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe5ee] px-3 text-sm outline-none focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10" placeholder="0000-0000-0" />{errors.employeeId && <span className="mt-1 block text-[11px] text-rose-600">{errors.employeeId}</span>}</label>
          <label className="text-xs font-medium text-[#45556e]">Full name<input value={values.name} onChange={(event) => update("name", event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe5ee] px-3 text-sm outline-none focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10" placeholder="User name" />{errors.name && <span className="mt-1 block text-[11px] text-rose-600">{errors.name}</span>}</label>
        </div>
        <label className="block text-xs font-medium text-[#45556e]">Email address<input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe5ee] px-3 text-sm outline-none focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10" placeholder="name@aiub.edu" />{errors.email && <span className="mt-1 block text-[11px] text-rose-600">{errors.email}</span>}</label>
        {!user && <label className="block text-xs font-medium text-[#45556e]">Initial password<input type="password" autoComplete="new-password" value={values.password} onChange={(event) => update("password", event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe5ee] px-3 text-sm outline-none focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10" placeholder="At least 8 characters" />{errors.password && <span className="mt-1 block text-[11px] text-rose-600">{errors.password}</span>}</label>}
        <label className="flex cursor-pointer items-center gap-2.5 text-xs text-[#52617a]"><input type="checkbox" checked={values.isActive} onChange={(event) => update("isActive", event.target.checked)} className="size-4 accent-[#5268c6]" /> Account is active</label>
        <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4"><Button type="button" variant="outline" disabled={busy} onClick={onClose} className="h-9 rounded-lg px-4 text-xs">Cancel</Button><Button type="submit" disabled={busy} className="h-9 rounded-lg bg-[#293b5b] px-4 text-xs text-white hover:bg-[#344a70]">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{user ? "Save changes" : "Create user"}</Button></div>
      </form>
    </section>
  </div>;
}

export default function AdminUsersPage() {
  const admin = useAdminUser();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{ user: UserRecord | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [importReport, setImportReport] = useState<UserImportResult | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  const permissions = admin?.permissions ?? [];
  const canRead = hasPermission(permissions, "users", "read");
  const canCreate = hasPermission(permissions, "users", "create");
  const canUpdate = hasPermission(permissions, "users", "update");
  const canDelete = hasPermission(permissions, "users", "delete");

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError("");
    try {
      const result = await listUsers({ page, limit, search: query, status });
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, query, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadUsers(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  async function saveUser(values: FormValues) {
    setPending(true);
    setError("");
    try {
      if (editor?.user) {
        await updateUser(editor.user.id, { employeeId: values.employeeId.trim(), name: values.name.trim(), email: values.email.trim(), isActive: values.isActive });
        setNotice("User details updated.");
      } else {
        await createUser({ employeeId: values.employeeId.trim(), name: values.name.trim(), email: values.email.trim(), password: values.password, isActive: values.isActive });
        setNotice("User account created successfully.");
      }
      setEditor(null);
      await loadUsers();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setPending(false);
    }
  }

  async function toggleStatus(user: UserRecord) {
    if (user.isActive == null) return;
    setPending(true);
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      setNotice(`${user.name || "User"} is now ${user.isActive ? "inactive" : "active"}.`);
      await loadUsers();
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setPending(false); }
  }

  async function removeUser() {
    if (!deleteTarget) return;
    setPending(true);
    try {
      await deleteUser(deleteTarget.id);
      setNotice(`${deleteTarget.name || "User"} has been removed.`);
      setDeleteTarget(null);
      if (users.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadUsers();
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setPending(false); }
  }

  async function revokeSessions(user: UserRecord) {
    setPending(true);
    try {
      const result = await signOutEverywhere(user.id);
      setNotice(`${result.revokedSessions} session${result.revokedSessions === 1 ? "" : "s"} revoked for ${user.name || "this user"}.`);
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setPending(false); }
  }

  async function handleImport(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) { setError("Choose an Excel workbook with the .xlsx extension."); return; }
    setPending(true);
    setError("");
    try {
      const result = await importUsers(file);
      setImportReport(result);
      setNotice(`${result.createdCount} imported · ${result.skippedCount} skipped.`);
      setPage(1);
      await loadUsers();
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setPending(false); if (importInput.current) importInput.current.value = ""; }
  }

  if (!canRead) return <section className="mx-auto mt-12 max-w-xl rounded-2xl border border-[#e8edf4] bg-white p-8 text-center shadow-sm"><CircleAlert className="mx-auto size-8 text-[#bd8152]" /><h1 className="mt-4 text-lg font-semibold text-[#253651]">User directory access required</h1><p className="mt-2 text-sm text-[#7d899d]">Your account does not have the users.read permission.</p></section>;

  const start = pagination.total ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, pagination.total);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a96a9]"><span>Administration</span><span className="text-[#c4cad4]">/</span><span className="text-[#5e6fc5]">Users</span></div><h1 className="text-[30px] font-semibold tracking-[-0.045em] text-[#1d2b42]">User directory</h1><p className="mt-1.5 text-sm text-[#78859a]">Manage accounts and access across the Faculty of Science &amp; Technology.</p></div>
      {canCreate && <div className="flex gap-2"><input ref={importInput} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => void handleImport(event.currentTarget.files?.[0])} /><Button variant="outline" disabled={pending} onClick={() => importInput.current?.click()} className="h-10 gap-2 rounded-lg border-[#dfe5ee] bg-white px-3.5 text-xs font-medium text-[#4b5d77]"><FileSpreadsheet className="size-4 text-[#548a69]" /> Import Excel</Button><Button disabled={pending} onClick={() => setEditor({ user: null })} className="h-10 gap-2 rounded-lg bg-[#293b5b] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#344a70]"><Plus className="size-4" /> Add user</Button></div>}
    </div>

    {(error || notice) && <div role={error ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#d9e9dd] bg-[#f0f8f2] text-[#477958]"}`}>{error ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <span className="mt-1 size-2 shrink-0 rounded-full bg-[#63a174]" />}<span className="flex-1">{error || notice}</span><button onClick={() => { setError(""); setNotice(""); }} aria-label="Dismiss message" className="rounded p-0.5 opacity-70 hover:opacity-100"><X className="size-4" /></button></div>}
    {importReport && importReport.skippedRows.length > 0 && <section className="rounded-xl border border-[#eadfc8] bg-[#fffaf0] p-4 text-sm text-[#725c31]"><div className="flex items-center justify-between"><p className="font-semibold">Import report · {importReport.skippedCount} skipped rows</p><button onClick={() => setImportReport(null)} aria-label="Close import report"><X className="size-4" /></button></div><ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs">{importReport.skippedRows.map((row, index) => <li key={`${row.row}-${index}`}>Row {row.row}: {row.reason}</li>)}</ul></section>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <section className="rounded-xl border border-[#e7ebf2] bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-[#7e8a9e]">Matching users</span><span className="grid size-8 place-items-center rounded-lg bg-[#eef1ff] text-[#5d70ca]"><UsersRound className="size-4" /></span></div><p className="mt-3 text-2xl font-semibold text-[#20304a]">{loading ? "—" : pagination.total.toLocaleString()}</p><p className="mt-1 text-[11px] text-[#9aa4b3]">Based on current search and filters</p></section>
      <section className="rounded-xl border border-[#e7ebf2] bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-[#7e8a9e]">Active on this page</span><span className="grid size-8 place-items-center rounded-lg bg-[#edf7f0] text-[#5b9a71]"><UserRoundCog className="size-4" /></span></div><p className="mt-3 text-2xl font-semibold text-[#20304a]">{loading ? "—" : users.filter((user) => user.isActive === true).length}</p><p className="mt-1 text-[11px] text-[#9aa4b3]">Of {users.length} visible accounts</p></section>
      <section className="hidden rounded-xl border border-[#e7ebf2] bg-white p-4 xl:block"><p className="text-xs font-medium text-[#7e8a9e]">Current page</p><p className="mt-3 text-2xl font-semibold text-[#20304a]">{loading ? "—" : `${page} / ${Math.max(1, pagination.totalPages)}`}</p><p className="mt-1 text-[11px] text-[#9aa4b3]">Showing {start}–{end} of {pagination.total}</p></section>
    </div>

    <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] px-4 py-4 sm:px-5"><div><h2 className="text-sm font-semibold text-[#293952]">All users</h2><p className="mt-0.5 text-[11px] text-[#8d98aa]">Search, review, and manage user accounts.</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><label className="relative min-w-[220px] flex-1 sm:flex-none"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b2]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, ID, email, phone" className="h-9 w-full rounded-lg border border-[#e0e6ef] bg-white pl-9 pr-3 text-xs text-[#34435b] outline-none placeholder:text-[#a3adbb] focus:border-[#91a0e2] focus:ring-4 focus:ring-[#6679d2]/10 sm:w-[255px]" /></label><select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} aria-label="Filter by account status" className="h-9 rounded-lg border border-[#e0e6ef] bg-white px-3 text-xs text-[#52617a] outline-none focus:border-[#91a0e2]"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-left"><thead><tr className="bg-[#fafbfd] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8995a7]"><th className="px-5 py-3">User</th><th className="px-4 py-3">Employee ID</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="w-[154px] px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-[#f0f2f6]">{loading ? Array.from({ length: 6 }, (_, index) => <tr key={index} className="animate-pulse"><td colSpan={6} className="px-5 py-5"><div className="h-5 rounded bg-[#f0f2f6]" /></td></tr>) : users.length ? users.map((user) => <tr key={user.id} className="group transition hover:bg-[#fafbfe]"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><UserAvatar name={user.name} profileImage={user.profile?.profileImage} /><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[#293952]">{user.name || "Unnamed user"}</p><p className="mt-0.5 truncate text-[10px] text-[#9aa4b2]">{user.profile?.department || "Faculty account"}</p></div></div></td><td className="px-4 py-3.5 text-xs font-medium tabular-nums text-[#576780]">{user.employeeId || "—"}</td><td className="px-4 py-3.5 text-xs text-[#62718a]">{user.email || "—"}</td><td className="px-4 py-3.5 text-xs text-[#62718a]">{user.profile?.phoneNumber || "—"}</td><td className="px-4 py-3.5"><StatusBadge active={user.isActive} /></td><td className="px-4 py-3.5"><div className="flex justify-end gap-1.5">{canUpdate && <Button variant="outline" size="sm" aria-label={`Edit ${user.name || "user"}`} onClick={() => setEditor({ user })} className="h-8 rounded-lg border-[#e5e9f0] px-2.5 text-[11px] text-[#586985]">Edit</Button>}{canUpdate && user.isActive != null && <Button variant="ghost" size="icon-sm" aria-label={user.isActive ? `Deactivate ${user.name || "user"}` : `Activate ${user.name || "user"}`} disabled={pending} onClick={() => void toggleStatus(user)} className="rounded-lg text-[#74819a] hover:bg-[#f2f4f8]"><UserRoundCog className="size-4" /></Button>}<details className="relative"><summary aria-label={`More actions for ${user.name || "user"}`} className="grid size-8 cursor-pointer list-none place-items-center rounded-lg text-[#8591a3] hover:bg-[#f2f4f8]"><MoreHorizontal className="size-4" /></summary><div className="absolute right-0 top-9 z-10 w-48 rounded-xl border border-[#e7ebf2] bg-white p-1.5 shadow-lg">{admin?.roles.includes("admin") && <button disabled={pending} onClick={() => void revokeSessions(user)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#53627a] hover:bg-[#f6f7fa] disabled:opacity-50"><ShieldBan className="size-3.5" /> Sign out everywhere</button>}{canDelete && <button disabled={pending} onClick={() => setDeleteTarget(user)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="size-3.5" /> Delete user</button>}</div></details></div></td></tr>) : <tr><td colSpan={6} className="px-5 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f2f4fa] text-[#7786a1]"><UsersRound className="size-5" /></div><p className="mt-3 text-sm font-semibold text-[#3d4d67]">No users found</p><p className="mt-1 text-xs text-[#8f9aac]">Try another search or change the status filter.</p></td></tr>}</tbody>
      </table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f5] px-4 py-3.5 sm:px-5"><div className="flex items-center gap-2 text-[11px] text-[#8b96a8]">Rows per page <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="h-7 rounded-md border border-[#e2e7ee] bg-white px-1.5 text-[11px] text-[#53627a]"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span className="ml-1">· {start}–{end} of {pagination.total}</span></div><div className="flex items-center gap-2"><span className="mr-1 text-[11px] text-[#8b96a8]">Page {page} of {Math.max(1, pagination.totalPages)}</span><Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="size-8 rounded-lg border-[#e2e7ee]"><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="size-8 rounded-lg border-[#e2e7ee]"><ChevronRight className="size-4" /></Button></div></div>
    </section>

    {editor && <UserEditor user={editor.user} busy={pending} onClose={() => setEditor(null)} onSave={saveUser} />}
    {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172235]/35 p-4 backdrop-blur-sm"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-2xl border border-white bg-white p-6 shadow-2xl"><div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><Trash2 className="size-5" /></div><h2 id="delete-title" className="mt-4 text-lg font-semibold text-[#263650]">Delete this user?</h2><p className="mt-2 text-sm leading-6 text-[#748198]">This removes <strong className="font-semibold text-[#43536d]">{deleteTarget.name || "this account"}</strong> and cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><Button variant="outline" disabled={pending} onClick={() => setDeleteTarget(null)} className="h-9 rounded-lg px-4 text-xs">Keep user</Button><Button variant="destructive" disabled={pending} onClick={() => void removeUser()} className="h-9 rounded-lg px-4 text-xs">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete user</Button></div></section></div>}
  </div>;
}
