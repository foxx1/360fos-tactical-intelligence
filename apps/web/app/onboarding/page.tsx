"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", teamName: "", seasonName: "2026-2027" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1") + "/organizations/onboard",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify(form)
      }
    );
    const result = await response.json();
    if (!response.ok) setError(result.message ?? "Unable to create workspace.");
    else router.replace("/");
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="eyebrow">360FOS / SETUP</div>
        <h1>Build your workspace</h1>
        <p>Start with your club, primary team and current season.</p>
        <form onSubmit={submit}>
          <label>Organization / Club</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Al-Hidd Sports Club" />
          <label>Primary Team</label>
          <input required value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })} placeholder="First Team" />
          <label>Season</label>
          <input required value={form.seasonName} onChange={e => setForm({ ...form, seasonName: e.target.value })} />
          <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create workspace"}</button>
        </form>
        {error && <div className="auth-message">{error}</div>}
      </section>
    </main>
  );
}