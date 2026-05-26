import { NextResponse } from "next/server";

import { readStore } from "@/lib/data-store";
import { buildReport, isReportType, toCsv } from "@/lib/reports";

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isReportType(type)) return new NextResponse("Unknown report", { status: 404 });

  const url = new URL(request.url);
  const data = await readStore();
  const report = buildReport(data, type, {
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined
  });

  return new NextResponse(toCsv(report), {
    headers: {
      "Content-Disposition": `attachment; filename="${type}.csv"`,
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
