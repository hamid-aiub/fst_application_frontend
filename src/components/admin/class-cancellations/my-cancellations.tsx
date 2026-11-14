"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { CalendarDays, CircleAlert, LoaderCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { useSemester } from "@/components/admin/semester-context";
import { createResource, listResource, updateResource } from "@/resources/management/service/resource.service";
import type { GenericRecord } from "@/resources/management/types/resource.types";

const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const schema = z.object({
  classType: z.enum(["theory", "lab"], "Choose the class type."),
  courseId: z.string().uuid("Choose a course."),
  sectionId: z.string().uuid("Choose a section."),
  reason: z.string().trim().min(3, "Describe the reason for cancellation."),
  cancellationDate: z.string().min(1, "Choose the cancelled class date."),
  cancellationDay: z.string().optional(),
  makeupClassDatetime: z.string().optional(),
  makeupClassRoom: z.string().optional(),
  attachment: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
const blank: FormValues = { classType: "theory", courseId: "", sectionId: "", reason: "", cancellationDate: "", cancellationDay: "", makeupClassDatetime: "", makeupClassRoom: "", attachment: "" };
const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-[#dfe5ee] bg-white px-3 text-sm text-[#34435b] outline-none focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10";

function normalizeRecord(record: GenericRecord): FormValues {
  const date = typeof record.cancellationDate === "string" ? record.cancellationDate.slice(0, 10) : "";
  const datetime = typeof record.makeupClassDatetime === "string" ? record.makeupClassDatetime.slice(0, 16) : "";
  return {
    classType: record.classType === "lab" ? "lab" : "theory",
    courseId: String(record.courseId ?? (record.course as GenericRecord | undefined)?.id ?? ""),
    sectionId: String(record.sectionId ?? (record.section as GenericRecord | undefined)?.id ?? ""),
    reason: String(record.reason ?? ""), cancellationDate: date,
    cancellationDay: String(record.cancellationDay ?? ""), makeupClassDatetime: datetime,
    makeupClassRoom: String(record.makeupClassRoom ?? ""), attachment: String(record.attachment ?? ""),
  };
}

function CancellationEditor({
  record,
  courses,
  sections,
  busy,
  onClose,
  onSave,
}: {
  record: GenericRecord | null;
  courses: GenericRecord[];
  sections: GenericRecord[];
  busy: boolean;
  onClose: () => void;
  onSave: (values: FormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(() => record ? normalizeRecord(record) : blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const availableSections = sections.filter((section) => String(section.courseId ?? (section.course as GenericRecord | undefined)?.id ?? "") === values.courseId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    await onSave(parsed.data);
  }

  const field = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value, ...(key === "courseId" ? { sectionId: "" } : {}) }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172235]/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="cancellation-title" className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#edf0f5] px-6 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a88a1]">Class cancellation</p><h2 id="cancellation-title" className="mt-1 text-lg font-semibold text-[#20314d]">{record ? "Update your request" : "Request a cancellation"}</h2><p className="mt-1 text-xs text-[#8994a7]">Your request is linked to your account automatically.</p></div><button type="button" aria-label="Close" disabled={busy} onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#8b96a8] hover:bg-[#f3f5f9]"><X className="size-4" /></button></div>
      <form onSubmit={submit} className="max-h-[calc(92vh-78px)] space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-[#45556e]">Class type<select value={values.classType} onChange={(event) => field("classType", event.target.value)} className={inputClass}><option value="theory">Theory</option><option value="lab">Lab</option></select>{errors.classType && <span className="mt-1 block text-[11px] text-rose-600">{errors.classType}</span>}</label>
          <label className="text-xs font-medium text-[#45556e]">Course<select value={values.courseId} onChange={(event) => field("courseId", event.target.value)} className={inputClass}><option value="">Choose course</option>{courses.map((course) => <option key={course.id} value={course.id}>{String(course.courseCode ?? "")} · {String(course.name ?? "Course")}</option>)}</select>{errors.courseId && <span className="mt-1 block text-[11px] text-rose-600">{errors.courseId}</span>}</label>
          <label className="text-xs font-medium text-[#45556e]">Section<select value={values.sectionId} onChange={(event) => field("sectionId", event.target.value)} disabled={!values.courseId} className={inputClass}><option value="">Choose section</option>{availableSections.map((section) => <option key={section.id} value={section.id}>{String(section.name ?? "Section")}</option>)}</select>{errors.sectionId && <span className="mt-1 block text-[11px] text-rose-600">{errors.sectionId}</span>}</label>
          <label className="text-xs font-medium text-[#45556e]">Cancellation date<input type="date" value={values.cancellationDate} onChange={(event) => field("cancellationDate", event.target.value)} className={inputClass} />{errors.cancellationDate && <span className="mt-1 block text-[11px] text-rose-600">{errors.cancellationDate}</span>}</label>
          <label className="text-xs font-medium text-[#45556e]">Day of cancelled class<select value={values.cancellationDay} onChange={(event) => field("cancellationDay", event.target.value)} className={inputClass}><option value="">Choose day</option>{weekdays.map((day) => <option key={day} value={day}>{day[0] + day.slice(1).toLowerCase()}</option>)}</select></label>
          <label className="text-xs font-medium text-[#45556e]">Make-up class date and time<input type="datetime-local" value={values.makeupClassDatetime} onChange={(event) => field("makeupClassDatetime", event.target.value)} className={inputClass} /></label>
          <label className="text-xs font-medium text-[#45556e]">Make-up room<input value={values.makeupClassRoom} onChange={(event) => field("makeupClassRoom", event.target.value)} placeholder="Room, if arranged" className={inputClass} /></label>
          <label className="text-xs font-medium text-[#45556e]">Attachment URL<input value={values.attachment} onChange={(event) => field("attachment", event.target.value)} placeholder="Optional supporting document" className={inputClass} /></label>
        </div>
        <label className="block text-xs font-medium text-[#45556e]">Reason<textarea value={values.reason} onChange={(event) => field("reason", event.target.value)} rows={4} className="mt-1.5 w-full resize-y rounded-lg border border-[#dfe5ee] px-3 py-2 text-sm text-[#34435b] outline-none focus:border-[#8292df] focus:ring-4 focus:ring-[#6577d2]/10" />{errors.reason && <span className="mt-1 block text-[11px] text-rose-600">{errors.reason}</span>}</label>
        <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4"><Button type="button" variant="outline" disabled={busy} onClick={onClose} className="h-9 rounded-lg px-4 text-xs">Cancel</Button><Button type="submit" disabled={busy} className="h-9 gap-2 rounded-lg bg-[#293b5b] px-4 text-xs text-white hover:bg-[#344a70]">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{record ? "Save request" : "Submit request"}</Button></div>
      </form>
    </section>
  </div>;
}

export function MyCancellations() {
  const { semesterId, semester } = useSemester();
  const [records, setRecords] = useState<GenericRecord[]>([]);
  const [courses, setCourses] = useState<GenericRecord[]>([]);
  const [sections, setSections] = useState<GenericRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<GenericRecord | null | undefined>(undefined);

  const loadRecords = useCallback(async () => {
    if (!semesterId) { setRecords([]); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const [cancelResult, courseResult, sectionResult] = await Promise.all([
        listResource("class_cancellations", 1, 100, { semesterId }),
        listResource("courses", 1, 100, { semesterId }),
        listResource("sections", 1, 100, { semesterId }),
      ]);
      setRecords(cancelResult.data);
      setCourses(courseResult.data);
      setSections(sectionResult.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your cancellation requests could not be loaded.");
    } finally { setLoading(false); }
  }, [semesterId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  async function save(values: FormValues) {
    if (!semesterId) { setError("Choose a semester before submitting a request."); return; }
    setPending(true);
    setError("");
    try {
      const body = {
        ...values,
        semesterId,
        cancellationDay: values.cancellationDay || undefined,
        makeupClassDatetime: values.makeupClassDatetime || undefined,
        makeupClassRoom: values.makeupClassRoom || undefined,
        attachment: values.attachment || undefined,
      };
      if (editor) {
        await updateResource("class_cancellations", editor.id, body);
        setNotice("Your cancellation request was updated.");
      } else {
        await createResource("class_cancellations", body);
        setNotice("Your cancellation request was submitted.");
      }
      setEditor(undefined);
      await loadRecords();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The cancellation request could not be saved.");
    } finally { setPending(false); }
  }

  const columns: DataColumn<GenericRecord>[] = [
    { key: "cancellationDate", label: "Class date", render: (record) => record.cancellationDate ? new Date(String(record.cancellationDate)).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—" },
    { key: "course.courseCode", label: "Course / section", render: (record) => <div><p className="font-semibold text-[#34455f]">{String((record.course as GenericRecord | undefined)?.courseCode ?? (record.course as GenericRecord | undefined)?.name ?? "—")}</p><p className="mt-0.5 text-[10px] text-[#98a2b1]">Section {String((record.section as GenericRecord | undefined)?.name ?? "—")}</p></div> },
    { key: "classType", label: "Type", render: (record) => String(record.classType ?? "—") },
    { key: "reason", label: "Reason", render: (record) => <span className="line-clamp-2">{String(record.reason ?? "—")}</span> },
    { key: "isApproved", label: "Status", render: (record) => <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${record.isApproved === true ? "bg-[#edf7f0] text-[#45805b]" : "bg-[#fff7e8] text-[#a8792e]"}`}>{record.isApproved === true ? "Approved" : "Pending"}</span> },
    { key: "actions", label: "Actions", sortable: false, className: "text-right", render: (record) => <div onClick={(event) => event.stopPropagation()} className="flex justify-end"><Button variant="outline" size="sm" onClick={() => setEditor(record)} className="h-8 rounded-lg border-[#e5e9f0] px-2.5 text-[11px] text-[#586985]">Edit</Button></div> },
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8793a8]">Teaching schedule / Requests</p><h1 className="text-[30px] font-semibold tracking-[-0.045em] text-[#1d2b42]">My class cancellations</h1><p className="mt-1.5 text-sm text-[#78859a]">Submit a cancellation and track your own requests for {semester?.name ?? "the selected semester"}.</p></div><Button disabled={!semesterId || pending} onClick={() => setEditor(null)} className="h-10 gap-2 rounded-lg bg-[#293b5b] px-4 text-xs font-semibold text-white hover:bg-[#344a70]"><Plus className="size-4" />New request</Button></div>
    {(error || notice) && <div role={error ? "alert" : "status"} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#d9e9dd] bg-[#f0f8f2] text-[#477958]"}`}>{error ? <CircleAlert className="size-4" /> : <CalendarDays className="size-4" />}{error || notice}<button className="ml-auto" onClick={() => { setError(""); setNotice(""); }} aria-label="Dismiss"><X className="size-4" /></button></div>}
    {!semesterId && <div className="rounded-xl border border-[#eadfc8] bg-[#fffaf0] px-4 py-3 text-sm text-[#725c31]">No current semester is selected. Please contact your administrator to configure semester dates.</div>}
    <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)]"><div className="border-b border-[#edf0f5] px-5 py-4"><h2 className="text-sm font-semibold text-[#293952]">Your requests</h2><p className="mt-0.5 text-[11px] text-[#8d98aa]">Only requests linked to your account are shown.</p></div><DataTable rows={records} columns={columns} loading={loading} emptyTitle="No cancellations yet" emptyDescription="New requests for this semester will appear here." /></section>
    {editor !== undefined && <CancellationEditor record={editor} courses={courses} sections={sections} busy={pending} onClose={() => { if (!pending) setEditor(undefined); }} onSave={save} />}
  </div>;
}
