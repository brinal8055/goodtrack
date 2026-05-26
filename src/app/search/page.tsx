import { Eye, PackageSearch, ReceiptText, Users } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

function includesQuery(value: string | undefined, query: string) {
  return value?.toLowerCase().includes(query) ?? false;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireRoles(["ADMIN", "ENTRY_OPERATOR", "GODOWN", "PROCESSING", "BILLING"]);
  const { q } = await searchParams;
  const query = String(q ?? "").trim().toLowerCase();
  const data = await readStore();
  const dealerById = new Map(data.dealers.map((dealer) => [dealer.id, dealer.name]));
  const lotById = new Map(data.lots.map((lot) => [lot.id, lot]));

  const lots = query
    ? data.lots.filter(
        (lot) =>
          includesQuery(lot.lotNumber, query) ||
          includesQuery(lot.materialType, query) ||
          includesQuery(lot.challanNumber, query) ||
          includesQuery(dealerById.get(lot.dealerId), query)
      )
    : [];
  const dealers = user.role === "ADMIN" && query
    ? data.dealers.filter(
        (dealer) =>
          includesQuery(dealer.name, query) ||
          includesQuery(dealer.contactPerson, query) ||
          includesQuery(dealer.phone, query) ||
          includesQuery(dealer.email, query)
      )
    : [];
  const invoices = ["ADMIN", "BILLING"].includes(user.role) && query
    ? data.bills.filter((bill) => {
        const lot = lotById.get(bill.lotId);
        return includesQuery(bill.invoiceNumber, query) || includesQuery(lot?.lotNumber, query) || includesQuery(dealerById.get(bill.dealerId), query);
      })
    : [];

  return (
    <ProtectedShell>
      <PageTransition>
        <div className="stacked-layout">
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Search Results</h2>
                <p>{query ? `Showing matches for "${q}".` : "Enter a lot, dealer, or invoice number from the top search."}</p>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Lots</h2>
                <p>{lots.length} matching lots.</p>
              </div>
              <PackageSearch size={20} aria-hidden="true" />
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.length > 0 ? (
                    lots.map((lot) => (
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
                        <td>
                          <Link className="table-action" href={`/lots/${lot.id}`}>
                            <Eye size={15} aria-hidden="true" />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>No lot matches.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {user.role === "ADMIN" ? (
            <section className="card">
              <div className="section-heading">
                <div>
                  <h2>Dealers</h2>
                  <p>{dealers.length} matching dealers.</p>
                </div>
                <Users size={20} aria-hidden="true" />
              </div>
              <div className="entity-grid">
                {dealers.length > 0 ? (
                  dealers.map((dealer) => (
                    <Link className="entity-card" href={`/dealers/${dealer.id}`} key={dealer.id}>
                      <strong>{dealer.name}</strong>
                      <small>{dealer.contactPerson} · {dealer.phone}</small>
                    </Link>
                  ))
                ) : (
                  <p className="muted-cell">No dealer matches.</p>
                )}
              </div>
            </section>
          ) : null}

          {["ADMIN", "BILLING"].includes(user.role) ? (
            <section className="card">
              <div className="section-heading">
                <div>
                  <h2>Invoices</h2>
                  <p>{invoices.length} matching invoices.</p>
                </div>
                <ReceiptText size={20} aria-hidden="true" />
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Lot No</th>
                      <th>Dealer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length > 0 ? (
                      invoices.map((bill) => {
                        const lot = lotById.get(bill.lotId);
                        return (
                          <tr key={bill.id}>
                            <td className="mono">{bill.invoiceNumber}</td>
                            <td>{lot?.lotNumber ?? "Unknown lot"}</td>
                            <td>{dealerById.get(bill.dealerId) ?? "Unknown dealer"}</td>
                            <td>{formatCurrency(bill.totalAmount)}</td>
                            <td>
                              <StatusBadge status={bill.paymentStatus} />
                            </td>
                            <td>{formatDate(bill.invoiceDate)}</td>
                            <td>
                              <Link className="table-action" href={`/billing/${bill.id}`}>
                                <Eye size={15} aria-hidden="true" />
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7}>No invoice matches.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </PageTransition>
    </ProtectedShell>
  );
}
