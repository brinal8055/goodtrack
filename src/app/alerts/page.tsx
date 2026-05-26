import { AlertTriangle, Bell, CheckCircle2, Eye } from "lucide-react";
import Link from "next/link";

import { dismissAlertAction, markAllAlertsReadAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatDateTime } from "@/lib/format";
import type { AlertType } from "@/lib/types";

function alertLabel(type: AlertType) {
  const labels: Record<AlertType, string> = {
    LOT_STUCK: "Lot stuck",
    BILLING_OVERDUE: "Billing overdue",
    DISPATCH_READY: "Dispatch ready",
    STAGE_COMPLETED: "Stage completed",
    NEW_LOT_RECEIVED: "New lot received"
  };
  return labels[type];
}

export default async function AlertsPage() {
  await requireRoles(["ADMIN"]);
  const data = await readStore();
  const lotById = new Map(data.lots.map((lot) => [lot.id, lot]));
  const alerts = [...data.alerts].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  return (
    <ProtectedShell>
      <PageTransition>
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Alert History</h2>
              <p>{unreadCount} unread notifications across lots, dispatch, stages, and billing.</p>
            </div>
            <form action={markAllAlertsReadAction}>
              <button className="btn btn-secondary" type="submit">
                <CheckCircle2 size={16} aria-hidden="true" />
                Mark all read
              </button>
            </form>
          </div>

          <div className="alert-history">
            {alerts.length > 0 ? (
              alerts.map((alert) => {
                const lot = alert.lotId ? lotById.get(alert.lotId) : undefined;
                const Icon = alert.isRead ? Bell : AlertTriangle;

                return (
                  <article className={`alert-row ${alert.isRead ? "read" : "unread"}`} key={alert.id}>
                    <span className="entity-icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{alertLabel(alert.type)}</strong>
                      <p>{alert.message}</p>
                      <small>{formatDateTime(alert.createdAt)}</small>
                    </div>
                    <div className="action-cell">
                      {lot ? (
                        <Link className="table-action" href={`/lots/${lot.id}`}>
                          <Eye size={15} aria-hidden="true" />
                          View lot
                        </Link>
                      ) : null}
                      {!alert.isRead ? (
                        <form action={dismissAlertAction}>
                          <input name="alertId" type="hidden" value={alert.id} />
                          <button className="inline-action" type="submit">
                            Dismiss
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="muted-cell">No alerts yet.</p>
            )}
          </div>
        </section>
      </PageTransition>
    </ProtectedShell>
  );
}
