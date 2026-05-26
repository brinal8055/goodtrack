import { humanizeStatus } from "@/lib/format";
import type { LotStatus, PaymentStatus } from "@/lib/types";

const lotClasses: Record<LotStatus, string> = {
  RECEIVED: "badge-received",
  IN_GODOWN: "badge-in-godown",
  IN_PROCESS: "badge-in-process",
  STAGE_COMPLETED: "badge-in-process",
  READY_FOR_DISPATCH: "badge-ready",
  DISPATCHED: "badge-dispatched",
  COMPLETED: "badge-completed"
};

const paymentClasses: Record<PaymentStatus, string> = {
  PENDING: "badge-billing",
  PARTIAL: "badge-billing",
  PAID: "badge-ready"
};

export function StatusBadge({ status, stuck = false }: { status: LotStatus | PaymentStatus; stuck?: boolean }) {
  const variant =
    status in lotClasses ? lotClasses[status as LotStatus] : paymentClasses[status as PaymentStatus];

  return <span className={`badge ${stuck ? "badge-stuck" : variant}`}>{stuck ? "Stuck" : humanizeStatus(status)}</span>;
}
