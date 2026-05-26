"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Eye,
  Factory,
  PackageCheck,
  ReceiptText,
  Truck
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import type { DashboardData, DashboardMetric } from "@/lib/dashboard";
import { StatusBadge } from "@/components/status-badge";

function useCountUp(value: number) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = 800;

    function tick(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, value]);

  return display;
}

function iconForMetric(label: string) {
  if (label.includes("Received")) return PackageCheck;
  if (label.includes("Process")) return Factory;
  if (label.includes("Dispatch")) return Truck;
  if (label.includes("Dyeing")) return Clock3;
  if (label.includes("Billing")) return ReceiptText;
  return CheckCircle2;
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const value = useCountUp(metric.value);
  const Icon = iconForMetric(metric.label);
  const isNegative = metric.trend < 0;
  const TrendIcon = isNegative ? ArrowDown : ArrowUp;
  const displayValue = metric.displayValue
    ? metric.displayValue.replace(formatNumber(metric.value), formatNumber(value))
    : formatNumber(value);

  return (
    <motion.article className={`metric-card ${metric.kind === "billing" ? "metric-card-dark" : ""}`} variants={cardVariants}>
      <div>
        <p>{metric.label}</p>
        <strong>{displayValue}</strong>
        {metric.subLabel ? <small>{metric.subLabel}</small> : null}
      </div>
      <span className="metric-icon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className={`trend ${isNegative ? "trend-down" : "trend-up"}`}>
        <TrendIcon size={13} aria-hidden="true" />
        {Math.abs(metric.trend)}%
      </span>
    </motion.article>
  );
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } }
};

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } }
};

export function DashboardPanels({ dashboard }: { dashboard: DashboardData }) {
  const maxWorkload = useMemo(
    () => Math.max(1, ...dashboard.stageWorkload.map((item) => item.count)),
    [dashboard.stageWorkload]
  );

  return (
    <div className="dashboard-grid">
      <motion.section
        className="metric-grid"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        aria-label="Dashboard metrics"
      >
        {dashboard.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </motion.section>

      <section className="card dashboard-main-card">
        <div className="section-heading">
          <div>
            <h2>Recent Lots</h2>
            <p>Newest updates across the factory floor</p>
          </div>
          <Link className="btn btn-secondary" href="/lots">
            View all
          </Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Lot No</th>
                <th>Dealer</th>
                <th>Material</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentLots.map((lot) => (
                <tr key={lot.id}>
                  <td className="mono">{lot.lotNumber}</td>
                  <td>{lot.dealerName}</td>
                  <td>{lot.materialType}</td>
                  <td>
                    {formatNumber(lot.quantity)} {lot.unit}
                  </td>
                  <td>
                    <StatusBadge status={lot.currentStatus} />
                  </td>
                  <td>{formatDateTime(lot.updatedAt)}</td>
                  <td>
                    <Link className="table-action" href={`/lots/${lot.id}`}>
                      <Eye size={15} aria-hidden="true" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card workload-card">
        <div className="section-heading">
          <div>
            <h2>Stage Workload</h2>
            <p>Live lot count by active stage</p>
          </div>
        </div>
        <div className="workload-bars">
          {dashboard.stageWorkload.map((item, index) => (
            <div className="workload-row" key={item.label}>
              <span>{item.label}</span>
              <div title={`${item.count} lots`}>
                <motion.i
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.count / maxWorkload) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                />
              </div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card compact-card">
        <div className="section-heading">
          <div>
            <h2>Dealer Pending</h2>
            <p>Sorted by outstanding amount</p>
          </div>
          <Link href="/dealers">View all</Link>
        </div>
        <div className="dealer-list">
          {dashboard.dealerPending.map((dealer) => (
            <Link href={`/dealers/${dealer.dealerId}`} key={dealer.dealerId}>
              <span>
                <strong>{dealer.dealerName}</strong>
                <small>{dealer.lotsPending} lots pending</small>
              </span>
              <b>{formatCurrency(dealer.outstandingAmount)}</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="card compact-card">
        <div className="section-heading">
          <div>
            <h2>Alerts</h2>
            <p>Unread system notifications</p>
          </div>
          <Link href="/alerts">History</Link>
        </div>
        <div className="alert-list">
          {dashboard.alerts.map((alert) => (
            <article key={alert.id}>
              <AlertTriangle size={18} aria-hidden="true" />
              <span>
                <strong>{alert.type.replaceAll("_", " ")}</strong>
                <small>{alert.message}</small>
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="card activity-card">
        <div className="section-heading">
          <div>
            <h2>Activity Feed</h2>
            <p>Latest 10 recorded actions</p>
          </div>
        </div>
        <div className="activity-list">
          {dashboard.activity.map((activity) => (
            <article key={activity.id}>
              <span className="activity-dot" />
              <p>
                <strong>{activity.actorName}</strong> {activity.action}
                <small>{formatDateTime(activity.createdAt)}</small>
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
