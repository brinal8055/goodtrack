"use client";

import { LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { loginAction } from "@/app/login/actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next") ?? "";

  useEffect(() => {
    if (error === "invalid") toast.error("Invalid email or password");
  }, [error]);

  return (
    <form action={loginAction} className="login-form">
      <input type="hidden" name="next" value={next} />
      {error === "invalid" ? <div className="login-error">Invalid email or password.</div> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue="admin@textiletrack.test" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue="password123"
        />
      </div>
      <button className="btn btn-primary" type="submit">
        <LogIn size={16} aria-hidden="true" />
        Login
      </button>
    </form>
  );
}
