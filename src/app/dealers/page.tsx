import { Eye, Plus } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatCurrency } from "@/lib/format";

export default async function DealersPage() {
  await requireRoles(["ADMIN"]);
  const data = await readStore();

  return (
    <ProtectedShell>
      <PageTransition>
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Dealers</h2>
              <p>Supplier activity, active lots, and outstanding balances.</p>
            </div>
            <Link className="btn btn-primary" href="/dealers/new">
              <Plus size={16} aria-hidden="true" />
              Add dealer
            </Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Dealer Name</th>
                  <th>Contact</th>
                  <th>Total Lots</th>
                  <th>Active Lots</th>
                  <th>Outstanding</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {data.dealers.map((dealer) => {
                  const lots = data.lots.filter((lot) => lot.dealerId === dealer.id);
                  const activeLots = lots.filter((lot) => lot.currentStatus !== "COMPLETED");
                  const outstanding = data.bills
                    .filter((bill) => bill.dealerId === dealer.id && bill.paymentStatus !== "PAID")
                    .reduce((total, bill) => total + bill.totalAmount - bill.paidAmount, 0);
                  return (
                    <tr key={dealer.id}>
                      <td>{dealer.name}</td>
                      <td>
                        {dealer.contactPerson}
                        <small className="muted-cell">{dealer.phone}</small>
                      </td>
                      <td>{lots.length}</td>
                      <td>{activeLots.length}</td>
                      <td>{formatCurrency(outstanding)}</td>
                      <td>
                        <Link className="table-action" href={`/dealers/${dealer.id}`}>
                          <Eye size={15} aria-hidden="true" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </PageTransition>
    </ProtectedShell>
  );
}
