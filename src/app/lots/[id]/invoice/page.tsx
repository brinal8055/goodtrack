import { notFound, redirect } from "next/navigation";

import { raiseInvoiceAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { nextInvoiceNumber } from "@/lib/workflow";

import { InvoiceForm } from "./invoice-form";

function dateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export default async function RaiseInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRoles(["ADMIN", "BILLING"]);
  const { id } = await params;
  const data = await readStore();
  const lot = data.lots.find((item) => item.id === id);
  if (!lot) notFound();

  const existingBill = data.bills.find((bill) => bill.lotId === lot.id);
  if (existingBill) redirect(`/billing/${existingBill.id}`);
  if (!["READY_FOR_DISPATCH", "DISPATCHED"].includes(lot.currentStatus)) redirect(`/lots/${lot.id}`);

  const dealer = data.dealers.find((item) => item.id === lot.dealerId);

  return (
    <ProtectedShell>
      <PageTransition>
        <div className="narrow-form">
          <InvoiceForm
            action={raiseInvoiceAction}
            dealerName={dealer?.name ?? "Unknown dealer"}
            invoiceDate={dateInputValue()}
            invoiceNumber={nextInvoiceNumber(data)}
            lot={{
              id: lot.id,
              lotNumber: lot.lotNumber,
              materialType: lot.materialType,
              quantity: lot.quantity,
              unit: lot.unit,
              rate: lot.rate,
              rateUnit: lot.rateUnit,
              vehicleNumber: lot.vehicleNumber
            }}
          />
        </div>
      </PageTransition>
    </ProtectedShell>
  );
}
