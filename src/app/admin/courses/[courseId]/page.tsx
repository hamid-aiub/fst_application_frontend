"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, GraduationCap, LoaderCircle, MapPin, UserRound } from "lucide-react";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { useSemester } from "@/components/admin/semester-context";
import { getResource } from "@/resources/management/service/resource.service";
import type { GenericRecord } from "@/resources/management/types/resource.types";

type ScheduleSection = {
  id: string;
  name?: string | null;
  room1?: string | null; day1?: string | null; time1?: string | null;
  room2?: string | null; day2?: string | null; time2?: string | null;
  room3?: string | null; day3?: string | null; time3?: string | null;
  user?: { id?: string; name?: string | null; email?: string | null } | null;
};

function value(record: GenericRecord | null, key: string) {
  const item = record?.[key];
  if (item && typeof item === "object") return item as GenericRecord;
  return null;
}

function meetings(section: ScheduleSection) {
  return [1, 2, 3].flatMap((number) => {
    const meeting = section as unknown as Record<string, string | null | undefined>;
    const room = meeting[`room${number}`];
    const day = meeting[`day${number}`];
    const time = meeting[`time${number}`];
    if (!room && !day && !time) return [];
    return [{ room: room || "Room pending", day: day || "Day pending", time: time || "Time pending" }];
  });
}

export default function CourseDetailsPage() {
  const params = useParams<{ courseId: string }>();
  const { semesterId, semester } = useSemester();
  const [course, setCourse] = useState<GenericRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getResource("courses", params.courseId).then((result) => { if (active) setCourse(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Course details could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.courseId]);

  const sections = Array.isArray(course?.sections) ? course.sections as ScheduleSection[] : [];
  const visibleSections = sections.filter((section) => {
    const semesterRecord = (section as unknown as GenericRecord).semester as GenericRecord | undefined;
    return !semesterId || (semesterRecord?.id === semesterId) || ((section as unknown as GenericRecord).semesterId === semesterId);
  });
  const semesterInfo = value(course, "semester");
  const people = [
    { label: "Convenor", person: value(course, "convenor") },
    { label: "Moderator", person: value(course, "moderator") },
    { label: "External", person: value(course, "external") },
  ];

  const columns: DataColumn<ScheduleSection>[] = [
    { key: "name", label: "Section", render: (section) => <span className="font-semibold text-[#34455f]">{section.name || "—"}</span> },
    { key: "user.name", label: "Faculty", render: (section) => <span className="inline-flex items-center gap-2"><UserRound className="size-3.5 text-[#8491a6]" />{section.user?.name || section.user?.email || "Unassigned"}</span> },
    { key: "schedule", label: "Schedule", sortable: false, render: (section) => <div className="flex min-w-[260px] flex-col gap-1.5">{meetings(section).length ? meetings(section).map((meeting, index) => <span key={index} className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#62718a]"><CalendarDays className="size-3 text-[#8190bd]" />{meeting.day}<span>·</span>{meeting.time}<span>·</span><MapPin className="size-3" />{meeting.room}</span>) : <span className="text-[11px] text-[#9aa4b2]">No schedule provided</span>}</div> },
  ];

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-[#758198]"><LoaderCircle className="size-5 animate-spin text-[#596fc7]" />Loading course details…</div>;
  if (error || !course) return <section role="alert" className="rounded-2xl border border-rose-200 bg-white p-7 text-sm text-rose-700">{error || "Course not found."}<Link href="/admin/courses" className="ml-2 font-semibold underline">Back to courses</Link></section>;

  return <div className="space-y-6">
    <Link href="/admin/courses" className="inline-flex items-center gap-2 text-xs font-medium text-[#75839a] hover:text-[#4c61c1]"><ArrowLeft className="size-4" />Back to courses</Link>
    <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#edf0f5] px-5 py-6 sm:px-7"><div className="flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-[#eef1ff] text-[#556bc8]"><BookOpen className="size-5" /></span><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8793a8]">{String(course.courseCode ?? "Course")}{course.department ? ` · ${String(course.department)}` : ""}</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-[#1e2c43]">{String(course.name ?? "Course details")}</h1><p className="mt-1 text-sm text-[#7d899d]">{semesterInfo?.name ? `${String(semesterInfo.name)}${semesterInfo.academicYear ? ` · ${String(semesterInfo.academicYear)}` : ""}` : semester?.name ?? "Semester not assigned"}</p></div></div><div className="flex gap-2"><span className="rounded-full bg-[#f2f5fb] px-3 py-1.5 text-xs font-semibold text-[#586982]">{String(course.type ?? "—")}</span><span className="rounded-full bg-[#f2f5fb] px-3 py-1.5 text-xs font-semibold text-[#586982]">{String(course.credit ?? "—")} credits</span></div></div>
      <div className="grid gap-0 divide-y divide-[#edf0f5] sm:grid-cols-3 sm:divide-x sm:divide-y-0">{people.map(({ label, person }) => <div key={label} className="px-5 py-4 sm:px-7"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98a2b1]">{label}</p><p className="mt-1 text-sm font-semibold text-[#40516c]">{String(person?.name ?? person?.email ?? "Not assigned")}</p></div>)}</div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white shadow-[0_18px_50px_-40px_rgba(29,43,66,0.35)]"><div className="flex items-center justify-between border-b border-[#edf0f5] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#293952]">Sections and class schedule</h2><p className="mt-0.5 text-[11px] text-[#8d98aa]">{visibleSections.length} section{visibleSections.length === 1 ? "" : "s"} for the selected semester</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f5fb] px-2.5 py-1 text-[10px] font-medium text-[#65738a]"><GraduationCap className="size-3.5" />{semester?.name ?? "Selected semester"}</span></div><DataTable rows={visibleSections} columns={columns} emptyTitle="No sections for this semester" emptyDescription="Choose a different semester or add sections to this course." /></section>
  </div>;
}
