"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Competition = { id: string; name: string };
type Entry = { competition?: Competition; season?: { id: string; name: string } };
type Team = {
  id: string;
  name: string;
  shortName?: string | null;
  country?: string | null;
  clubName?: string | null;
  gender: string;
  category: string;
  active: boolean;
  seasons?: { id: string; name: string }[];
  competitionEntries?: Entry[];
};

function unwrap<T>(json: any): T[] {
  const value = json?.data ?? json;
  return Array.isArray(value) ? value : [];
}

const categories = ["FIRST_TEAM","U23","U21","U20","U19","U18","U17","U16","U15","U14","ACADEMY","OTHER"];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", shortName: "", clubName: "", country: "Bahrain",
    gender: "MEN", category: "FIRST_TEAM", seasonName: "2026/27",
    competitionId: "", competitionName: "", aliases: ""
  });

  async function authFetch(path: string, options?: RequestInit) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Session expired. Please sign in again.");
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    return fetch(base + path, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + session.access_token,
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
        ...(options?.headers || {})
      }
    });
  }

  async function load() {
    try {
      setLoading(true);
      const [teamsRes, competitionsRes] = await Promise.all([
        authFetch("/teams"),
        authFetch("/competitions")
      ]);
      const [teamsJson, competitionsJson] = await Promise.all([teamsRes.json(), competitionsRes.json()]);
      if (!teamsRes.ok || !competitionsRes.ok) throw new Error("Unable to load team master data.");
      setTeams(unwrap<Team>(teamsJson));
      setCompetitions(unwrap<Competition>(competitionsJson));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load team master data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.seasonName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await authFetch("/teams", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          shortName: form.shortName.trim() || undefined,
          clubName: form.clubName.trim() || undefined,
          country: form.country.trim() || undefined,
          gender: form.gender,
          category: form.category,
          seasonName: form.seasonName.trim(),
          competitionId: form.competitionId || undefined,
          competitionName: form.competitionId ? undefined : (form.competitionName.trim() || undefined),
          aliases: form.aliases.split(",").map(x => x.trim()).filter(Boolean)
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Unable to create team.");
      setForm({name:"",shortName:"",clubName:"",country:"Bahrain",gender:"MEN",category:"FIRST_TEAM",seasonName:"2026/27",competitionId:"",competitionName:"",aliases:""});
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="fos-shell">
      <aside className="fos-sidebar">
        <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
        <nav>
          <Link href="/">⌂ <span>Dashboard</span></Link>
          <Link href="/matches">▣ <span>Matches</span></Link>
          <Link href="/opponents">◌ <span>Opponents</span></Link>
          <Link href="/opponent-scouting">◈ <span>Opponent Scouting</span></Link>
          <Link className="active" href="/teams">◉ <span>Teams</span></Link>
          <Link href="/players">♙ <span>Players</span></Link>
          <Link href="/tactical-intelligence">✦ <span>Tactical Intelligence</span></Link>
          <Link href="/training">⚽ <span>Training</span></Link>
          <Link href="/reports">▤ <span>Reports</span></Link>
        </nav>
      </aside>
      <section className="fos-main">
        <div className="page-heading">
          <div>
            <div className="crumb">360FOS / FOOTBALL MASTER DATA / TEAMS</div>
            <h1>Teams</h1>
            <p>Canonical team identity used across matches, scouting, competitions and tactical intelligence.</p>
          </div>
          <button className="primary-action" onClick={() => setShowForm(v => !v)}>＋ Add Team</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showForm && (
          <form className="form-card" onSubmit={submit}>
            <div className="form-section">
              <h3>Register Team</h3>
              <p>Create the team once. 360FOS will reuse the same Team ID everywhere.</p>
            </div>
            <div className="form-grid">
              <label>Team Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Al-Riffa"/></label>
              <label>Short Name<input value={form.shortName} onChange={e=>setForm({...form,shortName:e.target.value})} placeholder="RIF"/></label>
              <label>Club<input value={form.clubName} onChange={e=>setForm({...form,clubName:e.target.value})} placeholder="Al-Riffa Club"/></label>
              <label>Country<input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} placeholder="Bahrain"/></label>
              <label>Gender<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="MEN">Men</option><option value="WOMEN">Women</option><option value="MIXED">Mixed</option></select></label>
              <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(x=><option key={x} value={x}>{x.replace("_"," ")}</option>)}</select></label>
              <label>Season<input required value={form.seasonName} onChange={e=>setForm({...form,seasonName:e.target.value})} placeholder="2026/27"/></label>
              <label>Competition<select value={form.competitionId} onChange={e=>setForm({...form,competitionId:e.target.value,competitionName:""})}><option value="">Create / enter below</option>{competitions.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              {!form.competitionId && <label>New Competition<input value={form.competitionName} onChange={e=>setForm({...form,competitionName:e.target.value})} placeholder="Bahrain Premier League"/></label>}
              <label>Aliases<input value={form.aliases} onChange={e=>setForm({...form,aliases:e.target.value})} placeholder="Al Riffa, Riffa, Al-Riffa FC"/></label>
            </div>
            <div className="form-actions"><button type="button" className="secondary-action" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary-action" disabled={saving}>{saving ? "Saving..." : "Save Team"}</button></div>
          </form>
        )}

        <div className="section-heading"><div><h2>Team Registry</h2><p>{teams.length} canonical team{teams.length === 1 ? "" : "s"} registered.</p></div></div>

        {loading ? <div className="empty-state"><h2>Loading teams…</h2></div> :
          teams.length === 0 ? <div className="empty-state"><div className="empty-icon">◉</div><h2>No teams registered</h2><p>Create your first team and its competition/season identity.</p></div> :
          <div className="card-grid">{teams.map(team => (
            <article className="data-card" key={team.id}>
              <div className="card-kicker">{team.category.replace("_"," ")} · {team.gender}</div>
              <h3>{team.name}</h3>
              <p>{team.clubName || team.shortName || "Team identity"}</p>
              <div className="card-meta"><span>{team.country || "—"}</span><span>{team.active ? "ACTIVE" : "INACTIVE"}</span></div>
              <div className="card-tags">{(team.competitionEntries || []).map((entry, i) => <span className="tag" key={entry.competition?.id + "-" + entry.season?.id + "-" + i}>{entry.competition?.name || "Competition"} · {entry.season?.name || "Season"}</span>)}</div>
              <div className="card-id">TEAM ID · {team.id}</div>
            </article>
          ))}</div>
        }
      </section>
    </main>
  );
}
