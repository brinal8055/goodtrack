import { Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function DealerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRoles(["ADMIN"]);
  const { id } = await params;
  const data = await readStore();
  const dealer = data.dealers.find((item) => item.id === id);
  if (!dealer) notFound();
  const lots = data.lots.filter((lot) => lot.dealerId === dealer.id);
  const bills = data.bills.filter((bill) => bill.dealerId === dealer.id);
  const totalBilled = bills.reduce((total, bill) => total + bill.totalAmount, 0);
  const totalPaid = bills.reduce((total, bill) => total + bill.paidAmount, 0);

  return (
    <ProtectedShell>
      <PageTransition>
        <div className="stacked-layout">
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>{dealer.name}</h2>
                <p>
                  {dealer.contactPerson} · {dealer.phone}
                </p>
              </div>
              <Link className="btn btn-secondary" href="/dealers">
                All dealers
              </Link>
            </div>
            <div className="summary-grid">
              <div>
                <span>Total Lots</span>
                <strong>{lots.length}</strong>
              </div>
              <div>
                <span>Active Lots</span>
                <strong>{lots.filter((lot) => lot.currentStatus !== "COMPLETED").length}</strong>
              </div>
              <div>
                <span>Total Billed</span>
                <strong>{formatCurrency(totalBilled)}</strong>
              </div>
              <div>
                <span>Outstanding</span>
                <strong>{formatCurrency(totalBilled - totalPaid)}</strong>
              </div>
            </div>
          </section>
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Lots</h2>
                <p>All production lots from this dealer.</p>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Lot No</th>
                    <th>Material</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.id}>
                      <td className="mono">{lot.lotNumber}</td>
                      <td>{lot.materialType}</td>
                      <td>
                        <StatusBadge status={lot.currentStatus} />
                      </td>
                      <td>{formatDate(lot.receivedAt)}</td>
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
        </div>
      </PageTransition>
    </ProtectedShell>
  );
}
