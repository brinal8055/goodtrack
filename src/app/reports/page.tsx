import { BarChart2, Download, Printer } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/page-transition";
import { PrintButton } from "@/components/print-button";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatCurrency, formatNumber } from "@/lib/format";
import { reportDefinitions } from "@/lib/reports";

export default async function ReportsPage() {
  await requireRoles(["ADMIN"]);
  const data = await readStore();
  const billed = data.bills.reduce((total, bill) => total + bill.totalAmount, 0);
  const collected = data.bills.reduce((total, bill) => total + bill.paidAmount, 0);

  return (
    <ProtectedShell>
      <PageTransition>
        <div className="stacked-layout">
          <section className="summary-grid">
            <div>
              <span>Total Lots</span>
              <strong>{formatNumber(data.lots.length)}</strong>
            </div>
            <div>
              <span>Total Billed</span>
              <strong>{formatCurrency(billed)}</strong>
            </div>
            <div>
              <span>Total Collected</span>
              <strong>{formatCurrency(collected)}</strong>
            </div>
            <div>
              <span>Outstanding</span>
              <strong>{formatCurrency(billed - collected)}</strong>
            </div>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Reports Hub</h2>
                <p>Factory, billing, dispatch, and completion reports with CSV export and print support.</p>
              </div>
              <PrintButton label="Print hub" />
            </div>

            <div className="entity-grid">
              {reportDefinitions.map((report) => (
                <article className="entity-card" key={report.type}>
                  <span className="entity-icon">
                    <BarChart2 size={18} aria-hidden="true" />
                  </span>
                  <strong>{report.title}</strong>
                  <small>{report.description}</small>
                  <div className="action-cell">
                    <Link className="table-action" href={`/reports/${report.type}`}>
                      View
                    </Link>
                    <Link className="table-action" href={`/reports/${report.type}/csv`}>
                      <Download size={15} aria-hidden="true" />
                      CSV
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card print-note">
            <Printer size={18} aria-hidden="true" />
            <span>Use the print button on any report to save a formatted PDF from the browser print dialog.</span>
          </section>
        </div>
      </PageTransition>
    </ProtectedShell>
  );
}
