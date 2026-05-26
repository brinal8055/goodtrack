import { Beaker, Eye, PlayCircle } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getCurrentStep, hasStartedStage } from "@/lib/workflow";

export default async function ProcessQueuePage() {
  await requireRoles(["ADMIN", "PROCESSING"]);
  const data = await readStore();
  const dealerById = new Map(data.dealers.map((dealer) => [dealer.id, dealer.name]));
  const queue = data.lots
    .filter((lot) => lot.currentStatus === "IN_PROCESS")
    .map((lot) => ({ lot, step: getCurrentStep(data, lot), started: hasStartedStage(data, lot) }))
    .filter((item) => item.step && !["RAW_MATERIAL_RECEIVED", "GODOWN_STORAGE", "DISPATCH"].includes(item.step.stepType));

  return (
    <ProtectedShell>
      <PageTransition>
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Processing Queue</h2>
              <p>Lots currently assigned to dyeing, drying, finishing, or packing.</p>
            </div>
          </div>
          {queue.length === 0 ? (
            <div className="empty-state compact-empty">
              <Beaker size={40} aria-hidden="true" />
              <h2>No active processing lots</h2>
              <p>Move a lot from godown to begin stage work.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Lot No</th>
                    <th>Dealer</th>
                    <th>Current Stage</th>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map(({ lot, step, started }) => (
                    <tr key={lot.id}>
                      <td className="mono">{lot.lotNumber}</td>
                      <td>{dealerById.get(lot.dealerId) ?? "Unknown dealer"}</td>
                      <td>{step?.stepName}</td>
                      <td>{lot.materialType}</td>
                      <td>
                        {formatNumber(lot.quantity)} {lot.unit}
                      </td>
                      <td>
                        <StatusBadge status={lot.currentStatus} />
                      </td>
                      <td>{formatDateTime(lot.updatedAt)}</td>
                      <td className="action-cell">
                        <Link className="table-action" href={`/lots/${lot.id}`}>
                          <Eye size={15} aria-hidden="true" />
                          View
                        </Link>
                        <Link className="inline-action" href={`/lots/${lot.id}/update`}>
                          <PlayCircle size={15} aria-hidden="true" />
                          {started ? "Complete" : "Start"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </PageTransition>
    </ProtectedShell>
  );
}
