import type { LotStatus, PaymentStatus, Role } from "@/lib/types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function humanizeStatus(status: LotStatus | PaymentStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function roleLabel(role: Role) {
  const labels: Record<Role, string> = {
    ADMIN: "Admin",
    ENTRY_OPERATOR: "Entry Operator",
    GODOWN: "Godown",
    PROCESSING: "Processing",
    BILLING: "Billing"
  };
  return labels[role];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
