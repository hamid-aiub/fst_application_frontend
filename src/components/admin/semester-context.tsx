"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hasPermission } from "@/resources/auth/service/auth.service";
import { listResource } from "@/resources/management/service/resource.service";
import type { AuthUser } from "@/resources/auth/types/auth.types";
import type { GenericRecord } from "@/resources/management/types/resource.types";

export interface SemesterOption {
  id: string;
  name: string;
  academicYear: string;
  startDate: string | null;
  endDate: string | null;
}

interface SemesterContextValue {
  semesters: SemesterOption[];
  semesterId: string;
  semester: SemesterOption | null;
  loading: boolean;
  setSemesterId: (id: string) => void;
}

const SemesterContext = createContext<SemesterContextValue>({
  semesters: [], semesterId: "", semester: null, loading: false, setSemesterId: () => undefined,
});

function asSemester(item: GenericRecord): SemesterOption {
  return {
    id: item.id,
    name: String(item.name ?? "Semester"),
    academicYear: String(item.academicYear ?? ""),
    startDate: typeof item.startDate === "string" ? item.startDate.slice(0, 10) : null,
    endDate: typeof item.endDate === "string" ? item.endDate.slice(0, 10) : null,
  };
}

function chooseCurrentSemester(semesters: SemesterOption[]) {
  const date = new Date();
  const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const active = semesters.find((semester) => (!semester.startDate || semester.startDate <= today) && (!semester.endDate || semester.endDate >= today));
  if (active) return active.id;
  return [...semesters].sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))[0]?.id ?? "";
}

export function SemesterProvider({ user, children }: { user: AuthUser | null; children: ReactNode }) {
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [semesterId, setSemesterIdState] = useState("");
  const [loading, setLoading] = useState(false);
  const canRead = hasPermission(user?.permissions ?? [], "semesters", "read");

  useEffect(() => {
    if (!user || !canRead) return;
    let active = true;
    listResource("semesters", 1, 100).then((result) => {
      if (!active) return;
      const choices = result.data.map(asSemester);
      setSemesters(choices);
      const saved = window.localStorage.getItem("fst.activeSemesterId");
      const selected = choices.some((item) => item.id === saved) ? saved! : chooseCurrentSemester(choices);
      setSemesterIdState(selected);
      if (selected) window.localStorage.setItem("fst.activeSemesterId", selected);
    }).catch(() => {
      if (active) setSemesters([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user, canRead]);

  const setSemesterId = useCallback((id: string) => {
    setSemesterIdState(id);
    if (id) window.localStorage.setItem("fst.activeSemesterId", id);
    else window.localStorage.removeItem("fst.activeSemesterId");
  }, []);
  const semester = useMemo(() => semesters.find((item) => item.id === semesterId) ?? null, [semesters, semesterId]);
  const value = useMemo(() => ({ semesters, semesterId, semester, loading, setSemesterId }), [semesters, semesterId, semester, loading, setSemesterId]);

  return <SemesterContext.Provider value={value}>{children}</SemesterContext.Provider>;
}

export const useSemester = () => useContext(SemesterContext);
