"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, FileText, LoaderCircle } from "lucide-react";
import { getResource } from "@/resources/management/service/resource.service";
import type { GenericRecord } from "@/resources/management/types/resource.types";

type Attachment = { id: string; attachmentPath?: string | null; createdAt?: string | null };

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    const record = value as GenericRecord;
    return String(record.name ?? record.email ?? "—");
  }
  return String(value);
}

export default function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<GenericRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getResource("tasks", taskId)
      .then((result) => { if (active) setTask(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Task details could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-[#758198]"><LoaderCircle className="size-5 animate-spin text-[#596fc7]" />Loading task details…</div>;
  if (error || !task) return <section role="alert" className="rounded-2xl border border-rose-200 bg-white p-7 text-sm text-rose-700">{error || "Task not found."}<Link href="/admin/tasks" className="ml-2 font-semibold underline">Back to tasks</Link></section>;

  const attachments = Array.isArray(task.attachments) ? task.attachments as Attachment[] : [];
  const fields = [
    ["Status", task.status], ["Category", task.category], ["Priority", task.priority],
    ["Assignee", task.assignee], ["Faculty group", task.group], ["Semester", task.semester],
    ["Due date", task.dueDate], ["Created", task.createdAt], ["Last updated", task.updatedAt],
  ];

  return <div className="mx-auto max-w-5xl space-y-6">
    <Link href="/admin/tasks" className="inline-flex items-center gap-2 text-xs font-medium text-[#75839a] hover:text-[#4c61c1]"><ArrowLeft className="size-4" />Back to tasks</Link>
    <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)]">
      <div className="border-b border-[#edf0f5] px-5 py-6 sm:px-7"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8793a8]">Task details</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-[#1e2c43]">{display(task.name)}</h1><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#66748a]">{display(task.description)}</p></div>
      <dl className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:px-7">{fields.map(([label, value]) => <div key={String(label)}><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98a2b1]">{String(label)}</dt><dd className="mt-1 text-sm font-medium text-[#40516c]">{display(value)}</dd></div>)}</dl>
      <div className="grid gap-4 border-t border-[#edf0f5] p-5 sm:grid-cols-2 sm:px-7"><div><h2 className="text-xs font-semibold text-[#687791]">User remark</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#51617a]">{display(task.userRemark)}</p></div><div><h2 className="text-xs font-semibold text-[#687791]">Assignee remark</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#51617a]">{display(task.assigneeRemark)}</p></div></div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)]">
      <div className="flex items-center justify-between border-b border-[#edf0f5] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#293952]">Attachments</h2><p className="mt-0.5 text-[11px] text-[#8d98aa]">{attachments.length} file{attachments.length === 1 ? "" : "s"} attached to this task</p></div><FileText className="size-4 text-[#8190bd]" /></div>
      {attachments.length ? <ul className="divide-y divide-[#f0f2f6]">{attachments.map((attachment) => {
        const path = attachment.attachmentPath ?? "";
        const isLink = /^https?:\/\//i.test(path) || path.startsWith("/");
        return <li key={attachment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f1f3ff] text-[#5e70c5]"><FileText className="size-4" /></span><div className="min-w-0"><p className="break-all text-sm font-medium text-[#43536d]">{path || "Unnamed attachment"}</p>{attachment.createdAt && <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#929daf]"><CalendarDays className="size-3" />{new Date(attachment.createdAt).toLocaleDateString()}</p>}</div></div>{isLink && <a href={path} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#5268c6] hover:underline">Open file</a>}</li>;
      })}</ul> : <div className="px-5 py-12 text-center"><p className="text-sm font-semibold text-[#3d4d67]">No attachments yet</p><p className="mt-1 text-xs text-[#8f9aac]">Files linked to this task will appear here.</p></div>}
    </section>
  </div>;
}
