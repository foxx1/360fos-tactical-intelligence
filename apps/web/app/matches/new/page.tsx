"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Team = { id: string; name: string; seasons: { id: string; name: string }[] };
type Opponent = { id: string; name: string };
type Competition = { id: string; name: string };

export default function NewMatchPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [form, setForm] = useState({ teamId: "", seasonId: "", opponentId: "", competitionId: "", matchDate: "", venue: "", isHome: true, formation: "4-2-3-1" });
  const [newCompetition, setNewCompetition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const headers = { Authorization: "Bearer " + session.access_token };
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
      const [teamRes, oppRes, compRes] = await Promise.all([
        fetch(base + "/teams", { headers }),
        fetch(base + "/opponents", { headers }),
        fetch(base + "/competitions", { headers }),
      ]);
      const [teamJson, oppJson, compJson] = await Promise.all([teamRes.json(), oppRes.json(), compRes.json()]);
      setTeams(teamJson.data ?? []); setOpponents(oppJson.data ?? []); setCompetitions(compJson.data ?? []);
      if (teamJson.data?.[0]) setForm(f => ({ ...f, teamId: teamJson.data[0].id, seasonId: teamJson.data[0].seasons?.[0]?.id ?? "" }));
    })();
  }, [router]);

  const selectedTeam = teams.find(t => t.id === form.teamId);

  async function addCompetition() {
    if (!newCompetition.trim()) return;
    const supabase = createClient(); const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const res = await fetch(base + "/competitions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token }, body: JSON.stringify({ name: newCompetition.trim() }) });
    const json = await res.json();
    if (res.ok) { setCompetitions(c => [...c.filter(x => x.id !== json.data.id), json.data]); setForm(f => ({ ...f, competitionId: json.data.id })); setNewCompetition(""); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const supabase = createClient(); const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const res = await fetch(base + "/matches", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token }, body: JSON.stringify({ ...form, seasonId: form.seasonId || undefined, competitionId: form.competitionId || undefined }) });
    const json = await res.json();
    if (!res.ok) setError(json.message ?? "Unable to create match.");
    else router.replace("/matches/" + json.data.id);
    setLoading(false);
  }

  return (
    <main className="fos-shell">
      <aside className="fos-sidebar"><div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div><nav><Link href="/">⌂ <span>Dashboard</span></Link><Link className="active" href="/matches">▣ <span>Matches</span></Link><Link href="/">◌ <span>Opponents</span></Link><Link href="/">⚽ <span>Training</span></Link></nav></aside>
      <section className="fos-main">
        <div className="crumb">MATCHES / NEW</div>
        <div className="page-heading"><div><h1>Create Match</h1><p>Set the match context before collecting tactical evidence.</p></div><Link className="secondary-action" href="/matches">Back</Link></div>
        <form className="form-card" onSubmit={submit}>
          <div className="form-section"><h3>Match Context</h3><p>Every analysis item will inherit this context.</p></div>
          <div className="form-grid">
            <label>Our Team<select required value={form.teamId} onChange={e => { const t=teams.find(x=>x.id===e.target.value); setForm({...form, teamId:e.target.value, seasonId:t?.seasons?.[0]?.id ?? ""}); }}>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <label>Opponent<select required value={form.opponentId} onChange={e=>setForm({...form,opponentId:e.target.value})}><option value="">Select opponent</option>{opponents.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
            <label>Season<select value={form.seasonId} onChange={e=>setForm({...form,seasonId:e.target.value})}><option value="">Select season</option>{selectedTeam?.seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>Competition<div className="inline-control"><select value={form.competitionId} onChange={e=>setForm({...form,competitionId:e.target.value})}><option value="">Select competition</option>{competitions.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" className="icon-action" onClick={addCompetition}>+</button></div></label>
            <label>Match Date<input required type="datetime-local" value={form.matchDate} onChange={e=>setForm({...form,matchDate:e.target.value})}/></label>
            <label>Venue<input value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} placeholder="Khalifa Sports City Stadium"/></label>
            <label>Home / Away<select value={form.isHome ? "home" : "away"} onChange={e=>setForm({...form,isHome:e.target.value==="home"})}><option value="home">Home</option><option value="away">Away</option></select></label>
            <label>Our Formation<input value={form.formation} onChange={e=>setForm({...form,formation:e.target.value})} placeholder="4-2-3-1"/></label>
          </div>
          {error && <div className="error-box">{error}</div>}
          <div className="form-actions"><Link className="secondary-action" href="/matches">Cancel</Link><button className="primary-action" disabled={loading}>{loading ? "Creating..." : "Create Match Workspace →"}</button></div>
        </form>
      </section>
    </main>
  );
}
