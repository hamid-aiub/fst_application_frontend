import type { ReactNode } from "react";
import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center gap-3 bg-[#f5f7fb] text-sm text-[#758198]"><LoaderCircle className="size-5 animate-spin text-[#596fc7]" /> Opening workspace…</div>}><AdminShell>{children}</AdminShell></Suspense>;
}
