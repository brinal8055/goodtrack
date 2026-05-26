"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRoles } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/data-store";
import { hashPassword } from "@/lib/security";
import type { ActivityLog, PaymentStatus, ProcessStep, Role, StepType } from "@/lib/types";
import {
  computeNextStatus,
  firstProcessingStep,
  hasStartedStage,
  nextEntityId,
  nextInvoiceNumber,
  nextLotNumber,
  slugifyId,
  statusForStep
} from "@/lib/workflow";

function requireString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function requireNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value) || value < 0) throw new Error(`${key} must be a valid number`);
  return value;
}

function requireRole(formData: FormData, key: string) {
  const value = requireString(formData, key) as Role;
  if (!["ADMIN", "ENTRY_OPERATOR", "GODOWN", "PROCESSING", "BILLING"].includes(value)) {
    throw new Error(`${key} must be a valid role`);
  }
  return value;
}

function recordActivity(
  draft: Awaited<ReturnType<typeof readStore>>,
  actor: { id: string; name: string },
  action: string,
  entityType: ActivityLog["entityType"],
  entityId: string
) {
  draft.activityLogs.unshift({
    id: nextEntityId("activity"),
    actorId: actor.id,
    actorName: actor.name,
    action,
    entityType,
    entityId,
    createdAt: new Date().toISOString()
  });
}

function isoFromDateInput(value: string) {
  return new Date(`${value}T00:00:00`).toISOString();
}

function optionalIsoFromDateInput(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  return value ? isoFromDateInput(value) : undefined;
}

function paymentStatusForAmount(totalAmount: number, paidAmount: number): PaymentStatus {
  if (paidAmount >= totalAmount && totalAmount > 0) return "PAID";
  if (paidAmount > 0) return "PARTIAL";
  return "PENDING";
}

export async function createLotAction(formData: FormData) {
  const user = await requireRoles(["ADMIN", "ENTRY_OPERATOR"]);
  let createdLotId = "";

  await writeStore((draft) => {
    const dealerId = requireString(formData, "dealerId");
    const godownId = requireString(formData, "godownId");
    const processTemplateId = requireString(formData, "processTemplateId");
    const dealer = draft.dealers.find((item) => item.id === dealerId);
    const godown = draft.godowns.find((item) => item.id === godownId);
    const template = draft.processTemplates.find((item) => item.id === processTemplateId);
    if (!dealer || !godown || !template) throw new Error("Dealer, godown, and process template must exist");

    const lotNumber = nextLotNumber(draft);
    const now = new Date().toISOString();
    const quantity = requireNumber(formData, "quantity");
    const unit = requireString(formData, "unit") as "Meters" | "Kg" | "Pieces";
    const receivedAt = requireString(formData, "receivedAt");
    createdLotId = `lot-${lotNumber.replace(draft.settings.lotPrefix, "").toLowerCase()}`;

    draft.lots.unshift({
      id: createdLotId,
      lotNumber,
      dealerId,
      materialType: requireString(formData, "materialType"),
      quantity,
      unit,
      challanNumber: requireString(formData, "challanNumber"),
      vehicleNumber: optionalString(formData, "vehicleNumber"),
      receivedAt: new Date(receivedAt).toISOString(),
      rate: requireNumber(formData, "rate"),
      rateUnit: unit === "Kg" ? "per kg" : unit === "Pieces" ? "per piece" : "per meter",
      godownId,
      rackSection: requireString(formData, "rackSection"),
      processTemplateId,
      currentStepIndex: 1,
      currentStatus: "RECEIVED",
      remarks: optionalString(formData, "remarks"),
      createdBy: user.id,
      createdAt: now,
      updatedAt: now
    });

    draft.stageUpdates.unshift({
      id: nextEntityId("stage"),
      lotId: createdLotId,
      stepNumber: 1,
      stepName: "Raw Material Received",
      status: "COMPLETED",
      quantityDone: quantity,
      quantityPending: 0,
      updatedBy: user.id,
      remarks: "Initial inward entry completed.",
      timestamp: now
    });

    draft.alerts.unshift({
      id: nextEntityId("alert"),
      type: "NEW_LOT_RECEIVED",
      lotId: createdLotId,
      message: `${lotNumber} was received for ${dealer.name}.`,
      isRead: false,
      createdAt: now
    });

    draft.settings.nextLotNumber += 1;
    recordActivity(draft, user, `created new lot ${lotNumber} for ${dealer.name}`, "LOT", createdLotId);
  });

  revalidatePath("/");
  redirect(`/lots/${createdLotId}`);
}

export async function addDealerAction(formData: FormData) {
  const user = await requireRoles(["ADMIN", "ENTRY_OPERATOR"]);
  let dealerId = "";
  const returnTo = String(formData.get("returnTo") ?? "");

  await writeStore((draft) => {
    const name = requireString(formData, "name");
    const now = new Date().toISOString();
    dealerId = slugifyId("dealer", name);
    if (draft.dealers.some((dealer) => dealer.id === dealerId)) dealerId = nextEntityId("dealer");

    draft.dealers.unshift({
      id: dealerId,
      name,
      contactPerson: requireString(formData, "contactPerson"),
      phone: requireString(formData, "phone"),
      email: optionalString(formData, "email"),
      address: requireString(formData, "address"),
      gstin: optionalString(formData, "gstin"),
      createdAt: now,
      updatedAt: now
    });
    recordActivity(draft, user, `added dealer ${name}`, "DEALER", dealerId);
  });

  revalidatePath("/dealers");
  redirect(returnTo.startsWith("/") ? returnTo : user.role === "ADMIN" ? `/dealers/${dealerId}` : "/lots/new");
}

export async function moveLotToProcessAction(formData: FormData) {
  const user = await requireRoles(["ADMIN", "GODOWN"]);
  const lotId = requireString(formData, "lotId");

  await writeStore((draft) => {
    const lot = draft.lots.find((item) => item.id === lotId);
    if (!lot) throw new Error("Lot not found");
    const template = draft.processTemplates.find((item) => item.id === lot.processTemplateId);
    if (!template) throw new Error("Template not found");
    const godownStep = template.steps.find((step) => step.stepType === "GODOWN_STORAGE");
    const nextStep = firstProcessingStep(draft, lot);
    const now = new Date().toISOString();

    if (godownStep && !draft.stageUpdates.some((update) => update.lotId === lot.id && update.stepNumber === godownStep.stepNumber && update.status === "COMPLETED")) {
      draft.stageUpdates.unshift({
        id: nextEntityId("stage"),
        lotId: lot.id,
        stepNumber: godownStep.stepNumber,
        stepName: godownStep.stepName,
        status: "COMPLETED",
        quantityDone: lot.quantity,
        quantityPending: 0,
        updatedBy: user.id,
        remarks: optionalString(formData, "remarks") ?? `Moved from ${lot.rackSection} to processing.`,
        timestamp: now
      });
    }

    lot.currentStepIndex = nextStep?.stepNumber ?? lot.currentStepIndex;
    lot.currentStatus = nextStep ? statusForStep(nextStep) : "READY_FOR_DISPATCH";
    lot.updatedAt = now;
    recordActivity(draft, user, `moved ${lot.lotNumber} from godown to process`, "LOT", lot.id);
  });

  revalidatePath("/");
  redirect(`/lots/${lotId}`);
}

export async function updateStageAction(formData: FormData) {
  const user = await requireRoles(["ADMIN", "PROCESSING"]);
  const lotId = requireString(formData, "lotId");
  const action = requireString(formData, "action") as "STARTED" | "COMPLETED";

  await writeStore((draft) => {
    const lot = draft.lots.find((item) => item.id === lotId);
    if (!lot) throw new Error("Lot not found");
    const template = draft.processTemplates.find((item) => item.id === lot.processTemplateId);
    const step = template?.steps.find((item) => item.stepNumber === lot.currentStepIndex);
    if (!step) throw new Error("Current process step not found");
    const now = new Date().toISOString();
    const quantityDone = requireNumber(formData, "quantityDone");
    const quantityPending = Number(formData.get("quantityPending") || Math.max(lot.quantity - quantityDone, 0));

    if (action === "STARTED" && hasStartedStage(draft, lot)) {
      throw new Error("This stage is already started");
    }

    draft.stageUpdates.unshift({
      id: nextEntityId("stage"),
      lotId: lot.id,
      stepNumber: step.stepNumber,
      stepName: step.stepName,
      status: action,
      quantityDone,
      quantityPending: Number.isFinite(quantityPending) ? quantityPending : 0,
      updatedBy: user.id,
      remarks: optionalString(formData, "remarks"),
      timestamp: now
    });

    if (action === "COMPLETED") {
      draft.alerts.unshift({
        id: nextEntityId("stage-alert"),
        type: "STAGE_COMPLETED",
        lotId: lot.id,
        message: `${step.stepName} completed for ${lot.lotNumber}.`,
        isRead: false,
        createdAt: now
      });

      const next = computeNextStatus(draft, lot, step.stepNumber);
      lot.currentStepIndex = next.currentStepIndex;
      lot.currentStatus = next.currentStatus;
      if (next.currentStatus === "READY_FOR_DISPATCH") {
        draft.alerts.unshift({
          id: nextEntityId("alert"),
          type: "DISPATCH_READY",
          lotId: lot.id,
          message: `${lot.lotNumber} is ready for dispatch.`,
          isRead: false,
          createdAt: now
        });
      }
    } else {
      lot.currentStatus = "IN_PROCESS";
    }

    lot.updatedAt = now;
    recordActivity(draft, user, `${action === "COMPLETED" ? "completed" : "started"} ${step.stepName} for ${lot.lotNumber}`, "LOT", lot.id);
  });

  revalidatePath("/");
  redirect(`/lots/${lotId}`);
}

export async function raiseInvoiceAction(formData: FormData) {
  const user = await requireRoles(["ADMIN", "BILLING"]);
  let billId = "";

  await writeStore((draft) => {
    const lotId = requireString(formData, "lotId");
    const lot = draft.lots.find((item) => item.id === lotId);
    if (!lot) throw new Error("Lot not found");
    if (!["READY_FOR_DISPATCH", "DISPATCHED"].includes(lot.currentStatus)) {
      throw new Error("Only ready or dispatched lots can be invoiced");
    }
    if (draft.bills.some((bill) => bill.lotId === lot.id)) throw new Error("Invoice already exists for this lot");

    const materialCost = requireNumber(formData, "materialCost");
    const dyeingCost = requireNumber(formData, "dyeingCost");
    const finishingCost = requireNumber(formData, "finishingCost");
    const packingCost = requireNumber(formData, "packingCost");
    const additionalCharges = requireNumber(formData, "additionalCharges");
    const totalAmount = materialCost + dyeingCost + finishingCost + packingCost + additionalCharges;
    const requestedStatus = requireString(formData, "paymentStatus") as PaymentStatus;
    const autoInvoiceNumber = nextInvoiceNumber(draft);
    const invoiceNumber = optionalString(formData, "invoiceNumber") ?? autoInvoiceNumber;

    if (draft.bills.some((bill) => bill.invoiceNumber === invoiceNumber)) {
      throw new Error("Invoice number already exists");
    }

    let paidAmount = requireNumber(formData, "paidAmount");
    if (requestedStatus === "PENDING") paidAmount = 0;
    if (requestedStatus === "PAID" && paidAmount <= 0) paidAmount = totalAmount;
    paidAmount = Math.min(paidAmount, totalAmount);
    const paymentStatus = paymentStatusForAmount(totalAmount, paidAmount);
    const now = new Date().toISOString();
    const template = draft.processTemplates.find((item) => item.id === lot.processTemplateId);
    const dispatchStep = template?.steps.find((step) => step.stepType === "DISPATCH");

    billId = slugifyId("bill", invoiceNumber);
    if (draft.bills.some((bill) => bill.id === billId)) billId = nextEntityId("bill");

    draft.bills.unshift({
      id: billId,
      lotId: lot.id,
      dealerId: lot.dealerId,
      materialCost,
      dyeingCost,
      finishingCost,
      packingCost,
      additionalCharges,
      additionalChargesDescription: optionalString(formData, "additionalChargesDescription"),
      totalAmount,
      paidAmount,
      paymentStatus,
      invoiceNumber,
      invoiceDate: isoFromDateInput(requireString(formData, "invoiceDate")),
      challanDetails: requireString(formData, "challanDetails"),
      dispatchDate: optionalIsoFromDateInput(formData, "dispatchDate"),
      vehicleNumber: optionalString(formData, "vehicleNumber"),
      transporterName: optionalString(formData, "transporterName"),
      createdBy: user.id,
      createdAt: now,
      updatedAt: now
    });

    lot.currentStepIndex = dispatchStep?.stepNumber ?? lot.currentStepIndex;
    lot.currentStatus = paymentStatus === "PAID" ? "COMPLETED" : "DISPATCHED";
    lot.updatedAt = now;

    if (invoiceNumber === autoInvoiceNumber) draft.settings.nextInvoiceNumber += 1;
    if (paymentStatus === "PAID") {
      draft.alerts.forEach((alert) => {
        if (alert.lotId === lot.id && alert.type === "BILLING_OVERDUE") alert.isRead = true;
      });
    }

    recordActivity(draft, user, `raised invoice ${invoiceNumber} for ${lot.lotNumber}`, "BILL", billId);
  });

  revalidatePath("/");
  redirect(`/billing/${billId}`);
}

export async function updatePaymentAction(formData: FormData) {
  const user = await requireRoles(["ADMIN", "BILLING"]);
  const billId = requireString(formData, "billId");

  await writeStore((draft) => {
    const bill = draft.bills.find((item) => item.id === billId);
    if (!bill) throw new Error("Invoice not found");
    if (bill.paymentStatus === "PAID") throw new Error("Invoice is already paid");

    const amountReceived = requireNumber(formData, "amountReceived");
    if (amountReceived <= 0) throw new Error("Amount received must be greater than zero");

    const lot = draft.lots.find((item) => item.id === bill.lotId);
    const paymentDate = requireString(formData, "paymentDate");
    const paymentMode = requireString(formData, "paymentMode");
    const referenceNumber = optionalString(formData, "referenceNumber");

    bill.paidAmount = Math.min(bill.totalAmount, bill.paidAmount + amountReceived);
    bill.paymentStatus = paymentStatusForAmount(bill.totalAmount, bill.paidAmount);
    bill.updatedAt = new Date().toISOString();

    if (lot) {
      lot.currentStatus = bill.paymentStatus === "PAID" ? "COMPLETED" : "DISPATCHED";
      lot.updatedAt = bill.updatedAt;
      if (bill.paymentStatus === "PAID") {
        draft.alerts.forEach((alert) => {
          if (alert.lotId === lot.id && alert.type === "BILLING_OVERDUE") alert.isRead = true;
        });
      }
    }

    recordActivity(
      draft,
      user,
      `recorded ${paymentMode} payment for ${bill.invoiceNumber} on ${paymentDate}${referenceNumber ? ` (${referenceNumber})` : ""}`,
      "BILL",
      bill.id
    );
  });

  revalidatePath("/");
  redirect(`/billing/${billId}`);
}

export async function dismissAlertAction(formData: FormData) {
  const user = await requireRoles(["ADMIN"]);
  const alertId = requireString(formData, "alertId");

  await writeStore((draft) => {
    const alert = draft.alerts.find((item) => item.id === alertId);
    if (!alert) throw new Error("Alert not found");
    alert.isRead = true;
    recordActivity(draft, user, `dismissed alert ${alert.message}`, "ALERT", alert.id);
  });

  revalidatePath("/");
}

export async function markAllAlertsReadAction() {
  const user = await requireRoles(["ADMIN"]);

  await writeStore((draft) => {
    draft.alerts.forEach((alert) => {
      alert.isRead = true;
    });
    recordActivity(draft, user, "marked all alerts as read", "ALERT", "all");
  });

  revalidatePath("/");
}

export async function updateSettingsAction(formData: FormData) {
  const user = await requireRoles(["ADMIN"]);

  await writeStore((draft) => {
    draft.settings.companyName = requireString(formData, "companyName");
    draft.settings.companyAddress = requireString(formData, "companyAddress");
    draft.settings.gstNumber = requireString(formData, "gstNumber");
    draft.settings.lotPrefix = requireString(formData, "lotPrefix");
    draft.settings.nextLotNumber = Math.floor(requireNumber(formData, "nextLotNumber"));
    draft.settings.invoicePrefix = requireString(formData, "invoicePrefix");
    draft.settings.nextInvoiceNumber = Math.floor(requireNumber(formData, "nextInvoiceNumber"));
    draft.settings.stuckThresholdHours = Math.floor(requireNumber(formData, "stuckThresholdHours"));
    draft.settings.billingOverdueDays = Math.floor(requireNumber(formData, "billingOverdueDays"));
    recordActivity(draft, user, "updated system settings", "SETTINGS", "settings");
  });

  revalidatePath("/");
  redirect("/settings");
}

export async function addUserAction(formData: FormData) {
  const user = await requireRoles(["ADMIN"]);
  const password = requireString(formData, "password");
  const passwordHash = await hashPassword(password);

  await writeStore((draft) => {
    const name = requireString(formData, "name");
    const email = requireString(formData, "email").toLowerCase();
    const role = requireRole(formData, "role");

    if (draft.users.some((item) => item.email.toLowerCase() === email)) {
      throw new Error("A user with this email already exists");
    }

    const now = new Date().toISOString();
    const userId = slugifyId("user", email);
    const id = draft.users.some((item) => item.id === userId) ? nextEntityId("user") : userId;

    draft.users.unshift({
      id,
      name,
      email,
      passwordHash,
      role,
      isActive: true,
      createdAt: now
    });
    recordActivity(draft, user, `added user ${name}`, "USER", id);
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUserAction(formData: FormData) {
  const user = await requireRoles(["ADMIN"]);
  const userId = requireString(formData, "userId");
  const resetPassword = optionalString(formData, "resetPassword");
  const resetPasswordHash = resetPassword ? await hashPassword(resetPassword) : null;

  await writeStore((draft) => {
    const existing = draft.users.find((item) => item.id === userId);
    if (!existing) throw new Error("User not found");

    const nextRole = requireRole(formData, "role");
    const isActive = formData.get("isActive") === "on";
    const activeAdminsAfterChange = draft.users.filter((item) => {
      if (item.id === existing.id) return isActive && nextRole === "ADMIN";
      return item.isActive && item.role === "ADMIN";
    }).length;

    if (activeAdminsAfterChange === 0) throw new Error("At least one active admin is required");

    const email = requireString(formData, "email").toLowerCase();
    if (draft.users.some((item) => item.id !== existing.id && item.email.toLowerCase() === email)) {
      throw new Error("A user with this email already exists");
    }

    existing.name = requireString(formData, "name");
    existing.email = email;
    existing.role = nextRole;
    existing.isActive = isActive;

    if (resetPasswordHash) existing.passwordHash = resetPasswordHash;

    recordActivity(draft, user, `updated user ${existing.name}`, "USER", existing.id);
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function saveTemplateAction(formData: FormData) {
  const user = await requireRoles(["ADMIN"]);
  let templateId = String(formData.get("templateId") ?? "").trim();

  await writeStore((draft) => {
    const name = requireString(formData, "name");
    const now = new Date().toISOString();
    const customStepNames = String(formData.get("steps") ?? "")
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean);
    const steps: ProcessStep[] = [
      { stepNumber: 1, stepName: "Raw Material Received", stepType: "RAW_MATERIAL_RECEIVED" },
      { stepNumber: 2, stepName: "Godown Storage", stepType: "GODOWN_STORAGE" },
      ...customStepNames.map((stepName, index) => ({
        stepNumber: index + 3,
        stepName,
        stepType: inferStepType(stepName)
      })),
      { stepNumber: customStepNames.length + 3, stepName: "Dispatch", stepType: "DISPATCH" as const }
    ];

    if (templateId) {
      const existing = draft.processTemplates.find((template) => template.id === templateId);
      if (!existing) throw new Error("Template not found");
      existing.name = name;
      existing.description = optionalString(formData, "description") ?? "";
      existing.steps = steps;
      recordActivity(draft, user, `updated process template ${name}`, "TEMPLATE", templateId);
      return;
    }

    templateId = slugifyId("template", name);
    if (draft.processTemplates.some((template) => template.id === templateId)) templateId = nextEntityId("template");
    draft.processTemplates.unshift({
      id: templateId,
      name,
      description: optionalString(formData, "description") ?? "",
      steps,
      createdAt: now
    });
    recordActivity(draft, user, `created process template ${name}`, "TEMPLATE", templateId);
  });

  revalidatePath("/templates");
  redirect("/templates");
}

function inferStepType(stepName: string): StepType {
  const value = stepName.toLowerCase();
  if (value.includes("dye")) return "DYEING";
  if (value.includes("dry")) return "DRYING";
  if (value.includes("finish")) return "FINISHING";
  if (value.includes("pack")) return "PACKING";
  if (value.includes("dispatch")) return "DISPATCH";
  return "CUSTOM";
}
