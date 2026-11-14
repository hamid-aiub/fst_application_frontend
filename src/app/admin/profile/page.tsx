"use client";

import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { BadgeCheck, CircleAlert, LoaderCircle, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/admin/user-avatar";
import { useAdminUser, useRefreshAdminUser } from "@/components/admin/admin-shell";
import { getOwnProfile, updateOwnProfile } from "@/resources/profile/service/profile.service";
import type { OwnProfile } from "@/resources/profile/types/profile.types";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters for your name."),
  department: z.string().trim().max(150, "Department must be 150 characters or fewer."),
  faculty: z.string().trim().max(150, "Faculty must be 150 characters or fewer."),
  phoneNumber: z.string().trim().max(50, "Phone number must be 50 characters or fewer."),
  profileImage: z.string().trim().max(500, "Image path must be 500 characters or fewer."),
  type: z.enum(["full-time", "part-time", ""]),
  status: z.enum(["active", "on-leave", "resign", ""]),
  joiningDate: z.string(),
});
type ProfileValues = z.infer<typeof profileSchema>;
const profileType = (value?: string | null): ProfileValues["type"] => value === "full-time" || value === "part-time" ? value : "";
const profileStatus = (value?: string | null): ProfileValues["status"] => value === "active" || value === "on-leave" || value === "resign" ? value : "";
const fieldClass = "mt-1.5 h-11 w-full rounded-xl border border-[#dfe5ee] bg-white px-3.5 text-sm text-[#34435b] outline-none transition placeholder:text-[#a2abba] focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10";

export default function MyProfilePage() {
  const user = useAdminUser();
  const refreshUser = useRefreshAdminUser();
  const [values, setValues] = useState<ProfileValues>({
    name: user?.name ?? "",
    department: user?.profile?.department ?? "",
    faculty: user?.profile?.faculty ?? "",
    phoneNumber: user?.profile?.phoneNumber ?? "",
    profileImage: user?.profile?.profileImage ?? "",
    type: profileType(user?.profile?.type),
    status: profileStatus(user?.profile?.status),
    joiningDate: user?.profile?.joiningDate?.slice(0, 10) ?? "",
  });
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getOwnProfile().then((result) => {
      if (!active) return;
      setProfile(result);
      if (result) setValues((current) => ({
        ...current,
        profileImage: result.profileImage ?? "",
        department: result.department ?? "",
        faculty: result.faculty ?? "",
        type: profileType(result.type),
        status: profileStatus(result.status),
        joiningDate: result.joiningDate?.slice(0, 10) ?? "",
        phoneNumber: result.phoneNumber ?? "",
      }));
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Your profile could not be loaded.");
    }).finally(() => { if (active) setLoadingProfile(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const { type, status, joiningDate, ...basic } = parsed.data;
      const updated = await updateOwnProfile({
        ...basic,
        type: type || null,
        status: status || null,
        joiningDate: joiningDate || null,
      });
      setProfile(updated);
      await refreshUser();
      setNotice("Your profile has been updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your profile could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  const setField = (key: keyof ProfileValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  return <div className="mx-auto max-w-5xl space-y-6">
    <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8491a6]">Account</p><h1 className="text-[30px] font-semibold tracking-[-0.045em] text-[#1d2b42]">My profile</h1><p className="mt-1.5 text-sm text-[#78859a]">Keep your contact and faculty details up to date.</p></div>

    {(error || notice) && <div role={error ? "alert" : "status"} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#d9e9dd] bg-[#f0f8f2] text-[#477958]"}`}>{error ? <CircleAlert className="size-4 shrink-0" /> : <BadgeCheck className="size-4 shrink-0" />}{error || notice}</div>}

    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(270px,0.8fr)]">
      <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)]">
        <div className="flex items-center gap-3 border-b border-[#edf0f5] px-5 py-4"><span className="grid size-9 place-items-center rounded-xl bg-[#eef1ff] text-[#586dc9]"><UserRound className="size-4" /></span><div><h2 className="text-sm font-semibold text-[#293952]">Personal details</h2><p className="mt-0.5 text-[11px] text-[#8d98aa]">Visible information on your account</p></div></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-xs font-medium text-[#45556e]">Full name<input autoComplete="name" value={values.name} onChange={(event) => setField("name", event.target.value)} className={fieldClass} />{errors.name && <span className="mt-1 block text-[11px] text-rose-600">{errors.name}</span>}</label>
          <label className="text-xs font-medium text-[#45556e]">Phone number<input autoComplete="tel" value={values.phoneNumber} onChange={(event) => setField("phoneNumber", event.target.value)} placeholder="Add a phone number" className={fieldClass} />{errors.phoneNumber && <span className="mt-1 block text-[11px] text-rose-600">{errors.phoneNumber}</span>}</label>
          <label className="text-xs font-medium text-[#45556e]">Department<input value={values.department} onChange={(event) => setField("department", event.target.value)} placeholder="Department" className={fieldClass} />{errors.department && <span className="mt-1 block text-[11px] text-rose-600">{errors.department}</span>}</label>
          <label className="text-xs font-medium text-[#45556e]">Faculty<input value={values.faculty} onChange={(event) => setField("faculty", event.target.value)} placeholder="Faculty" className={fieldClass} />{errors.faculty && <span className="mt-1 block text-[11px] text-rose-600">{errors.faculty}</span>}</label>
          <label className="text-xs font-medium text-[#45556e]">Employment type<select value={values.type} onChange={(event) => setField("type", event.target.value)} className={fieldClass}><option value="">Not set</option><option value="full-time">Full time</option><option value="part-time">Part time</option></select></label>
          <label className="text-xs font-medium text-[#45556e]">Profile status<select value={values.status} onChange={(event) => setField("status", event.target.value)} className={fieldClass}><option value="">Not set</option><option value="active">Active</option><option value="on-leave">On leave</option><option value="resign">Resigned</option></select></label>
          <label className="text-xs font-medium text-[#45556e]">Joining date<input type="date" value={values.joiningDate} onChange={(event) => setField("joiningDate", event.target.value)} className={fieldClass} /></label>
          <label className="text-xs font-medium text-[#45556e] sm:col-span-2">Profile image URL or storage path<input value={values.profileImage} onChange={(event) => setField("profileImage", event.target.value)} placeholder="Paste an image URL or uploaded file path" className={fieldClass} />{errors.profileImage && <span className="mt-1 block text-[11px] text-rose-600">{errors.profileImage}</span>}<span className="mt-1.5 block text-[11px] font-normal text-[#95a0b0]">This field accepts an image URL or path already stored in the file service.</span></label>
        </div>
        <div className="flex items-center justify-between border-t border-[#edf0f5] bg-[#fcfcfe] px-5 py-4"><span className="text-[11px] text-[#929daf]">Changes are saved to your own account only.</span><Button type="submit" disabled={saving} className="h-10 gap-2 rounded-lg bg-[#293b5b] px-4 text-xs font-semibold text-white hover:bg-[#344a70]">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Save profile</Button></div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)]"><h2 className="text-sm font-semibold text-[#293952]">Profile preview</h2><div className="mt-5 flex items-center gap-3"><UserAvatar name={values.name} profileImage={values.profileImage} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#2b3a54]">{values.name || "Your name"}</p><p className="truncate text-xs text-[#8490a4]">{user?.email}</p></div></div><div className="mt-5 space-y-2.5 border-t border-[#edf0f5] pt-4 text-xs"><div className="flex justify-between gap-3"><span className="text-[#929daf]">Employee ID</span><span className="font-medium text-[#53627a]">{user?.employeeId || "—"}</span></div><div className="flex justify-between gap-3"><span className="text-[#929daf]">Role</span><span className="font-medium text-[#53627a]">{user?.roles.map((role) => role.replaceAll("_", " ")).join(", ") || "—"}</span></div></div></section>
        <section className="rounded-2xl border border-[#e7ebf2] bg-white p-5"><h2 className="text-sm font-semibold text-[#293952]">Sign-in details</h2><dl className="mt-4 space-y-3 text-xs"><div><dt className="text-[#929daf]">University email</dt><dd className="mt-1 break-all font-medium text-[#53627a]">{user?.email || "—"}</dd></div><div><dt className="text-[#929daf]">Employee ID</dt><dd className="mt-1 font-medium text-[#53627a]">{user?.employeeId || "—"}</dd></div></dl><p className="mt-4 border-t border-[#edf0f5] pt-3 text-[11px] leading-5 text-[#929daf]">For sign-in or employee identity changes, contact your FST administrator.</p></section>
        <section className="rounded-2xl border border-[#e7ebf2] bg-white p-5"><h2 className="text-sm font-semibold text-[#293952]">Profile record</h2><dl className="mt-4 space-y-3 text-xs"><div><dt className="text-[#929daf]">Profile ID</dt><dd className="mt-1 break-all font-medium text-[#53627a]">{loadingProfile ? "Loading…" : profile?.id || "Not created"}</dd></div><div><dt className="text-[#929daf]">User ID</dt><dd className="mt-1 break-all font-medium text-[#53627a]">{profile?.userId || user?.id || "—"}</dd></div><div><dt className="text-[#929daf]">Created at</dt><dd className="mt-1 font-medium text-[#53627a]">{profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "—"}</dd></div><div><dt className="text-[#929daf]">Last updated</dt><dd className="mt-1 font-medium text-[#53627a]">{profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : "—"}</dd></div></dl></section>
      </aside>
    </form>
  </div>;
}
