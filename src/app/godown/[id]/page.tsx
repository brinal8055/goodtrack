import { ArrowRight, Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { moveLotToProcessAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatDateTime, formatNumber } from "@/lib/format";

export default async function GodownDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRoles(["ADMIN", "GODOWN"]);
  const { id } = await params;
  const data = await readStore();
  const godown = data.godowns.find((item) => item.id === id);
  if (!godown) notFound();
  const dealerById = new Map(data.dealers.map((dealer) => [dealer.id, dealer.name]));
  const lots = data.lots.filter(
    (lot) => lot.godownId === godown.id && ["RECEIVED", "IN_GODOWN"].includes(lot.currentStatus)
  );

  return (
    <ProtectedShell>
      <PageTransition>
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>{godown.name}</h2>
              <p>
                {godown.location} · Sections: {godown.sections.map((section) => section.sectionName).join(", ")}
              </p>
            </div>
            <Link className="btn btn-secondary" href="/godown">
              All godowns
            </Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Lot No</th>
                  <th>Dealer</th>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Rack</th>
                  <th>Status</th>
                  <th>Placed At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => (
                  <tr key={lot.id}>
                    <td className="mono">{lot.lotNumber}</td>
                    <td>{dealerById.get(lot.dealerId) ?? "Unknown dealer"}</td>
                    <td>{lot.materialType}</td>
                    <td>
                      {formatNumber(lot.quantity)} {lot.unit}
                    </td>
                    <td>{lot.rackSection}</td>
                    <td>
                      <StatusBadge status={lot.currentStatus} />
                    </td>
                    <td>{formatDateTime(lot.updatedAt)}</td>
                    <td className="action-cell">
                      <Link className="table-action" href={`/lots/${lot.id}`}>
                        <Eye size={15} aria-hidden="true" />
                        View
                      </Link>
                      <form action={moveLotToProcessAction}>
                        <input name="lotId" type="hidden" value={lot.id} />
                        <button className="inline-action" type="submit">
                          <ArrowRight size={15} aria-hidden="true" />
                          Move
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </PageTransition>
    </ProtectedShell>
  );
}
