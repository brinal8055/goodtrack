"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button className="btn btn-secondary" onClick={() => window.print()} type="button">
      <Printer size={16} aria-hidden="true" />
      {label}
    </button>
  );
}
