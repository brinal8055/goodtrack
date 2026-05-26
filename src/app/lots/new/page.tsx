import { PackagePlus } from "lucide-react";
import Link from "next/link";

import { createLotAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { nextLotNumber } from "@/lib/workflow";

function dateTimeLocalValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function NewLotPage() {
  await requireRoles(["ADMIN", "ENTRY_OPERATOR"]);
  const data = await readStore();
  const lotNumber = nextLotNumber(data);

  return (
    <ProtectedShell>
      <PageTransition>
        <form action={createLotAction} className="card form-card">
          <div className="section-heading">
            <div>
              <h2>New Material Entry</h2>
              <p>Create the inward record and first audit timeline entry.</p>
            </div>
            <span className="readonly-code mono">{lotNumber}</span>
          </div>

          <div className="form-grid">
            <label className="field">
              Supplier / Dealer
              <select name="dealerId" required>
                <option value="">Select dealer</option>
                {data.dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name}
                  </option>
                ))}
              </select>
              <Link className="field-link" href="/dealers/new?returnTo=/lots/new">
                Add new dealer
              </Link>
            </label>
            <label className="field">
              Material Type
              <input name="materialType" list="material-types" placeholder="Cotton, Rayon, Linen Blend" required />
              <datalist id="material-types">
                <option value="Cotton" />
                <option value="Rayon" />
                <option value="Linen Blend" />
                <option value="Polyester" />
                <option value="Viscose" />
              </datalist>
            </label>
            <label className="field">
              Quantity
              <input min="0" name="quantity" step="0.01" type="number" required />
            </label>
            <label className="field">
              Unit
              <select name="unit" required>
                <option value="Meters">Meters</option>
                <option value="Kg">Kg</option>
                <option value="Pieces">Pieces</option>
              </select>
            </label>
            <label className="field">
              Challan / DC Number
              <input name="challanNumber" required />
            </label>
            <label className="field">
              Vehicle Number
              <input name="vehicleNumber" />
            </label>
            <label className="field">
              Received Date & Time
              <input defaultValue={dateTimeLocalValue()} name="receivedAt" type="datetime-local" required />
            </label>
            <label className="field">
              Rate
              <input min="0" name="rate" step="0.01" type="number" required />
            </label>
            <label className="field">
              Godown
              <select name="godownId" required>
                <option value="">Select godown</option>
                {data.godowns.map((godown) => (
                  <option key={godown.id} value={godown.id}>
                    {godown.name} · {godown.location}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Rack / Section
              <input name="rackSection" placeholder="A-01" required />
            </label>
            <label className="field form-grid-wide">
              Process Template
              <select name="processTemplateId" required>
                <option value="">Select template</option>
                {data.processTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field form-grid-wide">
              Remarks
              <textarea name="remarks" placeholder="Shade notes, urgency, or handling instructions" />
            </label>
          </div>

          <div className="form-actions">
            <Link className="btn btn-secondary" href="/lots">
              Cancel
            </Link>
            <button className="btn btn-primary" type="submit">
              <PackagePlus size={16} aria-hidden="true" />
              Save material entry
            </button>
          </div>
        </form>
      </PageTransition>
    </ProtectedShell>
  );
}
