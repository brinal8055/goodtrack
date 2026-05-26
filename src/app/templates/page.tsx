import { Eye, Plus } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";

export default async function TemplatesPage() {
  await requireRoles(["ADMIN"]);
  const data = await readStore();

  return (
    <ProtectedShell>
      <PageTransition>
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Process Templates</h2>
              <p>Reusable production flows assigned during material inward.</p>
            </div>
            <Link className="btn btn-primary" href="/templates/new">
              <Plus size={16} aria-hidden="true" />
              Add template
            </Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Steps</th>
                  <th>Assigned Lots</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.processTemplates.map((template) => {
                  const assignedLots = data.lots.filter((lot) => lot.processTemplateId === template.id).length;
                  return (
                    <tr key={template.id}>
                      <td>{template.name}</td>
                      <td>{template.steps.length}</td>
                      <td>{assignedLots}</td>
                      <td>{template.description}</td>
                      <td>
                        <Link className="table-action" href={`/templates/${template.id}/edit`}>
                          <Eye size={15} aria-hidden="true" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </PageTransition>
    </ProtectedShell>
  );
}
