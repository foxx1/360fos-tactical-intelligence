"use client";

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="fos-error-page">
          <section className="fos-error-card">
            <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
            <div className="section-kicker">360FOS</div>
            <h1>360FOS needs to reload.</h1>
            <p>
              An unexpected application error occurred. Reload the application and try again.
            </p>
            <div className="error-actions">
              <button className="primary-action" onClick={() => reset()}>Reload application</button>
              <a className="secondary-action" href="/">Back to Dashboard</a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
