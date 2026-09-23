"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/auth/callback" }
    });
    setMessage(error ? error.message : "Check your email for the sign-in link.");
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="eyebrow">360FOS</div>
        <h1>Tactical Intelligence</h1>
        <p>Sign in to prepare, train and validate your next match.</p>
        <form onSubmit={submit}>
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" required value={email}
            onChange={(event) => setEmail(event.target.value)} placeholder="coach@club.com" />
          <button type="submit" disabled={loading}>{loading ? "Sending..." : "Send magic link"}</button>
        </form>
        {message && <div className="auth-message">{message}</div>}
      </section>
    </main>
  );
}