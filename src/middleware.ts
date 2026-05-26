import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { allowedRolesForPath } from "@/lib/route-access";
import { SESSION_COOKIE } from "@/lib/session-constants";
import type { Role } from "@/lib/types";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "textiletrack-local-dev-secret";

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function verifyEdgeSession(token?: string): Promise<{ role: Role; exp: number } | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expectedBytes = new Uint8Array(expected);
  const signatureBytes = base64UrlToBytes(signature);

  if (expectedBytes.length !== signatureBytes.length) return null;
  const matches = expectedBytes.every((byte, index) => byte === signatureBytes[index]);
  if (!matches) return null;

  const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as { role: Role; exp: number };
  return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
}

function forbiddenResponse() {
  return new NextResponse(
    "<!doctype html><title>403 Forbidden</title><main style='font-family:system-ui;padding:48px'><h1>403 Forbidden</h1><p>Your role does not have access to this TextileTrack screen.</p></main>",
    {
      status: 403,
      headers: { "content-type": "text/html; charset=utf-8" }
    }
  );
}

export async function middleware(request: NextRequest) {
  const allowedRoles = allowedRolesForPath(request.nextUrl.pathname);
  if (!allowedRoles) return NextResponse.next();

  const session = await verifyEdgeSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!allowedRoles.includes(session.role)) return forbiddenResponse();
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/lots/:path*",
    "/godown/:path*",
    "/process-queue/:path*",
    "/billing/:path*",
    "/dealers/:path*",
    "/templates/:path*",
    "/reports/:path*",
    "/alerts/:path*",
    "/users/:path*",
    "/settings/:path*"
  ]
};
