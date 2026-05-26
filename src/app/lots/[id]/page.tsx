import { CheckCircle2, Circle, ReceiptText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { moveLotToProcessAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { PrintButton } from "@/components/print-button";
import { ProtectedShell } from "@/components/protected-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { getCurrentStep } from "@/lib/workflow";

export default async function LotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRoles(["ADMIN", "ENTRY_OPERATOR", "GODOWN", "PROCESSING", "BILLING"]);
  const { id } = await params;
  const data = await readStore();
  const lot = data.lots.find((item) => item.id === id);
  if (!lot) notFound();

  const dealer = data.dealers.find((item) => item.id === lot.dealerId);
  const template = data.processTemplates.find((item) => item.id === lot.processTemplateId);
  const godown = data.godowns.find((item) => item.id === lot.godownId);
  const updates = data.stageUpdates.filter((item) => item.lotId === lot.id);
  const userById = new Map(data.users.map((user) => [user.id, user.name]));
  const bill = data.bills.find((item) => item.lotId === lot.id);
  const currentStep = getCurrentStep(data, lot);
  const canMoveToProcess = ["ADMIN", "GODOWN"].includes(user.role) && ["RECEIVED", "IN_GODOWN"].includes(lot.currentStatus);
  const canUpdateStage =
    ["ADMIN", "PROCESSING"].includes(user.role) &&
    lot.currentStatus === "IN_PROCESS" &&
    currentStep &&
    !["RAW_MATERIAL_RECEIVED", "GODOWN_STORAGE", "DISPATCH"].includes(currentStep.stepType);
  const canManageBilling = ["ADMIN", "BILLING"].includes(user.role) && (bill || ["READY_FOR_DISPATCH", "DISPATCHED"].includes(lot.currentStatus));

  return (
    <ProtectedShell>
      <PageTransition>
        <article className="lot-detail">
          <header className="lot-header card">
            <div>
              <p className="breadcrumb">Lot Detail</p>
              <h2 className="mono">{lot.lotNumber}</h2>
              <p>
                {dealer?.name ?? "Unknown dealer"} · {lot.materialType} · {formatNumber(lot.quantity)} {lot.unit}
              </p>
            </div>
            <div className="lot-header-actions">
              <StatusBadge status={lot.currentStatus} />
              <PrintButton />
            </div>
          </header>

          <section className="card timeline-card">
            <div className="section-heading">
              <div>
                <h2>Journey Timeline</h2>
                <p>{template?.name ?? "No process template assigned"}</p>
              </div>
            </div>
            <div className="timeline">
              {template?.steps.map((step) => {
                const completed = updates.find((update) => update.stepNumber === step.stepNumber && update.status === "COMPLETED");
                const started = updates.find((update) => update.stepNumber === step.stepNumber && update.status === "STARTED");
                const active = lot.currentStepIndex === step.stepNumber && !completed && lot.currentStatus !== "COMPLETED";
                const update = completed ?? started;

                return (
                  <article
                    className={`timeline-step ${completed ? "completed" : ""} ${active ? "active" : ""}`}
                    key={step.stepNumber}
                  >
                    <span className="timeline-marker">
                      {completed ? <CheckCircle2 size={18} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
                    </span>
                    <div>
                      <h3>{step.stepName}</h3>
                      {update ? (
                        <p>
                          {update.status === "COMPLETED" ? "Completed" : "Started"} by{" "}
                          {userById.get(update.updatedBy) ?? "Unknown user"} · {formatDateTime(update.timestamp)} ·{" "}
                          {formatNumber(update.quantityDone)} done
                          {update.quantityPending > 0 ? `, ${formatNumber(update.quantityPending)} pending` : ""}
                        </p>
                      ) : (
                        <p>Pending</p>
                      )}
                      {update?.remarks ? <small>{update.remarks}</small> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="card lot-summary">
            <h2>Summary</h2>
            <dl>
              <div>
                <dt>Dealer</dt>
                <dd>{dealer?.name ?? "Unknown dealer"}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{formatDateTime(lot.receivedAt)}</dd>
              </div>
              <div>
                <dt>Rate</dt>
                <dd>
                  {formatCurrency(lot.rate)} {lot.rateUnit}
                </dd>
              </div>
              <div>
                <dt>Godown</dt>
                <dd>
                  {godown?.name ?? "Unknown"} · {lot.rackSection}
                </dd>
              </div>
              <div>
                <dt>Challan / Vehicle</dt>
                <dd>
                  {lot.challanNumber}
                  {lot.vehicleNumber ? ` · ${lot.vehicleNumber}` : ""}
                </dd>
              </div>
              <div>
                <dt>Billing Status</dt>
                <dd>{bill ? <StatusBadge status={bill.paymentStatus} /> : "Not billed"}</dd>
              </div>
            </dl>
            {canMoveToProcess || canUpdateStage || canManageBilling ? (
              <div className="action-panel">
                <h3>Actions</h3>
                {canMoveToProcess ? (
                  <form action={moveLotToProcessAction}>
                    <input name="lotId" type="hidden" value={lot.id} />
                    <label className="field">
                      Move remarks
                      <textarea name="remarks" placeholder="Optional note for the godown handoff" />
                    </label>
                    <button className="btn btn-teal" type="submit">
                      Move to process
                    </button>
                  </form>
                ) : null}
                {canUpdateStage ? (
                  <Link className="btn btn-primary" href={`/lots/${lot.id}/update`}>
                    Update current stage
                  </Link>
                ) : null}
                {canManageBilling ? (
                  <Link className="btn btn-primary" href={bill ? `/billing/${bill.id}` : `/lots/${lot.id}/invoice`}>
                    <ReceiptText size={16} aria-hidden="true" />
                    {bill ? "View invoice" : "Raise invoice"}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </aside>
        </article>
      </PageTransition>
    </ProtectedShell>
  );
}
