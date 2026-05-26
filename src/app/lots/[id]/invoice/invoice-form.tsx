"use client";

import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { formatCurrency, formatNumber } from "@/lib/format";
import type { PaymentStatus } from "@/lib/types";

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function InvoiceForm({
  action,
  lot,
  dealerName,
  invoiceNumber,
  invoiceDate
}: {
  action: (formData: FormData) => void | Promise<void>;
  lot: {
    id: string;
    lotNumber: string;
    materialType: string;
    quantity: number;
    unit: string;
    rate: number;
    rateUnit: string;
    vehicleNumber?: string;
  };
  dealerName: string;
  invoiceNumber: string;
  invoiceDate: string;
}) {
  const [materialCost, setMaterialCost] = useState(String(lot.quantity * lot.rate));
  const [dyeingCost, setDyeingCost] = useState("0");
  const [finishingCost, setFinishingCost] = useState("0");
  const [packingCost, setPackingCost] = useState("0");
  const [additionalCharges, setAdditionalCharges] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [paidAmount, setPaidAmount] = useState("0");

  const totalAmount = useMemo(
    () => toNumber(materialCost) + toNumber(dyeingCost) + toNumber(finishingCost) + toNumber(packingCost) + toNumber(additionalCharges),
    [additionalCharges, dyeingCost, finishingCost, materialCost, packingCost]
  );
  const effectivePaidAmount = paymentStatus === "PENDING" ? 0 : paymentStatus === "PAID" ? totalAmount : toNumber(paidAmount);
  const balance = Math.max(totalAmount - effectivePaidAmount, 0);

  return (
    <form action={action} className="card form-card">
      <input name="lotId" type="hidden" value={lot.id} />
      <div className="section-heading">
        <div>
          <h2>Raise Invoice</h2>
          <p>Dispatch this lot and create its billing record.</p>
        </div>
        <span className="readonly-code mono">{invoiceNumber}</span>
      </div>

      <div className="readonly-panel">
        <div>
          <span>Lot Number</span>
          <strong className="mono">{lot.lotNumber}</strong>
        </div>
        <div>
          <span>Dealer</span>
          <strong>{dealerName}</strong>
        </div>
        <div>
          <span>Quantity</span>
          <strong>
            {formatNumber(lot.quantity)} {lot.unit}
          </strong>
        </div>
        <div>
          <span>Rate</span>
          <strong>
            {formatCurrency(lot.rate)} {lot.rateUnit}
          </strong>
        </div>
      </div>

      <div className="form-grid">
        <label className="field">
          Material Cost
          <input name="materialCost" min="0" onChange={(event) => setMaterialCost(event.target.value)} step="0.01" type="number" value={materialCost} required />
        </label>
        <label className="field">
          Dyeing Cost
          <input name="dyeingCost" min="0" onChange={(event) => setDyeingCost(event.target.value)} step="0.01" type="number" value={dyeingCost} required />
        </label>
        <label className="field">
          Finishing Cost
          <input name="finishingCost" min="0" onChange={(event) => setFinishingCost(event.target.value)} step="0.01" type="number" value={finishingCost} required />
        </label>
        <label className="field">
          Packing Cost
          <input name="packingCost" min="0" onChange={(event) => setPackingCost(event.target.value)} step="0.01" type="number" value={packingCost} required />
        </label>
        <label className="field">
          Additional Charges
          <input name="additionalCharges" min="0" onChange={(event) => setAdditionalCharges(event.target.value)} step="0.01" type="number" value={additionalCharges} required />
        </label>
        <label className="field">
          Additional Charges Description
          <input name="additionalChargesDescription" placeholder="Shade matching, freight, handling" />
        </label>
      </div>

      <section className="summary-grid">
        <div>
          <span>Total Amount</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </div>
        <div>
          <span>Paid Amount</span>
          <strong>{formatCurrency(effectivePaidAmount)}</strong>
        </div>
        <div>
          <span>Balance</span>
          <strong>{formatCurrency(balance)}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{paymentStatus}</strong>
        </div>
      </section>

      <div className="form-grid">
        <label className="field">
          Invoice Number
          <input className="mono" defaultValue={invoiceNumber} name="invoiceNumber" required />
        </label>
        <label className="field">
          Invoice Date
          <input defaultValue={invoiceDate} name="invoiceDate" type="date" required />
        </label>
        <label className="field">
          Payment Status
          <select name="paymentStatus" onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)} value={paymentStatus} required>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </label>
        <label className="field">
          Amount Paid
          <input name="paidAmount" min="0" onChange={(event) => setPaidAmount(event.target.value)} readOnly={paymentStatus !== "PARTIAL"} step="0.01" type="number" value={paymentStatus === "PENDING" ? "0" : paymentStatus === "PAID" ? String(totalAmount) : paidAmount} required />
        </label>
      </div>

      <div className="form-grid">
        <label className="field">
          Dispatch Date
          <input defaultValue={invoiceDate} name="dispatchDate" type="date" />
        </label>
        <label className="field">
          Vehicle Number
          <input defaultValue={lot.vehicleNumber} name="vehicleNumber" />
        </label>
        <label className="field">
          Transporter Name
          <input name="transporterName" placeholder="Transporter or logistics partner" />
        </label>
        <label className="field">
          Challan / DO Number
          <input defaultValue={`DO-${lot.lotNumber.replace("LOT-", "")}`} name="challanDetails" required />
        </label>
      </div>

      <div className="form-actions">
        <Link className="btn btn-secondary" href={`/lots/${lot.id}`}>
          Cancel
        </Link>
        <button className="btn btn-primary" type="submit">
          <ReceiptText size={16} aria-hidden="true" />
          Save invoice
        </button>
      </div>
    </form>
  );
}
