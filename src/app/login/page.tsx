import { Suspense } from "react";

import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="login-screen">
      <section className="login-card">
        <h1>TextileTrack</h1>
        <p>Production tracking for inward material, processing, dispatch, and billing.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
        <div className="login-help">
          Demo accounts use <strong>password123</strong>. Try admin@textiletrack.test, entry@textiletrack.test,
          godown@textiletrack.test, process@textiletrack.test, or billing@textiletrack.test.
        </div>
      </section>
    </main>
  );
}
