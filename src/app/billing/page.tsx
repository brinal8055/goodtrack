import { Eye, Plus, ReceiptText } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export default async function BillingPage() {
  await requireRoles(["ADMIN", "BILLING"]);
  const data = await readStore();
  const dealerById = new Map(data.dealers.map((dealer) => [dealer.id, dealer.name]));
  const lotById = new Map(data.lots.map((lot) => [lot.id, lot]));
  const billedLotIds = new Set(data.bills.map((bill) => bill.lotId));
  const bills = [...data.bills].sort((left, right) => new Date(right.invoiceDate).getTime() - new Date(left.invoiceDate).getTime());
  const readyLots = data.lots.filter(
    (lot) => ["READY_FOR_DISPATCH", "DISPATCHED"].includes(lot.currentStatus) && !billedLotIds.has(lot.id)
  );
  const totalBilled = data.bills.reduce((total, bill) => total + bill.totalAmount, 0);
  const totalCollected = data.bills.reduce((total, bill) => total + bill.paidAmount, 0);
  const totalOutstanding = totalBilled - totalCollected;

  return (
    <ProtectedShell>
      <PageTransition>
        <div className="stacked-layout">
          <section className="summary-grid">
            <div>
              <span>Total Billed</span>
              <strong>{formatCurrency(totalBilled)}</strong>
            </div>
            <div>
              <span>Total Collected</span>
              <strong>{formatCurrency(totalCollected)}</strong>
            </div>
            <div>
              <span>Total Outstanding</span>
              <strong>{formatCurrency(totalOutstanding)}</strong>
            </div>
            <div>
              <span>Pending Invoices</span>
              <strong>{formatNumber(readyLots.length)}</strong>
            </div>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Dispatch Queue</h2>
                <p>Ready lots waiting for invoice and dispatch details.</p>
              </div>
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
                  {readyLots.length > 0 ? (
                    readyLots.map((lot) => (
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
                          <Link className="table-action" href={`/lots/${lot.id}/invoice`}>
                            <Plus size={15} aria-hidden="true" />
                            Raise invoice
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>No ready lots waiting for billing.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Invoices</h2>
                <p>Billing history with paid and outstanding balances.</p>
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
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => {
                    const lot = lotById.get(bill.lotId);
                    return (
                      <tr key={bill.id}>
                        <td className="mono">{bill.invoiceNumber}</td>
                        <td>{lot?.lotNumber ?? "Unknown lot"}</td>
                        <td>{dealerById.get(bill.dealerId) ?? "Unknown dealer"}</td>
                        <td>{formatCurrency(bill.totalAmount)}</td>
                        <td>{formatCurrency(bill.paidAmount)}</td>
                        <td>{formatCurrency(bill.totalAmount - bill.paidAmount)}</td>
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
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </PageTransition>
    </ProtectedShell>
  );
}
