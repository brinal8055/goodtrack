export type Role = "ADMIN" | "ENTRY_OPERATOR" | "GODOWN" | "PROCESSING" | "BILLING";

export type StepType =
  | "RAW_MATERIAL_RECEIVED"
  | "GODOWN_STORAGE"
  | "DYEING"
  | "DRYING"
  | "FINISHING"
  | "PACKING"
  | "DISPATCH"
  | "CUSTOM";

export type LotStatus =
  | "RECEIVED"
  | "IN_GODOWN"
  | "IN_PROCESS"
  | "STAGE_COMPLETED"
  | "READY_FOR_DISPATCH"
  | "DISPATCHED"
  | "COMPLETED";

export type StageUpdateStatus = "STARTED" | "COMPLETED" | "SKIPPED";
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID";
export type AlertType =
  | "LOT_STUCK"
  | "BILLING_OVERDUE"
  | "DISPATCH_READY"
  | "STAGE_COMPLETED"
  | "NEW_LOT_RECEIVED";

export interface Dealer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  gstin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessStep {
  stepNumber: number;
  stepName: string;
  stepType: StepType;
}

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  steps: ProcessStep[];
  createdAt: string;
}

export interface Lot {
  id: string;
  lotNumber: string;
  dealerId: string;
  materialType: string;
  quantity: number;
  unit: "Meters" | "Kg" | "Pieces";
  challanNumber: string;
  vehicleNumber?: string;
  receivedAt: string;
  rate: number;
  rateUnit: string;
  godownId: string;
  rackSection: string;
  processTemplateId: string;
  currentStepIndex: number;
  currentStatus: LotStatus;
  remarks?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LotStageUpdate {
  id: string;
  lotId: string;
  stepNumber: number;
  stepName: string;
  status: StageUpdateStatus;
  quantityDone: number;
  quantityPending: number;
  updatedBy: string;
  remarks?: string;
  timestamp: string;
}

export interface GodownSection {
  sectionName: string;
  capacity?: number;
}

export interface Godown {
  id: string;
  name: string;
  location: string;
  sections: GodownSection[];
  createdAt: string;
}

export interface Bill {
  id: string;
  lotId: string;
  dealerId: string;
  materialCost: number;
  dyeingCost: number;
  finishingCost: number;
  packingCost: number;
  additionalCharges: number;
  additionalChargesDescription?: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  invoiceNumber: string;
  invoiceDate: string;
  challanDetails: string;
  dispatchDate?: string;
  vehicleNumber?: string;
  transporterName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  lotId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: "LOT" | "BILL" | "DEALER" | "GODOWN" | "TEMPLATE" | "USER" | "ALERT" | "SETTINGS";
  entityId: string;
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  gstNumber: string;
  lotPrefix: string;
  nextLotNumber: number;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  stuckThresholdHours: number;
  billingOverdueDays: number;
}

export interface TextileTrackData {
  dealers: Dealer[];
  processTemplates: ProcessTemplate[];
  lots: Lot[];
  stageUpdates: LotStageUpdate[];
  godowns: Godown[];
  bills: Bill[];
  users: User[];
  alerts: Alert[];
  activityLogs: ActivityLog[];
  settings: AppSettings;
}
