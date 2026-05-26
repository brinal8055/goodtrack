import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { readStore, writeStore } from "@/lib/data-store";
import { roleHome } from "@/lib/route-access";
import { verifyPassword } from "@/lib/security";
import { SESSION_COOKIE } from "@/lib/session-constants";
import type { Role, User } from "@/lib/types";

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const AUTH_SECRET = process.env.AUTH_SECRET ?? "textiletrack-local-dev-secret";

interface SessionPayload {
  userId: string;
  role: Role;
  exp: number;
}

function base64Url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function base64UrlToText(value: string) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

async function hmacSha256(input: string) {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input)));
}

async function signPayload(payload: SessionPayload) {
  const body = base64Url(JSON.stringify(payload));
  const signature = base64Url(await hmacSha256(body));
  return `${body}.${signature}`;
}

export async function verifySessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedBytes = await hmacSha256(body);
  const signatureBytes = base64UrlToBytes(signature);
  if (!constantTimeEqual(expectedBytes, signatureBytes)) return null;

  const payload = JSON.parse(base64UrlToText(body)) as SessionPayload;
  return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
}

export async function authenticateUser(email: string, password: string) {
  const data = await readStore();
  const user = data.users.find(
    (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.isActive
  );

  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;

  await writeStore((draft) => {
    const storedUser = draft.users.find((candidate) => candidate.id === user.id);
    if (storedUser) storedUser.lastLogin = new Date().toISOString();
  });

  return user;
}

export async function createSession(user: User) {
  const cookieStore = await cookies();
  const token = await signPayload({
    userId: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/"
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const data = await readStore();
  const user = data.users.find((candidate) => candidate.id === session.userId && candidate.isActive);
  return user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRoles(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/forbidden");
  return user;
}

export function homeForRole(role: Role) {
  return roleHome[role];
}
