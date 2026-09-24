"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Workspace = {
  name: string;
  teams: { id: string; name: string; seasons: { id: string; name: string }[] }[];
  opponents: { id: string; name: string }[];
};

export default function HomePage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      setEmail(session.user.email ?? "");

      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1") + "/organizations/me",
        { headers: { Authorization: "Bearer " + session.access_token } }
      );
      const result = await response.json();
      if (!result.data) router.replace("/onboarding");
      else setWorkspace(result.data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  if (loading) return <main className="app-shell"><p>Loading Tactical Intelligence...</p></main>;
  if (!workspace) return null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><div className="eyebrow">360FOS</div><h1>Tactical Intelligence</h1></div>
        <div className="topbar-actions"><span>{email}</span><button className="ghost-button" onClick={signOut}>Sign out</button></div>
      </header>
      <section className="hero">
        <span className="status">WORKSPACE READY</span>
        <h2>{workspace.name}</h2>
        <p>Prepare matches by connecting our team intelligence, opponent intelligence, tactical gaps and training priorities.</p>
      </section>
      <div style={{marginTop:24}}><a className="primary-action" href="/matches">Open Match Workspace →</a></div><section className="dashboard-grid">
        <article><span>TEAM</span><h3>{workspace.teams[0]?.name ?? "No team"}</h3><p>{workspace.teams[0]?.seasons.length ?? 0} season(s) configured.</p></article>
        <article><span>OPPONENTS</span><h3>{workspace.opponents.length}</h3><p>Opponent profiles available for match preparation.</p></article>
        <article><span>INTELLIGENCE</span><h3>Our Team + Opponent</h3><p>Build evidence-based strengths, weaknesses and tactical gaps.</p></article>
        <article><span>TRAINING</span><h3>Decision Loop</h3><p>Convert tactical diagnosis into training objectives and match behaviours.</p></article>
      </section>
    </main>
  );
}