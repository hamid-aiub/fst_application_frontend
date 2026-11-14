"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, Clock3, Mail, Phone, UserRound } from "lucide-react";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { UserAvatar } from "@/components/admin/user-avatar";
import { useSemester } from "@/components/admin/semester-context";
import { getUser } from "@/resources/users/service/users.service";
import type { UserDetail } from "@/resources/users/types/users.types";

function dateLabel(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function scheduleItems(section: NonNullable<UserDetail["sections"]>[number]) {
  return [1, 2, 3].flatMap((number) => {
    const values = section as unknown as Record<string, string | null | undefined>;
    const day = values[`day${number}`];
    const time = values[`time${number}`];
    const room = values[`room${number}`];
    return day || time || room ? [{ day: day || "Day not set", time: time || "Time not set", room: room || "Room not set" }] : [];
  });
}

export default function UserDetailsPage() {
  const params = useParams<{ userId: string }>();
  const { semesterId, semester } = useSemester();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getUser(params.userId).then((result) => { if (active) setUser(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "User details could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.userId]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-[#758198]"><Clock3 className="size-5 animate-pulse text-[#596fc7]" />Loading user details…</div>;
  if (error || !user) return <section role="alert" className="rounded-2xl border border-rose-200 bg-white p-7 text-sm text-rose-700"><CircleAlert className="mb-2 size-5" />{error || "User not found."}<Link href="/admin/users" className="ml-2 font-semibold underline">Back to users</Link></section>;

  const sections = (user.sections ?? []).filter((item) => !semesterId || item.semesterId === semesterId || item.semester?.id === semesterId);
  const cancellations = (user.classCancellations ?? []).filter((item) => !semesterId || item.semesterId === semesterId || item.semester?.id === semesterId);
  const approvedCount = cancellations.filter((item) => item.isApproved === true).length;
  const pendingCount = cancellations.filter((item) => item.isApproved !== true).length;
  const sectionColumns: DataColumn<NonNullable<UserDetail["sections"]>[number]>[] = [
    { key: "course.name", label: "Course", render: (item) => <div><p className="font-semibold text-[#34455f]">{item.course?.name || "—"}</p><p className="mt-0.5 text-[10px] text-[#98a2b1]">{item.course?.courseCode || ""}</p></div> },
    { key: "name", label: "Section", render: (item) => <span className="font-medium text-[#53627a]">{item.name || "—"}</span> },
    { key: "schedule", label: "Days · times · rooms", sortable: false, render: (item) => <div className="flex flex-col gap-1">{scheduleItems(item).length ? scheduleItems(item).map((meeting, index) => <span key={index} className="text-[11px] text-[#62718a]">{meeting.day} · {meeting.time} · {meeting.room}</span>) : <span className="text-[11px] text-[#9aa4b2]">No schedule entered</span>}</div> },
  ];
  const cancellationColumns: DataColumn<NonNullable<UserDetail["classCancellations"]>[number]>[] = [
    { key: "cancellationDate", label: "Cancelled date", render: (item) => dateLabel(item.cancellationDate) },
    { key: "course.name", label: "Course / section", render: (item) => <div><p className="font-semibold text-[#34455f]">{item.course?.courseCode || item.course?.name || "—"}</p><p className="mt-0.5 text-[10px] text-[#98a2b1]">Section {item.section?.name || "—"}</p></div> },
    { key: "reason", label: "Reason", render: (item) => <span className="line-clamp-2">{item.reason || "—"}</span> },
    { key: "isApproved", label: "Status", render: (item) => <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.isApproved === true ? "bg-[#edf7f0] text-[#45805b]" : "bg-[#fff7e8] text-[#a8792e]"}`}>{item.isApproved === true ? "Approved" : "Pending"}</span> },
  ];

  return <div className="space-y-6">
    <Link href="/admin/users" className="inline-flex items-center gap-2 text-xs font-medium text-[#75839a] hover:text-[#4c61c1]"><ArrowLeft className="size-4" />Back to users</Link>
    <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)] sm:p-7"><div className="flex items-center gap-4"><UserAvatar name={user.name} profileImage={user.profile?.profileImage} /><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8793a8]">User account</p><h1 className="mt-1 text-[27px] font-semibold tracking-[-0.04em] text-[#1e2c43]">{user.name || "Unnamed user"}</h1><p className="mt-1 text-sm text-[#7d899d]">{user.employeeId || "No employee ID"} · {user.email || "No email"}</p></div></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${user.isActive ? "bg-[#edf7f0] text-[#45805b]" : "bg-[#f2f4f7] text-[#778396]"}`}>{user.isActive ? "Active account" : "Inactive account"}</span></section>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <section className="rounded-xl border border-[#e7ebf2] bg-white p-4"><p className="text-xs text-[#8290a5]">Assigned sections</p><p className="mt-2 text-2xl font-semibold text-[#263650]">{sections.length}</p><p className="mt-1 text-[11px] text-[#9aa4b3]">{semester?.name ?? "Selected semester"}</p></section>
      <section className="rounded-xl border border-[#e7ebf2] bg-white p-4"><p className="text-xs text-[#8290a5]">Class cancellations</p><p className="mt-2 text-2xl font-semibold text-[#263650]">{cancellations.length}</p><p className="mt-1 text-[11px] text-[#9aa4b3]">In selected semester</p></section>
      <section className="rounded-xl border border-[#e7ebf2] bg-white p-4"><p className="text-xs text-[#8290a5]">Approved</p><p className="mt-2 text-2xl font-semibold text-[#45805b]">{approvedCount}</p><p className="mt-1 text-[11px] text-[#9aa4b3]">Cancellation requests</p></section>
      <section className="rounded-xl border border-[#e7ebf2] bg-white p-4"><p className="text-xs text-[#8290a5]">Pending</p><p className="mt-2 text-2xl font-semibold text-[#a8792e]">{pendingCount}</p><p className="mt-1 text-[11px] text-[#9aa4b3]">Awaiting review</p></section>
    </div>

    <div className="grid gap-5 xl:grid-cols-[minmax(270px,0.75fr)_minmax(0,1.6fr)]">
      <section className="rounded-2xl border border-[#e7ebf2] bg-white p-5"><div className="flex items-center gap-2"><UserRound className="size-4 text-[#6376c8]" /><h2 className="text-sm font-semibold text-[#293952]">Personal and contact</h2></div><dl className="mt-5 space-y-4 text-xs"><div><dt className="text-[#929daf]">Phone number</dt><dd className="mt-1 inline-flex items-center gap-2 font-medium text-[#53627a]"><Phone className="size-3.5" />{user.profile?.phoneNumber || "Not provided"}</dd></div><div><dt className="text-[#929daf]">Email</dt><dd className="mt-1 inline-flex items-center gap-2 break-all font-medium text-[#53627a]"><Mail className="size-3.5 shrink-0" />{user.email || "Not provided"}</dd></div><div><dt className="text-[#929daf]">Department</dt><dd className="mt-1 font-medium text-[#53627a]">{user.profile?.department || "—"}</dd></div><div><dt className="text-[#929daf]">Faculty</dt><dd className="mt-1 font-medium text-[#53627a]">{user.profile?.faculty || "—"}</dd></div><div><dt className="text-[#929daf]">Employment</dt><dd className="mt-1 font-medium text-[#53627a]">{user.profile?.type || "—"}</dd></div><div><dt className="text-[#929daf]">Joined</dt><dd className="mt-1 font-medium text-[#53627a]">{dateLabel(user.profile?.joiningDate)}</dd></div><div><dt className="text-[#929daf]">Roles</dt><dd className="mt-2 flex flex-wrap gap-1.5">{user.userRoleMappings?.map((mapping) => mapping.role?.name).filter(Boolean).map((role) => <span key={role} className="rounded-full bg-[#f1f4fa] px-2.5 py-1 text-[10px] font-medium text-[#54637b]">{role!.replaceAll("_", " ")}</span>) ?? <span>—</span>}</dd></div></dl></section>
      <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white"><div className="border-b border-[#edf0f5] px-5 py-4"><h2 className="text-sm font-semibold text-[#293952]">Courses and sections</h2><p className="mt-0.5 text-[11px] text-[#8d98aa]">Teaching assignments for the selected semester.</p></div><DataTable rows={sections} columns={sectionColumns} emptyTitle="No assigned sections" emptyDescription="This user has no section assignments for this semester." /></section>
    </div>

    <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white"><div className="border-b border-[#edf0f5] px-5 py-4"><h2 className="text-sm font-semibold text-[#293952]">Class cancellation history</h2><p className="mt-0.5 text-[11px] text-[#8d98aa]">Requests submitted in the selected semester.</p></div><DataTable rows={cancellations} columns={cancellationColumns} emptyTitle="No cancellation requests" emptyDescription="No class cancellations were recorded for this semester." /></section>
  </div>;
}
