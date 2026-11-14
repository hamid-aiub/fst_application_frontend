"use client";

import ManagedResourcePage from "@/app/admin/[resource]/page";
import { MyCancellations } from "@/components/admin/class-cancellations/my-cancellations";
import { useAdminUser } from "@/components/admin/admin-shell";

export default function ClassCancellationsPage() {
  const user = useAdminUser();
  if (user?.roles.length && user.roles.every((role) => role === "user")) return <MyCancellations />;
  return <ManagedResourcePage resourceOverride="class_cancellations" />;
}
