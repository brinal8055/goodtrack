import { Plus, Workflow } from "lucide-react";
import Link from "next/link";

import { saveTemplateAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";

export default async function NewTemplatePage() {
  await requireRoles(["ADMIN"]);

  return (
    <ProtectedShell>
      <PageTransition>
        <TemplateForm />
      </PageTransition>
    </ProtectedShell>
  );
}

function TemplateForm() {
  return (
    <form action={saveTemplateAction} className="card form-card narrow-form">
      <div className="section-heading">
        <div>
          <h2>Template Builder</h2>
          <p>Receiving and godown steps are locked; add processing steps one per line.</p>
        </div>
        <Workflow size={24} aria-hidden="true" />
      </div>
      <div className="form-grid two-column">
        <label className="field form-grid-wide">
          Template Name
          <input name="name" required />
        </label>
        <label className="field form-grid-wide">
          Description
          <textarea name="description" />
        </label>
        <label className="field form-grid-wide">
          Processing Steps
          <textarea name="steps" placeholder={"Dyeing Round 1\nDrying\nFinishing\nPacking"} required />
          <span className="field-hint">Dispatch is appended automatically as the final locked step.</span>
        </label>
      </div>
      <div className="form-actions">
        <Link className="btn btn-secondary" href="/templates">
          Cancel
        </Link>
        <button className="btn btn-primary" type="submit">
          <Plus size={16} aria-hidden="true" />
          Save template
        </button>
      </div>
    </form>
  );
}
