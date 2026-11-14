"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, CalendarDays, ChevronDown, CircleHelp, ClipboardList, KeyRound, LayoutDashboard, LoaderCircle, LogOut, Settings2, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, hasPermission, signOut } from "@/resources/auth/service/auth.service";
import type { AuthUser } from "@/resources/auth/types/auth.types";
import { UserAvatar } from "@/components/admin/user-avatar";
import { ChangePasswordDialog } from "@/components/admin/change-password-dialog";
import { SemesterProvider, useSemester } from "@/components/admin/semester-context";
import { RESOURCE_CONFIGS } from "@/resources/management/config/resources";

const AdminUserContext = createContext<AuthUser | null>(null);
const AdminRefreshContext = createContext<() => Promise<void>>(async () => undefined);
export const useAdminUser = () => useContext(AdminUserContext);
export const useRefreshAdminUser = () => useContext(AdminRefreshContext);

const roleIcons: Record<string, typeof ShieldCheck> = {
  admin: ShieldCheck,
  user: UserRound,
  department_head: BookOpen,
  director: ClipboardList,
  associate_dean: Settings2,
  dean: UsersRound,
};

const routeIcon = (slug: string) => slug.startsWith("class_cancellation") || slug === "tasks" ? ClipboardList
  : slug === "courses" || slug === "sections" ? BookOpen
    : slug === "users" || slug === "profiles" ? UsersRound
      : slug === "semesters" ? CalendarDays
        : slug.includes("role") || slug === "permissions" ? ShieldCheck : Settings2;

function roleLabel(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function routesForRole(user: AuthUser, role: string) {
  const permissions = user.rolePermissions?.[role] ?? (user.roles.length === 1 ? user.permissions : []);
  const routes = RESOURCE_CONFIGS
    .filter((resource) => hasPermission(permissions, resource.slug, "read"))
    .map((resource) => ({ href: `/admin/${resource.slug}`, label: resource.title, icon: routeIcon(resource.slug) }));
  if (hasPermission(permissions, "users", "read")) routes.unshift({ href: "/admin/users", label: "Users", icon: UsersRound });
  if (role === "admin") routes.unshift({ href: "/dashboard", label: "Overview", icon: LayoutDashboard });
  return routes;
}

function SemesterSwitcher() {
  const { semesters, semesterId, loading, setSemesterId } = useSemester();
  if (!semesters.length) return null;
  return <label className="flex min-w-0 items-center gap-2 rounded-lg border border-[#e6eaf1] bg-white px-2.5 py-1.5 text-xs text-[#65738a]">
    <CalendarDays className="size-4 shrink-0 text-[#6577ca]" />
    <span className="hidden xl:inline">Semester</span>
    <select value={semesterId} disabled={loading} onChange={(event) => setSemesterId(event.target.value)} aria-label="Current semester" className="max-w-[150px] bg-transparent font-semibold text-[#3a4a64] outline-none sm:max-w-[210px]">
      {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}{semester.academicYear ? ` · ${semester.academicYear}` : ""}</option>)}
    </select>
  </label>;
}

function NavLink({ href, label, Icon, active, expanded }: { href: string; label: string; Icon: typeof BookOpen; active: boolean; expanded: boolean }) {
  return <Link href={href} title={!expanded ? label : undefined} aria-current={active ? "page" : undefined} className={`group/navlink flex h-10 min-w-0 items-center gap-3 rounded-lg px-3 transition ${active ? "bg-[#edf1ff] text-[#4c61c1]" : "text-[#77839a] hover:bg-[#f5f7fa] hover:text-[#263750]"}`}>
    <Icon className="size-[18px] shrink-0" />
    <span className={`truncate text-[12px] font-medium transition-opacity ${expanded ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100"}`}>{label}</span>
  </Link>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [expandedRole, setExpandedRole] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch((reason: unknown) => {
        if (!active) return;
        const message = reason instanceof Error ? reason.message : "Could not verify your session.";
        if (/session has expired|not signed in|authentication is required/i.test(message)) router.replace("/");
        setError(message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  const refreshUser = useCallback(async () => setUser(await getCurrentUser()), []);
  const roles = user?.roles ?? [];
  const activeRole = user?.roles.find((role) => routesForRole(user, role).some((route) => route.href === pathname || (route.href !== "/dashboard" && pathname.startsWith(`${route.href}/`)))) ?? roles[0] ?? "";
  const selectedRole = expandedRole || activeRole || roles[0] || "";
  const singleRoleRoutes = user && roles.length === 1 ? routesForRole(user, roles[0]) : [];
  const mobileRoutes = useMemo(() => {
    if (!user) return [];
    const merged = user.roles.flatMap((role) => routesForRole(user, role));
    return [...new Map(merged.map((route) => [route.href, route])).values()];
  }, [user]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await signOut(); }
    catch { /* Local cookies are cleared by the sign-out route even when the API is offline. */ }
    finally { setSigningOut(false); window.location.replace("/"); }
  }

  const contextPage = useMemo(() => {
    if (pathname === "/admin/profile") return "My profile";
    const resource = RESOURCE_CONFIGS.find((item) => pathname === `/admin/${item.slug}` || pathname.startsWith(`/admin/${item.slug}/`));
    return resource?.title ?? (pathname.startsWith("/admin/users") ? "Users" : pathname === "/dashboard" ? "Overview" : "Workspace");
  }, [pathname]);

  return <AdminUserContext.Provider value={user}>
    <AdminRefreshContext.Provider value={refreshUser}>
      <SemesterProvider user={user}>
        <div className="min-h-screen bg-[#f5f7fb] text-[#172235]">
          <aside className="group/sidebar fixed inset-y-0 left-0 z-40 hidden w-[68px] flex-col overflow-x-hidden overflow-y-auto border-r border-[#e7ebf2] bg-white transition-[width] duration-200 hover:w-[264px] lg:flex">
            <div className="sticky top-0 z-10 flex h-[78px] shrink-0 items-center gap-3 border-b border-[#edf0f5] bg-white px-[14px]">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#edf0f5] bg-white p-1"><Image src="/fst.png" alt="FST logo" width={36} height={36} className="size-8 object-contain" priority /></div>
              <div className="min-w-0 whitespace-nowrap opacity-0 transition-opacity group-hover/sidebar:opacity-100"><p className="text-sm font-bold tracking-tight text-[#22324d]">FST Portal</p><p className="text-[10px] font-medium text-[#8994a7]">AIUB · WORKSPACE</p></div>
            </div>

            <nav aria-label="Workspace navigation" className="flex-1 space-y-1 px-2 py-4">
              {roles.length <= 1 ? <>
                {singleRoleRoutes.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} Icon={Icon} expanded={false} active={pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))} />)}
              </> : roles.map((role) => {
                const roleRoutes = user ? routesForRole(user, role) : [];
                if (!roleRoutes.length) return null;
                const RoleIcon = roleIcons[role] ?? ShieldCheck;
                const roleActive = activeRole === role;
                const expanded = selectedRole === role;
                return <section key={role} className="mb-1">
                  <button type="button" aria-expanded={expanded} onClick={() => setExpandedRole(expanded ? "" : role)} title={!expandedRole ? roleLabel(role) : undefined} className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left transition ${roleActive ? "bg-[#f0f2ff] text-[#5266c6]" : "text-[#66748b] hover:bg-[#f5f7fa]"}`}>
                    <RoleIcon className="size-[18px] shrink-0" /><span className="min-w-0 flex-1 truncate whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.08em] opacity-0 transition-opacity group-hover/sidebar:opacity-100">{roleLabel(role)}</span><ChevronDown className={`size-3 shrink-0 opacity-0 transition group-hover/sidebar:opacity-100 ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && <div className="mt-1 space-y-0.5 border-l border-[#e7ebf2] pl-2">
                    {roleRoutes.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} Icon={Icon} expanded={false} active={pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))} />)}
                  </div>}
                </section>;
              })}
            </nav>

            <div className="sticky bottom-0 space-y-1 border-t border-[#edf0f5] bg-white px-2 py-3">
              <NavLink href="/admin/profile" label="My profile" Icon={UserRound} expanded={false} active={pathname === "/admin/profile"} />
              <button type="button" title="Need assistance?" className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[#8994a7] hover:bg-[#f5f7fa]"><CircleHelp className="size-[18px] shrink-0" /><span className="truncate whitespace-nowrap text-xs opacity-0 group-hover/sidebar:opacity-100">Contact your FST administrator</span></button>
            </div>
          </aside>

          <div className="lg:pl-[68px]">
            <header className="sticky top-0 z-30 flex min-h-[70px] items-center justify-between gap-3 border-b border-[#e7ebf2] bg-white/95 px-4 backdrop-blur sm:px-7">
              <div className="flex min-w-0 items-center gap-3 lg:hidden"><button type="button" aria-label="Toggle navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((value) => !value)} className="grid size-9 place-items-center rounded-lg border border-[#e7ebf2] text-[#64728a]"><Settings2 className="size-4" /></button><div className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#edf0f5] bg-white p-1"><Image src="/fst.png" alt="FST logo" width={32} height={32} className="size-7 object-contain" /></div><span className="truncate text-sm font-bold text-[#22324d]">FST Portal</span></div>
              <div className="hidden min-w-0 text-xs text-[#8b96a8] sm:block">Faculty of Science &amp; Technology <span className="px-1.5 text-[#c4cad4]">/</span><span className="font-semibold text-[#55647d]">{contextPage}</span></div>
              <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
                <SemesterSwitcher />
                <span className="hidden max-w-[160px] truncate text-right text-xs font-medium text-[#52617a] md:block">{user?.name || user?.email || "Account"}</span>
                <UserAvatar name={user?.name} profileImage={user?.profile?.profileImage} size="sm" />
                <Button variant="outline" onClick={() => setChangingPassword(true)} aria-label="Change password" className="size-9 rounded-lg border-[#e3e8f0] p-0 text-[#52617a]"><KeyRound className="size-3.5" /></Button>
                <Button variant="outline" onClick={handleSignOut} disabled={signingOut} className="h-9 gap-2 rounded-lg border-[#e3e8f0] px-2.5 text-xs text-[#52617a] sm:px-3">{signingOut ? <LoaderCircle className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}<span className="hidden sm:inline">Sign out</span></Button>
              </div>
            </header>

            {mobileMenuOpen && <nav aria-label="Mobile workspace navigation" className="fixed inset-x-0 top-[70px] z-20 max-h-[70vh] overflow-y-auto border-b border-[#e7ebf2] bg-white p-3 shadow-lg lg:hidden">
              {mobileRoutes.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className={`flex h-10 items-center gap-3 rounded-lg px-3 text-xs ${pathname === href ? "bg-[#edf1ff] font-semibold text-[#4c61c1]" : "text-[#66748b] hover:bg-[#f5f7fa]"}`}><Icon className="size-4" />{label}</Link>)}
              <Link href="/admin/profile" onClick={() => setMobileMenuOpen(false)} className={`flex h-10 items-center gap-3 rounded-lg px-3 text-xs ${pathname === "/admin/profile" ? "bg-[#edf1ff] font-semibold text-[#4c61c1]" : "text-[#66748b] hover:bg-[#f5f7fa]"}`}><UserRound className="size-4" />My profile</Link>
            </nav>}

            <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8">
              {loading ? <div className="flex min-h-[55vh] items-center justify-center gap-3 text-sm text-[#758198]"><LoaderCircle className="size-5 animate-spin text-[#596fc7]" /> Loading your workspace…</div>
                : error ? <div role="alert" className="mx-auto mt-12 max-w-xl rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700">{error}</div>
                  : user ? children : null}
            </main>
          </div>
        </div>
        {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
      </SemesterProvider>
    </AdminRefreshContext.Provider>
  </AdminUserContext.Provider>;
}
