import { Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageTransition } from "@/components/page-transition";
import { PrintButton } from "@/components/print-button";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { buildReport, isReportType } from "@/lib/reports";

export default async function ReportDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRoles(["ADMIN"]);
  const { type } = await params;
  if (!isReportType(type)) notFound();

  const filters = await searchParams;
  const data = await readStore();
  const report = buildReport(data, type, filters);
  const query = new URLSearchParams();
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  const csvHref = `/reports/${type}/csv${query.toString() ? `?${query.toString()}` : ""}`;

  return (
    <ProtectedShell>
      <PageTransition>
        <div className="stacked-layout">
          <section className="card report-header-card">
            <div className="section-heading">
              <div>
                <p className="breadcrumb">Reports</p>
                <h2>{report.title}</h2>
                <p>{report.description}</p>
              </div>
              <div className="action-cell">
                <Link className="btn btn-secondary" href={csvHref}>
                  <Download size={16} aria-hidden="true" />
                  Export CSV
                </Link>
                <PrintButton />
              </div>
            </div>
            <form className="form-grid two-column report-filter-form" method="get">
              <label className="field">
                From
                <input defaultValue={filters.from} name="from" type="date" />
              </label>
              <label className="field">
                To
                <input defaultValue={filters.to} name="to" type="date" />
              </label>
              <div className="form-actions form-grid-wide">
                <Link className="btn btn-secondary" href={`/reports/${type}`}>
                  Clear
                </Link>
                <button className="btn btn-primary" type="submit">
                  Apply filters
                </button>
              </div>
            </form>
          </section>

          <section className="summary-grid">
            {report.summary.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </section>

          <section className="card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {report.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.length > 0 ? (
                    report.rows.map((row, index) => (
                      <tr key={`${row[0]}-${index}`}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${cell}-${cellIndex}`}>{cell}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={report.columns.length}>No rows match this report.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </PageTransition>
    </ProtectedShell>
  );
}
