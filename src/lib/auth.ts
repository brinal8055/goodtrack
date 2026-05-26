import crypto from "node:crypto";

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

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload: SessionPayload) {
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
}

export async function authenticateUser(email: string, password: string) {
  const data = await readStore();
  const user = data.users.find(
    (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.isActive
  );

  if (!user || !verifyPassword(password, user.passwordHash)) return null;

  await writeStore((draft) => {
    const storedUser = draft.users.find((candidate) => candidate.id === user.id);
    if (storedUser) storedUser.lastLogin = new Date().toISOString();
  });

  return user;
}

export async function createSession(user: User) {
  const cookieStore = await cookies();
  const token = signPayload({
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
