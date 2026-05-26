import { Settings2 } from "lucide-react";

import { updateSettingsAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";

export default async function SettingsPage() {
  await requireRoles(["ADMIN"]);
  const data = await readStore();
  const { settings } = data;

  return (
    <ProtectedShell>
      <PageTransition>
        <form action={updateSettingsAction} className="card form-card narrow-form">
          <div className="section-heading">
            <div>
              <h2>Settings</h2>
              <p>Company profile, alert thresholds, and numbering rules.</p>
            </div>
            <span className="entity-icon">
              <Settings2 size={18} aria-hidden="true" />
            </span>
          </div>

          <div className="form-grid">
            <label className="field">
              Company Name
              <input defaultValue={settings.companyName} name="companyName" required />
            </label>
            <label className="field">
              GST Number
              <input defaultValue={settings.gstNumber} name="gstNumber" required />
            </label>
            <label className="field form-grid-wide">
              Company Address
              <textarea defaultValue={settings.companyAddress} name="companyAddress" required />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              Lot Prefix
              <input defaultValue={settings.lotPrefix} name="lotPrefix" required />
            </label>
            <label className="field">
              Next Lot Number
              <input defaultValue={settings.nextLotNumber} min="1" name="nextLotNumber" type="number" required />
            </label>
            <label className="field">
              Invoice Prefix
              <input defaultValue={settings.invoicePrefix} name="invoicePrefix" required />
            </label>
            <label className="field">
              Next Invoice Number
              <input defaultValue={settings.nextInvoiceNumber} min="1" name="nextInvoiceNumber" type="number" required />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              Stuck Alert Threshold (hours)
              <input defaultValue={settings.stuckThresholdHours} min="1" name="stuckThresholdHours" type="number" required />
            </label>
            <label className="field">
              Billing Overdue Threshold (days)
              <input defaultValue={settings.billingOverdueDays} min="1" name="billingOverdueDays" type="number" required />
            </label>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Save settings
            </button>
          </div>
        </form>
      </PageTransition>
    </ProtectedShell>
  );
}
