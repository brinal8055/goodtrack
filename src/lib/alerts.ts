import type { AlertType, Lot, TextileTrackData } from "@/lib/types";
import { getCurrentStep, nextEntityId } from "@/lib/workflow";

function hasAlert(data: TextileTrackData, type: AlertType, lotId: string) {
  return data.alerts.some((alert) => alert.type === type && alert.lotId === lotId);
}

function addAlert(data: TextileTrackData, type: AlertType, lotId: string, message: string, createdAt: string) {
  if (hasAlert(data, type, lotId)) return;

  data.alerts.unshift({
    id: nextEntityId("alert"),
    type,
    lotId,
    message,
    isRead: false,
    createdAt
  });
}

function latestStageTimestamp(data: TextileTrackData, lot: Lot) {
  return data.stageUpdates
    .filter((update) => update.lotId === lot.id && update.stepNumber === lot.currentStepIndex)
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0]?.timestamp;
}

export function syncDerivedAlerts(data: TextileTrackData, now = new Date()) {
  const nowTime = now.getTime();

  data.lots.forEach((lot) => {
    if (lot.currentStatus === "READY_FOR_DISPATCH") {
      addAlert(data, "DISPATCH_READY", lot.id, `${lot.lotNumber} is ready for dispatch.`, now.toISOString());
    }

    if (lot.currentStatus === "IN_PROCESS") {
      const stageTimestamp = latestStageTimestamp(data, lot) ?? lot.updatedAt;
      const hoursInStage = (nowTime - new Date(stageTimestamp).getTime()) / (1000 * 60 * 60);
      const step = getCurrentStep(data, lot);

      if (hoursInStage >= data.settings.stuckThresholdHours) {
        addAlert(
          data,
          "LOT_STUCK",
          lot.id,
          `${lot.lotNumber} has been in ${step?.stepName ?? "the current stage"} for more than ${data.settings.stuckThresholdHours} hours.`,
          now.toISOString()
        );
      }
    }

    if (lot.currentStatus === "DISPATCHED") {
      const bill = data.bills.find((item) => item.lotId === lot.id);
      const daysSinceDispatch = (nowTime - new Date(lot.updatedAt).getTime()) / (1000 * 60 * 60 * 24);

      if (!bill && daysSinceDispatch >= data.settings.billingOverdueDays) {
        addAlert(
          data,
          "BILLING_OVERDUE",
          lot.id,
          `${lot.lotNumber} has been dispatched but billing has not been raised for ${data.settings.billingOverdueDays} days.`,
          now.toISOString()
        );
      }
    }
  });

  data.bills.forEach((bill) => {
    if (bill.paymentStatus === "PAID") return;

    const daysSinceInvoice = (nowTime - new Date(bill.invoiceDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceInvoice < data.settings.billingOverdueDays) return;

    const lot = data.lots.find((item) => item.id === bill.lotId);
    if (!lot) return;

    addAlert(
      data,
      "BILLING_OVERDUE",
      lot.id,
      `${lot.lotNumber} has pending collection for more than ${data.settings.billingOverdueDays} days.`,
      now.toISOString()
    );
  });
}
