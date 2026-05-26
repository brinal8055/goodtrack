"use server";

import { redirect } from "next/navigation";

import { authenticateUser, createSession, homeForRole } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const user = await authenticateUser(email, password);

  if (!user) {
    redirect(`/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  await createSession(user);
  redirect(next && next.startsWith("/") ? next : homeForRole(user.role));
}
