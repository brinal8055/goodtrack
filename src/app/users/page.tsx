import { Plus, Save, Users } from "lucide-react";

import { addUserAction, updateUserAction } from "@/app/workflow-actions";
import { PageTransition } from "@/components/page-transition";
import { ProtectedShell } from "@/components/protected-shell";
import { requireRoles } from "@/lib/auth";
import { readStore } from "@/lib/data-store";
import { formatDateTime, roleLabel } from "@/lib/format";
import type { Role } from "@/lib/types";

const roles: Role[] = ["ADMIN", "ENTRY_OPERATOR", "GODOWN", "PROCESSING", "BILLING"];

export default async function UsersPage() {
  await requireRoles(["ADMIN"]);
  const data = await readStore();
  const users = [...data.users].sort((left, right) => left.name.localeCompare(right.name));

  return (
    <ProtectedShell>
      <PageTransition>
        <div className="stacked-layout">
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>User Management</h2>
                <p>Manage role access, active status, and password resets.</p>
              </div>
              <span className="entity-icon">
                <Users size={18} aria-hidden="true" />
              </span>
            </div>

            <div className="table-scroll user-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Reset Password</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td colSpan={7}>
                        <form action={updateUserAction} className="user-row-form">
                          <input name="userId" type="hidden" value={user.id} />
                          <input aria-label="Name" defaultValue={user.name} name="name" required />
                          <input aria-label="Email" defaultValue={user.email} name="email" type="email" required />
                          <select aria-label="Role" defaultValue={user.role} name="role" required>
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {roleLabel(role)}
                              </option>
                            ))}
                          </select>
                          <label className="checkbox-field">
                            <input defaultChecked={user.isActive} name="isActive" type="checkbox" />
                            Active
                          </label>
                          <span className="muted-cell">{user.lastLogin ? formatDateTime(user.lastLogin) : "Never"}</span>
                          <input aria-label="Reset password" name="resetPassword" placeholder="Optional new password" type="password" />
                          <button className="btn btn-secondary" type="submit">
                            <Save size={16} aria-hidden="true" />
                            Save
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <form action={addUserAction} className="card form-card">
            <div className="section-heading">
              <div>
                <h2>Add User</h2>
                <p>Create an active account for one of the five system roles.</p>
              </div>
            </div>
            <div className="form-grid">
              <label className="field">
                Name
                <input name="name" required />
              </label>
              <label className="field">
                Email
                <input name="email" type="email" required />
              </label>
              <label className="field">
                Password
                <input name="password" type="password" required />
              </label>
              <label className="field">
                Role
                <select name="role" required>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                <Plus size={16} aria-hidden="true" />
                Add user
              </button>
            </div>
          </form>
        </div>
      </PageTransition>
    </ProtectedShell>
  );
}
