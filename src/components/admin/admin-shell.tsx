"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BookOpen, CircleHelp, ClipboardList, KeyRound, LayoutDashboard, LoaderCircle, LogOut, Settings2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, hasPermission, signOut } from "@/resources/auth/service/auth.service";
import type { AuthUser } from "@/resources/auth/types/auth.types";
import { UserAvatar } from "@/components/admin/user-avatar";
import { ChangePasswordDialog } from "@/components/admin/change-password-dialog";
import { RESOURCE_CONFIGS, RESOURCE_GROUPS } from "@/resources/management/config/resources";

const AdminUserContext = createContext<AuthUser | null>(null);
export const useAdminUser = () => useContext(AdminUserContext);

const groupIcons: Record<string, typeof BookOpen> = {
  Academic: BookOpen,
  Tasks: ClipboardList,
  "Reference data": Settings2,
  "Access control": ShieldCheck,
};

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        const message = reason instanceof Error ? reason.message : "Could not verify your session.";
        if (/session has expired|not signed in/i.test(message)) router.replace("/");
        setError(message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // The local sign-out endpoint clears cookies when the API is unavailable.
    } finally {
      setSigningOut(false);
      window.location.replace("/");
    }
  }

  return (
    <AdminUserContext.Provider value={user}>
      <div className="min-h-screen bg-[#f5f7fb] text-[#172235]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col overflow-y-auto border-r border-[#e7ebf2] bg-white lg:flex">
          <div className="flex h-[82px] items-center gap-3 border-b border-[#edf0f5] px-6">
            <div className="grid size-10 place-items-center rounded-xl border border-[#edf0f5] bg-white p-1">
              <Image src="/fst.png" alt="FST logo" width={36} height={36} className="size-8 object-contain" priority />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-[#22324d]">FST Portal</p>
              <p className="text-[10px] font-medium text-[#8994a7]">AIUB · {user?.roles.includes("admin") ? "ADMIN" : "WORKSPACE"}</p>
            </div>
          </div>
          <div className="px-4 pt-7">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a0aabc]">Workspace</p>
            <nav aria-label="Primary navigation" className="space-y-5">
              <Link href="/dashboard" className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition ${pathname === "/dashboard" ? "bg-[#edf1ff] text-[#4c61c1]" : "text-[#6e7b91] hover:bg-[#f5f7fa] hover:text-[#263750]"}`}><LayoutDashboard className="size-[17px]" />Overview</Link>
              {RESOURCE_GROUPS.map((group) => {
                const groupResources = RESOURCE_CONFIGS.filter((resource) => resource.group === group && hasPermission(user?.permissions ?? [], resource.slug, "read"));
                const showUsers = group === "Access control" && hasPermission(user?.permissions ?? [], "users", "read");
                if (!groupResources.length && !showUsers) return null;
                const Icon = groupIcons[group] ?? BookOpen;
                return <section key={group}><p className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a0aabc]"><Icon className="size-3.5" />{group}</p><div className="space-y-0.5">
                  {showUsers && <Link href="/admin/users" className={`flex min-h-9 items-center rounded-lg px-3 text-[12px] font-medium transition ${pathname.startsWith("/admin/users") ? "bg-[#edf1ff] text-[#4c61c1]" : "text-[#6e7b91] hover:bg-[#f5f7fa] hover:text-[#263750]"}`}>Users</Link>}
                  {groupResources.map((resource) => <Link key={resource.slug} href={`/admin/${resource.slug}`} className={`flex min-h-9 items-center rounded-lg px-3 text-[12px] font-medium transition ${pathname === `/admin/${resource.slug}` ? "bg-[#edf1ff] text-[#4c61c1]" : "text-[#6e7b91] hover:bg-[#f5f7fa] hover:text-[#263750]"}`}>{resource.title}</Link>)}
                </div></section>;
              })}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <div className="rounded-xl border border-[#e9edf4] bg-[#f8f9fc] p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#44546e]"><CircleHelp className="size-4 text-[#6c7d9b]" /> Need assistance?</div>
              <p className="mt-1.5 text-[11px] leading-4 text-[#8893a6]">Contact your FST system administrator.</p>
            </div>
          </div>
        </aside>

        <div className="lg:pl-[248px]">
          <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#e7ebf2] bg-white/90 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-9 place-items-center rounded-lg border border-[#edf0f5] bg-white p-1"><Image src="/fst.png" alt="FST logo" width={32} height={32} className="size-7 object-contain" /></div>
              <span className="text-sm font-bold text-[#22324d]">FST Portal</span>
            </div>
            <div className="hidden text-xs text-[#8b96a8] sm:block">Faculty of Science &amp; Technology <span className="px-1.5 text-[#c4cad4]">/</span> Administration</div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden max-w-[190px] truncate text-right text-xs font-medium text-[#52617a] sm:block">{user?.name || user?.email || "Administrator"}</span>
              <UserAvatar name={user?.name} profileImage={user?.profile?.profileImage} size="sm" />
              <Button variant="outline" onClick={() => setChangingPassword(true)} className="h-9 gap-2 rounded-lg border-[#e3e8f0] px-3 text-xs text-[#52617a]"><KeyRound className="size-3.5" /><span className="hidden sm:inline">Password</span></Button>
              <Button variant="outline" onClick={handleSignOut} disabled={signingOut} className="h-9 gap-2 rounded-lg border-[#e3e8f0] px-3 text-xs text-[#52617a]">
                {signingOut ? <LoaderCircle className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>

          <nav aria-label="Workspace navigation" className="flex gap-2 overflow-x-auto border-b border-[#e7ebf2] bg-white px-4 py-2 lg:hidden">
            <Link href="/dashboard" className="shrink-0 rounded-full bg-[#f3f5fa] px-3 py-1.5 text-[11px] font-medium text-[#566680]">Overview</Link>
            {hasPermission(user?.permissions ?? [], "users", "read") && <Link href="/admin/users" className="shrink-0 rounded-full bg-[#f3f5fa] px-3 py-1.5 text-[11px] font-medium text-[#566680]">Users</Link>}
            {RESOURCE_CONFIGS.filter((resource) => hasPermission(user?.permissions ?? [], resource.slug, "read")).map((resource) => <Link key={resource.slug} href={`/admin/${resource.slug}`} className="shrink-0 rounded-full bg-[#f3f5fa] px-3 py-1.5 text-[11px] font-medium text-[#566680]">{resource.title}</Link>)}
          </nav>

          <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">
            {loading ? (
              <div className="flex min-h-[55vh] items-center justify-center gap-3 text-sm text-[#758198]"><LoaderCircle className="size-5 animate-spin text-[#596fc7]" /> Verifying administrator access...</div>
            ) : error ? (
              <div role="alert" className="mx-auto mt-12 max-w-xl rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700">{error}</div>
            ) : user ? children : null}
          </main>
        </div>
      </div>
      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
    </AdminUserContext.Provider>
  );
}
