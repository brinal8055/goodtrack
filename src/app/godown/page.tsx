import { Eye, Warehouse } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatNumber } from "@/lib/format";

export default async function GodownPage() {
  await requireRoles(["ADMIN", "GODOWN"]);
  const data = await readStore();

  return (
    <ProtectedShell>
      <PageTransition>
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Godown Overview</h2>
              <p>Storage locations and lots waiting for process movement.</p>
            </div>
          </div>
          <div className="entity-grid">
            {data.godowns.map((godown) => {
              const lots = data.lots.filter(
                (lot) => lot.godownId === godown.id && ["RECEIVED", "IN_GODOWN"].includes(lot.currentStatus)
              );
              const quantity = lots.reduce((total, lot) => total + lot.quantity, 0);
              return (
                <Link className="entity-card" href={`/godown/${godown.id}`} key={godown.id}>
                  <span className="entity-icon">
                    <Warehouse size={20} aria-hidden="true" />
                  </span>
                  <strong>{godown.name}</strong>
                  <small>{godown.location}</small>
                  <dl>
                    <div>
                      <dt>Lots Stored</dt>
                      <dd>{lots.length}</dd>
                    </div>
                    <div>
                      <dt>Total Qty</dt>
                      <dd>{formatNumber(quantity)}</dd>
                    </div>
                  </dl>
                  <span className="table-action">
                    <Eye size={15} aria-hidden="true" />
                    Open
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </PageTransition>
    </ProtectedShell>
  );
}
