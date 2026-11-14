"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { CircleAlert, KeyRound, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/resources/auth/service/auth.service";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "Use at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your new password."),
}).refine((values) => values.newPassword === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "The new passwords do not match.",
}).refine((values) => values.currentPassword !== values.newPassword, {
  path: ["newPassword"],
  message: "Choose a password different from your current one.",
});

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    const parsed = passwordSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Password could not be changed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-[#dfe5ee] px-3 text-sm text-[#34435b] outline-none focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10";

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172235]/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="password-dialog-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-white bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#edf0f5] px-6 py-5"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#eef1ff] text-[#596fc7]"><KeyRound className="size-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a88a1]">Account security</p><h2 id="password-dialog-title" className="mt-1 text-lg font-semibold text-[#20314d]">Change password</h2></div></div><button type="button" aria-label="Close" disabled={busy} onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#8b96a8] hover:bg-[#f3f5f9]"><X className="size-4" /></button></div>
      {saved ? <div className="p-6"><div role="status" className="rounded-xl border border-[#d9e9dd] bg-[#f0f8f2] px-4 py-3 text-sm text-[#477958]">Your password has been changed.</div><div className="mt-5 flex justify-end"><Button onClick={onClose} className="h-9 rounded-lg bg-[#293b5b] px-4 text-xs text-white hover:bg-[#344a70]">Done</Button></div></div> : <form onSubmit={submit} className="space-y-4 px-6 py-5">
        {[{ key: "currentPassword", label: "Current password", autocomplete: "current-password" }, { key: "newPassword", label: "New password", autocomplete: "new-password" }, { key: "confirmPassword", label: "Confirm new password", autocomplete: "new-password" }].map(({ key, label, autocomplete }) => <label key={key} className="block text-xs font-medium text-[#45556e">{label}<input type="password" autoComplete={autocomplete} value={values[key as keyof typeof values]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className={inputClass} />{fieldErrors[key] && <span className="mt-1 block text-[11px] text-rose-600">{fieldErrors[key]}</span>}</label>)}
        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</div>}
        <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4"><Button type="button" variant="outline" disabled={busy} onClick={onClose} className="h-9 rounded-lg px-4 text-xs">Cancel</Button><Button type="submit" disabled={busy} className="h-9 rounded-lg bg-[#293b5b] px-4 text-xs text-white hover:bg-[#344a70]">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}Update password</Button></div>
      </form>}
    </section>
  </div>;
}
