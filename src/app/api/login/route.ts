import { NextRequest, NextResponse } from "next/server";

import { authenticateUser, createSessionToken, homeForRole, sessionCookieOptions } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session-constants";

function safeNextPath(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

function redirectUrl(request: NextRequest, path: string) {
  return new URL(path, request.nextUrl.origin);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const user = await authenticateUser(email, password);

  if (!user) {
    const loginUrl = redirectUrl(request, "/login");
    loginUrl.searchParams.set("error", "invalid");
    if (next) loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(redirectUrl(request, next || homeForRole(user.role)), 303);
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
  return response;
}
