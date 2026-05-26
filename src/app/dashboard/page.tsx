import { DashboardPanels } from "@/components/dashboard/dashboard-panels";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { buildDashboard } from "@/lib/dashboard";
import { readStore } from "@/lib/data-store";
import { formatDateTime } from "@/lib/format";

export default async function DashboardPage() {
  await requireRoles(["ADMIN"]);
  const data = await readStore();
  const dashboard = buildDashboard(data);

  return (
    <ProtectedShell>
      <PageTransition>
        <div className="dashboard-toolbar">
          <div>
            <h2>Factory Overview</h2>
            <p>Last updated {formatDateTime(new Date().toISOString())}.</p>
          </div>
        </div>
        <DashboardPanels dashboard={dashboard} />
      </PageTransition>
    </ProtectedShell>
  );
}
