import Link from "next/link";

import { PageTransition } from "@/components/page-transition";

export default function ForbiddenPage() {
  return (
    <main className="page-content">
      <PageTransition>
        <section className="card">
          <h1>Access blocked</h1>
          <p>Your current role does not have permission to open this screen.</p>
          <Link className="btn btn-primary" href="/">
            Return home
          </Link>
        </section>
      </PageTransition>
    </main>
  );
}
