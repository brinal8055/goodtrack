"use client";

import {
  BarChart2,
  Beaker,
  Bell,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  ReceiptText,
  Search,
  Settings2,
  Users,
  Warehouse
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { initials, roleLabel } from "@/lib/format";
import type { Role, User } from "@/lib/types";

const navItems: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
  { href: "/lots/new", label: "Material Inward", icon: PackagePlus, roles: ["ADMIN", "ENTRY_OPERATOR"] },
  { href: "/godown", label: "Godown", icon: Warehouse, roles: ["ADMIN", "GODOWN"] },
  { href: "/process-queue", label: "Dyeing / Process", icon: Beaker, roles: ["ADMIN", "PROCESSING"] },
  { href: "/billing", label: "Billing", icon: ReceiptText, roles: ["ADMIN", "BILLING"] },
  { href: "/dealers", label: "Dealers", icon: Users, roles: ["ADMIN"] },
  { href: "/reports", label: "Reports", icon: BarChart2, roles: ["ADMIN"] },
  { href: "/alerts", label: "Alerts", icon: Bell, roles: ["ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings2, roles: ["ADMIN"] }
];

function titleForPath(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/lots/new")) return "Material Inward";
  if (pathname.startsWith("/lots")) return "Lots";
  if (pathname.startsWith("/godown")) return "Godown";
  if (pathname.startsWith("/process-queue")) return "Dyeing / Process";
  if (pathname.startsWith("/billing")) return "Billing";
  if (pathname.startsWith("/search")) return "Search";
  if (pathname.startsWith("/dealers")) return "Dealers";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/alerts")) return "Alerts";
  if (pathname.startsWith("/users")) return "Users";
  if (pathname.startsWith("/settings")) return "Settings";
  return "TextileTrack";
}

export function AppShell({
  user,
  unreadAlerts,
  children
}: {
  user: Pick<User, "name" | "role">;
  unreadAlerts: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="sidebar-logo" href="/">
          <span className="logo-mark">TT</span>
          <span>TextileTrack</span>
        </Link>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link key={item.href} className={`nav-item ${active ? "active" : ""}`} href={item.href}>
                {active ? <motion.span className="nav-active-bg" layoutId="nav-active-bg" /> : null}
                <Icon aria-hidden="true" size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <span className="avatar">{initials(user.name)}</span>
            <span>
              <strong>{user.name}</strong>
              <small>{roleLabel(user.role)}</small>
            </span>
          </div>
          <a className="logout-link" href="/api/logout">
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </a>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Factory Control</p>
            <h1>{titleForPath(pathname)}</h1>
          </div>
          <div className="topbar-actions">
            <form action="/search" className="global-search" method="get">
              <Search aria-hidden="true" size={16} />
              <input aria-label="Global search" name="q" placeholder="Search lots, dealers, invoices" />
            </form>
            <Link className="icon-button" aria-label="Alerts" href="/alerts">
              <Bell size={18} />
              {unreadAlerts > 0 ? <span>{unreadAlerts}</span> : null}
            </Link>
            <span className="topbar-avatar">{initials(user.name)}</span>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
