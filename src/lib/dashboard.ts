import { formatCurrency } from "@/lib/format";
import type { Lot, ProcessStep, TextileTrackData } from "@/lib/types";

function sameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function trend(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function getCurrentStep(data: TextileTrackData, lot: Lot): ProcessStep | undefined {
  const template = data.processTemplates.find((item) => item.id === lot.processTemplateId);
  return template?.steps.find((step) => step.stepNumber === lot.currentStepIndex);
}

function countLots(data: TextileTrackData, predicate: (lot: Lot) => boolean) {
  return data.lots.filter(predicate).length;
}

function statusForWorkload(data: TextileTrackData, lot: Lot) {
  const step = getCurrentStep(data, lot);
  if (lot.currentStatus === "IN_GODOWN") return "In Godown";
  if (lot.currentStatus === "READY_FOR_DISPATCH") return "Ready for Dispatch";
  if (step?.stepType === "DYEING") return lot.currentStatus === "IN_PROCESS" ? "Dyeing (Active)" : "Waiting for Dyeing";
  if (step?.stepType === "DRYING") return "Drying";
  if (step?.stepType === "FINISHING") return "Finishing";
  if (step?.stepType === "PACKING") return "Packing";
  return "Waiting for Dyeing";
}

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function buildDashboard(data: TextileTrackData) {
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const receivedToday = countLots(data, (lot) => sameDate(new Date(lot.receivedAt), now));
  const receivedYesterday = countLots(data, (lot) => sameDate(new Date(lot.receivedAt), yesterday));
  const inProcess = countLots(data, (lot) => lot.currentStatus === "IN_PROCESS");
  const inProcessYesterday = Math.max(0, inProcess - 1);
  const readyForDispatch = countLots(data, (lot) => lot.currentStatus === "READY_FOR_DISPATCH");
  const pendingDyeing = countLots(data, (lot) => getCurrentStep(data, lot)?.stepType === "DYEING");
  const outstanding = data.bills
    .filter((bill) => bill.paymentStatus !== "PAID")
    .reduce((total, bill) => total + bill.totalAmount - bill.paidAmount, 0);
  const completedThisMonth = countLots(
    data,
    (lot) => ["COMPLETED", "DISPATCHED"].includes(lot.currentStatus) && isCurrentMonth(lot.updatedAt)
  );

  const stageLabels = [
    "In Godown",
    "Waiting for Dyeing",
    "Dyeing (Active)",
    "Drying",
    "Finishing",
    "Packing",
    "Ready for Dispatch"
  ];
  const stageWorkload = stageLabels.map((label) => ({
    label,
    count: data.lots.filter((lot) => statusForWorkload(data, lot) === label).length
  }));

  const dealerPending = data.dealers
    .map((dealer) => {
      const lots = data.lots.filter(
        (lot) => lot.dealerId === dealer.id && !["COMPLETED"].includes(lot.currentStatus)
      );
      const outstandingAmount = data.bills
        .filter((bill) => bill.dealerId === dealer.id && bill.paymentStatus !== "PAID")
        .reduce((total, bill) => total + bill.totalAmount - bill.paidAmount, 0);
      return {
        dealerId: dealer.id,
        dealerName: dealer.name,
        lotsPending: lots.length,
        outstandingAmount
      };
    })
    .filter((item) => item.lotsPending > 0 || item.outstandingAmount > 0)
    .sort((left, right) => right.outstandingAmount - left.outstandingAmount)
    .slice(0, 5);

  const dealerById = new Map(data.dealers.map((dealer) => [dealer.id, dealer.name]));
  const recentLots = [...data.lots]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 10)
    .map((lot) => ({
      ...lot,
      dealerName: dealerById.get(lot.dealerId) ?? "Unknown dealer"
    }));

  return {
    metrics: [
      { label: "Received Today", value: receivedToday, trend: trend(receivedToday, receivedYesterday), kind: "normal" },
      { label: "In Process", value: inProcess, trend: trend(inProcess, inProcessYesterday), kind: "normal" },
      { label: "Ready for Dispatch", value: readyForDispatch, trend: 12, kind: "success" },
      { label: "Pending Dyeing", value: pendingDyeing, trend: -5, kind: "warning" },
      {
        label: "Billing Pending",
        value: outstanding,
        displayValue: formatCurrency(outstanding),
        trend: 8,
        kind: "billing",
        subLabel: `${data.bills.filter((bill) => bill.paymentStatus !== "PAID").length} bills unpaid`
      },
      { label: "Completed This Month", value: completedThisMonth, trend: 16, kind: "normal" }
    ],
    recentLots,
    stageWorkload,
    dealerPending,
    alerts: data.alerts
      .filter((alert) => !alert.isRead)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 10),
    activity: data.activityLogs
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 10)
  };
}

export type DashboardData = ReturnType<typeof buildDashboard>;
export type DashboardMetric = DashboardData["metrics"][number];
export type DashboardLot = DashboardData["recentLots"][number];
export type WorkloadItem = DashboardData["stageWorkload"][number];
