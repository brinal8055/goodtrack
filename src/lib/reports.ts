import { formatCurrency, formatDate, formatDateTime, formatNumber, humanizeStatus } from "@/lib/format";
import type { Lot, TextileTrackData } from "@/lib/types";
import { getCurrentStep } from "@/lib/workflow";

export type ReportType =
  | "daily-inward"
  | "lot-status"
  | "pending-dyeing"
  | "material-stuck"
  | "dealer-wise"
  | "billing-pending"
  | "dispatch"
  | "completed-summary";

export const reportDefinitions: Array<{ type: ReportType; title: string; description: string }> = [
  { type: "daily-inward", title: "Daily Inward Report", description: "Lots received in the selected date range." },
  { type: "lot-status", title: "Lot Status Report", description: "Current status of every lot." },
  { type: "pending-dyeing", title: "Pending Dyeing Report", description: "Lots waiting for or running dyeing stages." },
  { type: "material-stuck", title: "Material Stuck Report", description: "Lots past the configured stage threshold." },
  { type: "dealer-wise", title: "Dealer-wise Report", description: "Dealer lot counts and billing balances." },
  { type: "billing-pending", title: "Billing Pending Report", description: "Invoices with pending or partial payment." },
  { type: "dispatch", title: "Dispatch Report", description: "Dispatched lots with vehicle and invoice details." },
  { type: "completed-summary", title: "Completed Lots Summary", description: "Completed lots, billed amount, and collected amount." }
];

export interface ReportFilters {
  from?: string;
  to?: string;
}

export interface ReportResult {
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
  summary: Array<{ label: string; value: string }>;
}

function definitionFor(type: ReportType) {
  return reportDefinitions.find((definition) => definition.type === type)!;
}

export function isReportType(value: string): value is ReportType {
  return reportDefinitions.some((definition) => definition.type === value);
}

function dateInRange(value: string | undefined, filters: ReportFilters) {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (filters.from && time < new Date(`${filters.from}T00:00:00`).getTime()) return false;
  if (filters.to && time > new Date(`${filters.to}T23:59:59`).getTime()) return false;
  return true;
}

function dealerName(data: TextileTrackData, dealerId: string) {
  return data.dealers.find((dealer) => dealer.id === dealerId)?.name ?? "Unknown dealer";
}

function lotNumber(data: TextileTrackData, lotId: string) {
  return data.lots.find((lot) => lot.id === lotId)?.lotNumber ?? "Unknown lot";
}

function quantityLabel(lot: Lot) {
  return `${formatNumber(lot.quantity)} ${lot.unit}`;
}

function latestStageTime(data: TextileTrackData, lot: Lot) {
  return data.stageUpdates
    .filter((update) => update.lotId === lot.id && update.stepNumber === lot.currentStepIndex)
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0]?.timestamp ?? lot.updatedAt;
}

function hoursSince(value: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60)));
}

export function buildReport(data: TextileTrackData, type: ReportType, filters: ReportFilters = {}): ReportResult {
  const definition = definitionFor(type);

  if (type === "daily-inward") {
    const rows = data.lots
      .filter((lot) => dateInRange(lot.receivedAt, filters))
      .map((lot) => [
        formatDate(lot.receivedAt),
        lot.lotNumber,
        dealerName(data, lot.dealerId),
        lot.materialType,
        quantityLabel(lot),
        `${formatCurrency(lot.rate)} ${lot.rateUnit}`,
        data.godowns.find((godown) => godown.id === lot.godownId)?.name ?? "Unknown godown"
      ]);

    return { ...definition, columns: ["Date", "Lot No", "Dealer", "Material", "Quantity", "Rate", "Godown"], rows, summary: [{ label: "Lots received", value: formatNumber(rows.length) }] };
  }

  if (type === "lot-status") {
    const rows = data.lots
      .filter((lot) => dateInRange(lot.receivedAt, filters))
      .map((lot) => [lot.lotNumber, dealerName(data, lot.dealerId), lot.materialType, quantityLabel(lot), humanizeStatus(lot.currentStatus), getCurrentStep(data, lot)?.stepName ?? "Complete", formatDateTime(lot.updatedAt)]);

    return { ...definition, columns: ["Lot No", "Dealer", "Material", "Quantity", "Status", "Current Stage", "Last Updated"], rows, summary: [{ label: "Lots", value: formatNumber(rows.length) }] };
  }

  if (type === "pending-dyeing") {
    const rows = data.lots
      .filter((lot) => getCurrentStep(data, lot)?.stepType === "DYEING")
      .map((lot) => {
        const stageTime = latestStageTime(data, lot);
        return [lot.lotNumber, dealerName(data, lot.dealerId), getCurrentStep(data, lot)?.stepName ?? "Dyeing", `${hoursSince(stageTime)} hours`, quantityLabel(lot)];
      });

    return { ...definition, columns: ["Lot No", "Dealer", "Dyeing Stage", "Time in Stage", "Quantity"], rows, summary: [{ label: "Dyeing lots", value: formatNumber(rows.length) }] };
  }

  if (type === "material-stuck") {
    const rows = data.lots
      .filter((lot) => lot.currentStatus === "IN_PROCESS")
      .map((lot) => ({ lot, stageTime: latestStageTime(data, lot) }))
      .filter((item) => hoursSince(item.stageTime) >= data.settings.stuckThresholdHours)
      .sort((left, right) => hoursSince(right.stageTime) - hoursSince(left.stageTime))
      .map(({ lot, stageTime }) => [lot.lotNumber, dealerName(data, lot.dealerId), getCurrentStep(data, lot)?.stepName ?? "Current stage", `${hoursSince(stageTime)} hours`, `${data.settings.stuckThresholdHours} hours`]);

    return { ...definition, columns: ["Lot No", "Dealer", "Stage", "Time Stuck", "Threshold"], rows, summary: [{ label: "Stuck lots", value: formatNumber(rows.length) }] };
  }

  if (type === "dealer-wise") {
    const rows = data.dealers.map((dealer) => {
      const lots = data.lots.filter((lot) => lot.dealerId === dealer.id && dateInRange(lot.receivedAt, filters));
      const bills = data.bills.filter((bill) => bill.dealerId === dealer.id);
      const billed = bills.reduce((total, bill) => total + bill.totalAmount, 0);
      const paid = bills.reduce((total, bill) => total + bill.paidAmount, 0);
      return [dealer.name, dealer.contactPerson, formatNumber(lots.length), formatNumber(lots.filter((lot) => lot.currentStatus !== "COMPLETED").length), formatCurrency(billed), formatCurrency(paid), formatCurrency(billed - paid)];
    });

    return { ...definition, columns: ["Dealer", "Contact", "Lots", "Active Lots", "Total Billed", "Total Paid", "Outstanding"], rows, summary: [{ label: "Dealers", value: formatNumber(rows.length) }] };
  }

  if (type === "billing-pending") {
    const rows = data.bills
      .filter((bill) => bill.paymentStatus !== "PAID")
      .map((bill) => [dealerName(data, bill.dealerId), lotNumber(data, bill.lotId), bill.invoiceNumber, formatCurrency(bill.totalAmount), formatCurrency(bill.paidAmount), formatCurrency(bill.totalAmount - bill.paidAmount), `${Math.floor((Date.now() - new Date(bill.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))} days`]);

    return { ...definition, columns: ["Dealer", "Lot No", "Invoice", "Total", "Paid", "Balance", "Days Outstanding"], rows, summary: [{ label: "Pending invoices", value: formatNumber(rows.length) }] };
  }

  if (type === "dispatch") {
    const rows = data.bills
      .filter((bill) => dateInRange(bill.dispatchDate, filters))
      .map((bill) => [lotNumber(data, bill.lotId), dealerName(data, bill.dealerId), bill.dispatchDate ? formatDate(bill.dispatchDate) : "Not provided", bill.vehicleNumber ?? "-", bill.challanDetails, formatCurrency(bill.totalAmount)]);

    return { ...definition, columns: ["Lot No", "Dealer", "Dispatched On", "Vehicle", "Challan", "Invoice Amount"], rows, summary: [{ label: "Dispatches", value: formatNumber(rows.length) }] };
  }

  const completedLots = data.lots.filter((lot) => lot.currentStatus === "COMPLETED" && dateInRange(lot.updatedAt, filters));
  const rows = completedLots.map((lot) => {
    const bill = data.bills.find((item) => item.lotId === lot.id);
    return [lot.lotNumber, dealerName(data, lot.dealerId), lot.materialType, quantityLabel(lot), bill ? formatCurrency(bill.totalAmount) : "-", bill ? formatCurrency(bill.paidAmount) : "-", formatDate(lot.updatedAt)];
  });
  const totalBilled = completedLots.reduce((total, lot) => total + (data.bills.find((bill) => bill.lotId === lot.id)?.totalAmount ?? 0), 0);
  const totalCollected = completedLots.reduce((total, lot) => total + (data.bills.find((bill) => bill.lotId === lot.id)?.paidAmount ?? 0), 0);

  return {
    ...definition,
    columns: ["Lot No", "Dealer", "Material", "Quantity", "Billed", "Collected", "Completed On"],
    rows,
    summary: [
      { label: "Completed lots", value: formatNumber(rows.length) },
      { label: "Total billed", value: formatCurrency(totalBilled) },
      { label: "Total collected", value: formatCurrency(totalCollected) }
    ]
  };
}

export function toCsv(report: ReportResult) {
  const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [report.columns, ...report.rows].map((row) => row.map(escapeCell).join(",")).join("\n");
}
