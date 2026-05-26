import type { Lot, LotStatus, ProcessStep, TextileTrackData } from "@/lib/types";

export function slugifyId(prefix: string, value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return `${prefix}-${slug || Date.now().toString(36)}`;
}

export function nextLotNumber(data: TextileTrackData) {
  const number = data.settings.nextLotNumber;
  return `${data.settings.lotPrefix}${String(number).padStart(4, "0")}`;
}

export function nextInvoiceNumber(data: TextileTrackData) {
  const number = data.settings.nextInvoiceNumber;
  return `${data.settings.invoicePrefix}-${new Date().getFullYear()}-${String(number).padStart(4, "0")}`;
}

export function nextEntityId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getTemplate(data: TextileTrackData, lot: Pick<Lot, "processTemplateId">) {
  return data.processTemplates.find((template) => template.id === lot.processTemplateId);
}

export function getCurrentStep(data: TextileTrackData, lot: Lot): ProcessStep | undefined {
  return getTemplate(data, lot)?.steps.find((step) => step.stepNumber === lot.currentStepIndex);
}

export function statusForStep(step?: ProcessStep): LotStatus {
  if (!step) return "COMPLETED";
  if (step.stepType === "RAW_MATERIAL_RECEIVED") return "RECEIVED";
  if (step.stepType === "GODOWN_STORAGE") return "IN_GODOWN";
  if (step.stepType === "DISPATCH") return "READY_FOR_DISPATCH";
  return "IN_PROCESS";
}

export function nextProcessStep(data: TextileTrackData, lot: Lot) {
  return getTemplate(data, lot)?.steps.find(
    (step) => step.stepNumber > lot.currentStepIndex && step.stepType !== "DISPATCH"
  );
}

export function firstProcessingStep(data: TextileTrackData, lot: Lot) {
  return getTemplate(data, lot)?.steps.find(
    (step) => step.stepType !== "RAW_MATERIAL_RECEIVED" && step.stepType !== "GODOWN_STORAGE"
  );
}

export function hasStartedStage(data: TextileTrackData, lot: Lot) {
  return data.stageUpdates.some(
    (update) => update.lotId === lot.id && update.stepNumber === lot.currentStepIndex && update.status === "STARTED"
  );
}

export function isStageCompleted(data: TextileTrackData, lot: Lot, stepNumber = lot.currentStepIndex) {
  return data.stageUpdates.some(
    (update) => update.lotId === lot.id && update.stepNumber === stepNumber && update.status === "COMPLETED"
  );
}

export function computeNextStatus(data: TextileTrackData, lot: Lot, completedStepNumber: number) {
  const template = getTemplate(data, lot);
  const nextStep = template?.steps.find((step) => step.stepNumber > completedStepNumber && step.stepType !== "DISPATCH");
  if (!nextStep) {
    return {
      currentStepIndex: completedStepNumber,
      currentStatus: "READY_FOR_DISPATCH" as const
    };
  }

  return {
    currentStepIndex: nextStep.stepNumber,
    currentStatus: statusForStep(nextStep)
  };
}
