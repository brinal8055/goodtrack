import type { Role } from "@/lib/types";

export const roleHome: Record<Role, string> = {
  ADMIN: "/dashboard",
  ENTRY_OPERATOR: "/lots/new",
  GODOWN: "/godown",
  PROCESSING: "/process-queue",
  BILLING: "/billing"
};

export const routeAccess: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/dashboard", roles: ["ADMIN"] },
  { prefix: "/lots/new", roles: ["ADMIN", "ENTRY_OPERATOR"] },
  { prefix: "/lots", roles: ["ADMIN", "ENTRY_OPERATOR", "GODOWN", "PROCESSING", "BILLING"] },
  { prefix: "/godown", roles: ["ADMIN", "GODOWN"] },
  { prefix: "/process-queue", roles: ["ADMIN", "PROCESSING"] },
  { prefix: "/billing", roles: ["ADMIN", "BILLING"] },
  { prefix: "/search", roles: ["ADMIN", "ENTRY_OPERATOR", "GODOWN", "PROCESSING", "BILLING"] },
  { prefix: "/dealers/new", roles: ["ADMIN", "ENTRY_OPERATOR"] },
  { prefix: "/dealers", roles: ["ADMIN"] },
  { prefix: "/templates", roles: ["ADMIN"] },
  { prefix: "/reports", roles: ["ADMIN"] },
  { prefix: "/alerts", roles: ["ADMIN"] },
  { prefix: "/users", roles: ["ADMIN"] },
  { prefix: "/settings", roles: ["ADMIN"] }
];

export function allowedRolesForPath(pathname: string) {
  return routeAccess.find((entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`))
    ?.roles;
}
