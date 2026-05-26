import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updatePaymentAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { PrintButton } from "@/components/print-button";
import { ProtectedShell } from "@/components/protected-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

function dateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRoles(["ADMIN", "BILLING"]);
  const { id } = await params;
  const data = await readStore();
  const bill = data.bills.find((item) => item.id === id);
  if (!bill) notFound();

  const lot = data.lots.find((item) => item.id === bill.lotId);
  const dealer = data.dealers.find((item) => item.id === bill.dealerId);
  const balance = bill.totalAmount - bill.paidAmount;

  return (
    <ProtectedShell>
      <PageTransition>
        <article className="lot-detail">
          <header className="lot-header card">
            <div>
              <p className="breadcrumb">Invoice Detail</p>
              <h2 className="mono">{bill.invoiceNumber}</h2>
              <p>
                {lot?.lotNumber ?? "Unknown lot"} · {dealer?.name ?? "Unknown dealer"}
              </p>
            </div>
            <div className="lot-header-actions">
              <StatusBadge status={bill.paymentStatus} />
              <PrintButton label="Print invoice" />
            </div>
          </header>

          <section className="card timeline-card">
            <div className="section-heading">
              <div>
                <h2>Billing Breakdown</h2>
                <p>Cost lines, dispatch details, and payment balance.</p>
              </div>
              <ReceiptText size={20} aria-hidden="true" />
            </div>
            <div className="summary-grid">
              <div>
                <span>Total Amount</span>
                <strong>{formatCurrency(bill.totalAmount)}</strong>
              </div>
              <div>
                <span>Collected</span>
                <strong>{formatCurrency(bill.paidAmount)}</strong>
              </div>
              <div>
                <span>Balance</span>
                <strong>{formatCurrency(balance)}</strong>
              </div>
              <div>
                <span>Invoice Date</span>
                <strong>{formatDate(bill.invoiceDate)}</strong>
              </div>
            </div>

            <div className="readonly-panel billing-breakdown">
              <div>
                <span>Material Cost</span>
                <strong>{formatCurrency(bill.materialCost)}</strong>
              </div>
              <div>
                <span>Dyeing Cost</span>
                <strong>{formatCurrency(bill.dyeingCost)}</strong>
              </div>
              <div>
                <span>Finishing Cost</span>
                <strong>{formatCurrency(bill.finishingCost)}</strong>
              </div>
              <div>
                <span>Packing Cost</span>
                <strong>{formatCurrency(bill.packingCost)}</strong>
              </div>
              <div>
                <span>Additional Charges</span>
                <strong>{formatCurrency(bill.additionalCharges)}</strong>
              </div>
              <div>
                <span>Description</span>
                <strong>{bill.additionalChargesDescription ?? "None"}</strong>
              </div>
            </div>
          </section>

          <aside className="card lot-summary">
            <h2>Dispatch & Payment</h2>
            <dl>
              <div>
                <dt>Lot</dt>
                <dd>{lot ? <Link className="field-link mono" href={`/lots/${lot.id}`}>{lot.lotNumber}</Link> : "Unknown lot"}</dd>
              </div>
              <div>
                <dt>Dealer</dt>
                <dd>{dealer?.name ?? "Unknown dealer"}</dd>
              </div>
              <div>
                <dt>Dispatch Date</dt>
                <dd>{bill.dispatchDate ? formatDate(bill.dispatchDate) : "Not provided"}</dd>
              </div>
              <div>
                <dt>Vehicle / Transporter</dt>
                <dd>
                  {bill.vehicleNumber ?? "No vehicle"}
                  {bill.transporterName ? ` · ${bill.transporterName}` : ""}
                </dd>
              </div>
              <div>
                <dt>Challan / DO</dt>
                <dd>{bill.challanDetails}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatDateTime(bill.updatedAt)}</dd>
              </div>
            </dl>

            {bill.paymentStatus !== "PAID" ? (
              <div className="action-panel">
                <h3>Update Payment</h3>
                <form action={updatePaymentAction}>
                  <input name="billId" type="hidden" value={bill.id} />
                  <label className="field">
                    Amount Received
                    <input defaultValue={balance} max={balance} min="0" name="amountReceived" step="0.01" type="number" required />
                  </label>
                  <label className="field">
                    Payment Date
                    <input defaultValue={dateInputValue()} name="paymentDate" type="date" required />
                  </label>
                  <label className="field">
                    Payment Mode
                    <select name="paymentMode" required>
                      <option value="NEFT">NEFT</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </label>
                  <label className="field">
                    Reference Number
                    <input name="referenceNumber" placeholder="UTR, cheque no, or receipt ref" />
                  </label>
                  <button className="btn btn-teal" type="submit">
                    Record payment
                  </button>
                </form>
              </div>
            ) : null}
          </aside>
        </article>
      </PageTransition>
    </ProtectedShell>
  );
}
