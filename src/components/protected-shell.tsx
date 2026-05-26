import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { readStore } from "@/lib/data-store";
import { requireUser } from "@/lib/auth";

export async function ProtectedShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const data = await readStore();
  const unreadAlerts = data.alerts.filter((alert) => !alert.isRead).length;

  return (
    <AppShell user={{ name: user.name, role: user.role }} unreadAlerts={unreadAlerts}>
      {children}
    </AppShell>
  );
}
