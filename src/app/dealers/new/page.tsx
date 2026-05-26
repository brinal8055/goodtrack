import { Plus } from "lucide-react";
import Link from "next/link";

import { addDealerAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";

export default async function NewDealerPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  await requireRoles(["ADMIN", "ENTRY_OPERATOR"]);
  const { returnTo } = await searchParams;

  return (
    <ProtectedShell>
      <PageTransition>
        <form action={addDealerAction} className="card form-card narrow-form">
          <input name="returnTo" type="hidden" value={returnTo ?? ""} />
          <div className="section-heading">
            <div>
              <h2>Add Dealer</h2>
              <p>Create a supplier profile for material inward entries.</p>
            </div>
          </div>
          <div className="form-grid two-column">
            <label className="field form-grid-wide">
              Full Name / Company Name
              <input name="name" required />
            </label>
            <label className="field">
              Contact Person
              <input name="contactPerson" required />
            </label>
            <label className="field">
              Phone Number
              <input name="phone" required />
            </label>
            <label className="field">
              Email
              <input name="email" type="email" />
            </label>
            <label className="field">
              GSTIN
              <input name="gstin" />
            </label>
            <label className="field form-grid-wide">
              Address
              <textarea name="address" required />
            </label>
          </div>
          <div className="form-actions">
            <Link className="btn btn-secondary" href="/dealers">
              Cancel
            </Link>
            <button className="btn btn-primary" type="submit">
              <Plus size={16} aria-hidden="true" />
              Save dealer
            </button>
          </div>
        </form>
      </PageTransition>
    </ProtectedShell>
  );
}
