"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, LoaderCircle, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type CurrentUser = {
  id: string;
  employeeId?: string;
  name?: string;
  email?: string;
  isActive: boolean;
  profile: { department: string | null; faculty: string | null } | null;
  roles: string[];
  permissions: string[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return null;
        }
        const payload = (await response.json().catch(() => null)) as CurrentUser | { message?: string } | null;
        if (!response.ok) throw new Error((payload as { message?: string } | null)?.message ?? "Could not load your account.");
        return payload as CurrentUser;
      })
      .then((profile) => { if (active && profile) setUser(profile); })
      .catch((error: unknown) => {
        if (active) setUser({
          id: "",
          isActive: false,
          profile: null,
          roles: [],
          permissions: [],
          name: error instanceof Error ? error.message : "Could not load your account.",
        });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        signal: AbortSignal.timeout(4_000),
      });
    } catch {
      // The sign-out route clears the local session even if the API is unavailable.
    } finally {
      setSigningOut(false);
      window.location.replace("/");
    }
  }

  const loadError = user && !user.id;

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-[#172235]">
      <header className="border-b border-[#e8edf4] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl border border-[#edf0f5] bg-white p-1">
              <Image src="/fst.png" alt="FST logo" width={40} height={40} className="size-9 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#22324d]">FST Portal</p>
              <p className="text-xs text-[#818da1]">Faculty of Science &amp; Technology</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} disabled={signingOut} className="h-9 rounded-lg border-[#e1e6ee] bg-white text-[#455570]">
            {signingOut ? <LoaderCircle className="animate-spin" /> : <LogOut />}
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-[#68758b]">
            <LoaderCircle className="size-5 animate-spin text-[#5269c9]" /> Loading your account...
          </div>
        ) : loadError ? (
          <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-7 text-sm text-rose-700 shadow-sm">
            {user?.name}
            <button onClick={() => router.replace("/")} className="ml-2 font-semibold underline">Return to sign in</button>
          </div>
        ) : user ? (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#75839a]">Your workspace</p>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#19263c] sm:text-4xl">Welcome, {user.name || "there"}</h1>
                <p className="mt-2 text-sm text-[#778399]">You’re signed in to the FST academic workspace.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#dce9e0] bg-[#f2f8f4] px-3 py-1.5 text-xs font-medium text-[#4b8061]">
                <ShieldCheck className="size-4" /> Secure session active
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <section className="rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-[0_18px_55px_-42px_rgba(38,54,84,0.35)] sm:p-7">
                <span className="grid size-10 place-items-center rounded-xl bg-[#eef2ff] text-[#5369c7]"><UserRound className="size-5" /></span>
                <h2 className="mt-5 text-lg font-semibold text-[#23334e]">Account details</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-[#8792a5]">Email</dt><dd className="text-right font-medium text-[#40516d]">{user.email || "—"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-[#8792a5]">Employee ID</dt><dd className="text-right font-medium text-[#40516d]">{user.employeeId || "—"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-[#8792a5]">Department</dt><dd className="text-right font-medium text-[#40516d]">{user.profile?.department || "—"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-[#8792a5]">Faculty</dt><dd className="text-right font-medium text-[#40516d]">{user.profile?.faculty || "—"}</dd></div>
                </dl>
              </section>

              <section className="rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-[0_18px_55px_-42px_rgba(38,54,84,0.35)] sm:p-7">
                <span className="grid size-10 place-items-center rounded-xl bg-[#eef7f8] text-[#3b7d88]"><BookOpen className="size-5" /></span>
                <h2 className="mt-5 text-lg font-semibold text-[#23334e]">Access assigned to you</h2>
                <p className="mt-1 text-xs text-[#8792a5]">Based on your roles and permissions.</p>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#8792a5]">Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.length ? user.roles.map((role) => <span key={role} className="rounded-full bg-[#f1f4fa] px-3 py-1 text-xs font-medium text-[#475873]">{role.replaceAll("_", " ")}</span>) : <span className="text-sm text-[#8792a5]">No roles assigned</span>}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[#edf0f5] pt-4 text-xs text-[#8792a5]">
                  <span>{user.permissions.length} permissions available</span>
                  <ArrowUpRight className="size-4" />
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
