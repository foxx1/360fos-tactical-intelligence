"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("360FOS application error", error);
  }, [error]);

  return (
    <main className="fos-error-page">
      <section className="fos-error-card">
        <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
        <div className="section-kicker">APPLICATION ERROR</div>
        <h1>Something went wrong.</h1>
        <p>
          360FOS could not complete this page. Your data has not been intentionally changed.
          Try the page again, and return to the dashboard if the problem continues.
        </p>
        <div className="error-actions">
          <button className="primary-action" onClick={() => reset()}>Try again</button>
          <a className="secondary-action" href="/">Back to Dashboard</a>
        </div>
      </section>
    </main>
  );
}
