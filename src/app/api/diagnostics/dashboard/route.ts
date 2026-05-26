import { getCurrentUser } from "@/lib/auth";
import { buildDashboard } from "@/lib/dashboard";
import { readStore } from "@/lib/data-store";

export async function GET() {
  const checks: string[] = [];

  try {
    checks.push("route");
    checks.push(`crypto:${Boolean(globalThis.crypto?.subtle)}`);

    checks.push("user:start");
    const user = await getCurrentUser();
    checks.push(`user:${user?.role ?? "none"}`);

    checks.push("store:start");
    const data = await readStore();
    checks.push(`store:${data.users.length}/${data.lots.length}`);

    checks.push("dashboard:start");
    const dashboard = buildDashboard(data);
    checks.push(`dashboard:${dashboard.metrics.length}/${dashboard.recentLots.length}`);

    return Response.json({ ok: true, checks });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        checks,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
      },
      { status: 500 }
    );
  }
}
