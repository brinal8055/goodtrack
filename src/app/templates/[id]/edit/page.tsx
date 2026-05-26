import { Workflow } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { saveTemplateAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRoles(["ADMIN"]);
  const { id } = await params;
  const data = await readStore();
  const template = data.processTemplates.find((item) => item.id === id);
  if (!template) notFound();
  const customSteps = template.steps
    .filter((step) => !["RAW_MATERIAL_RECEIVED", "GODOWN_STORAGE", "DISPATCH"].includes(step.stepType))
    .map((step) => step.stepName)
    .join("\n");

  return (
    <ProtectedShell>
      <PageTransition>
        <form action={saveTemplateAction} className="card form-card narrow-form">
          <input name="templateId" type="hidden" value={template.id} />
          <div className="section-heading">
            <div>
              <h2>Edit Template</h2>
              <p>Templates already assigned to lots update future stage labels only.</p>
            </div>
            <Workflow size={24} aria-hidden="true" />
          </div>
          <div className="form-grid two-column">
            <label className="field form-grid-wide">
              Template Name
              <input defaultValue={template.name} name="name" required />
            </label>
            <label className="field form-grid-wide">
              Description
              <textarea defaultValue={template.description} name="description" />
            </label>
            <label className="field form-grid-wide">
              Processing Steps
              <textarea defaultValue={customSteps} name="steps" required />
              <span className="field-hint">Receiving, godown, and dispatch remain locked.</span>
            </label>
          </div>
          <div className="form-actions">
            <Link className="btn btn-secondary" href="/templates">
              Cancel
            </Link>
            <button className="btn btn-primary" type="submit">
              Save changes
            </button>
          </div>
        </form>
      </PageTransition>
    </ProtectedShell>
  );
}
