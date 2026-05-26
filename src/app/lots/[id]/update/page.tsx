import { CheckCircle2, PlayCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateStageAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatNumber } from "@/lib/format";
import { getCurrentStep, hasStartedStage } from "@/lib/workflow";

export default async function UpdateLotStagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRoles(["ADMIN", "PROCESSING"]);
  const { id } = await params;
  const data = await readStore();
  const lot = data.lots.find((item) => item.id === id);
  if (!lot) notFound();
  const dealer = data.dealers.find((item) => item.id === lot.dealerId);
  const currentStep = getCurrentStep(data, lot);
  if (!currentStep) notFound();
  const started = hasStartedStage(data, lot);
  const defaultDone = started ? lot.quantity : 0;

  return (
    <ProtectedShell>
      <PageTransition>
        <form action={updateStageAction} className="card form-card narrow-form">
          <input name="lotId" type="hidden" value={lot.id} />
          <div className="section-heading">
            <div>
              <h2>Update Stage</h2>
              <p>
                <span className="mono">{lot.lotNumber}</span> · {dealer?.name ?? "Unknown dealer"}
              </p>
            </div>
            <StatusBadge status={lot.currentStatus} />
          </div>

          <div className="readonly-panel">
            <div>
              <span>Current Stage</span>
              <strong>{currentStep.stepName}</strong>
            </div>
            <div>
              <span>Total Quantity</span>
              <strong>
                {formatNumber(lot.quantity)} {lot.unit}
              </strong>
            </div>
          </div>

          <div className="form-grid two-column">
            <label className="field">
              Quantity Done
              <input defaultValue={defaultDone} min="0" name="quantityDone" step="0.01" type="number" required />
            </label>
            <label className="field">
              Quantity Pending
              <input defaultValue={Math.max(lot.quantity - defaultDone, 0)} min="0" name="quantityPending" step="0.01" type="number" />
            </label>
            <label className="field form-grid-wide">
              Remarks
              <textarea name="remarks" placeholder="Stage remarks, partial batch note, shade correction, etc." />
            </label>
          </div>

          <div className="form-actions split-actions">
            <Link className="btn btn-secondary" href={`/lots/${lot.id}`}>
              Cancel
            </Link>
            <span>
              {!started ? (
                <button className="btn btn-secondary" name="action" type="submit" value="STARTED">
                  <PlayCircle size={16} aria-hidden="true" />
                  Mark started
                </button>
              ) : null}
              <button className="btn btn-primary" name="action" type="submit" value="COMPLETED">
                <CheckCircle2 size={16} aria-hidden="true" />
                Mark completed
              </button>
            </span>
          </div>
        </form>
      </PageTransition>
    </ProtectedShell>
  );
}
