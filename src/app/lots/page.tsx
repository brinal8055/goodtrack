import { Eye, PackageSearch } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatDateTime, formatNumber } from "@/lib/format";

export default async function LotsPage() {
  await requireRoles(["ADMIN", "ENTRY_OPERATOR", "GODOWN", "PROCESSING", "BILLING"]);
  const data = await readStore();
  const dealerById = new Map(data.dealers.map((dealer) => [dealer.id, dealer.name]));
  const lots = [...data.lots].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

  return (
    <ProtectedShell>
      <PageTransition>
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>All Lots</h2>
              <p>Latest production entries and current statuses.</p>
            </div>
            <Link className="btn btn-primary" href="/lots/new">
              <PackageSearch size={16} aria-hidden="true" />
              New lot
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
                  <th>Status</th>
                  <th>Created At</th>
                  <th>View</th>
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
                    <td>
                      <StatusBadge status={lot.currentStatus} />
                    </td>
                    <td>{formatDateTime(lot.createdAt)}</td>
                    <td>
                      <Link className="table-action" href={`/lots/${lot.id}`}>
                        <Eye size={15} aria-hidden="true" />
                        View
                      </Link>
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
