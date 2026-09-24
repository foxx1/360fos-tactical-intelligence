"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id: string; matchDate: string; venue?: string | null; isHome: boolean; status: string; formation?: string | null;
  ourScore?: number | null; opponentScore?: number | null;
  team: { name: string }; opponent: { name: string }; season?: { name: string } | null; competition?: { name: string } | null;
  _count: { analyses: number; evidence: number; gaps: number; priorities: number };
};

const tabs = [
  ["Overview", "overview"], ["Our Team", "our-team"], ["Opponent", "opponent"], ["Evidence", "evidence"],
  ["Strengths & Weaknesses", "sw"], ["Intelligence Matrix", "matrix"], ["Training Priorities", "training"], ["Match Plan", "plan"]
];

export default function MatchWorkspacePage() {
  const router = useRouter(); const params = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null); const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient(); const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
      const res = await fetch(base + "/matches/" + params.id, { headers: { Authorization: "Bearer " + session.access_token } });
      if (res.ok) { const json = await res.json(); setMatch(json.data); } else router.replace("/matches");
      setLoading(false);
    })();
  }, [params.id, router]);

  if (loading) return <main className="fos-loading">Loading Match Workspace...</main>;
  if (!match) return null;

  return (
    <main className="fos-shell">
      <aside className="fos-sidebar"><div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div><nav><Link href="/">⌂ <span>Dashboard</span></Link><Link className="active" href="/matches">▣ <span>Matches</span></Link><Link href="/">◌ <span>Opponents</span></Link><Link href="/">⚽ <span>Training</span></Link><Link href="/">▤ <span>Reports</span></Link></nav><div className="sidebar-footer">360FOS<br/><small>Turn Analysis into Performance</small></div></aside>
      <section className="fos-main">
        <header className="fos-topbar"><div className="fos-search fake-search">⌕ Search matches, opponents, players, insights...</div><div className="fos-user">{match.team.name} <span>•</span> Tactical Workspace</div></header>
        <div className="breadcrumb-row"><Link href="/matches">Matches</Link><span>›</span><span>{match.team.name} vs {match.opponent.name}</span><span>›</span><b>Workspace</b></div>
        <section className="match-hero">
          <div className="team-mark">{match.team.name.slice(0,1)}</div><div><h1>{match.team.name} <em>vs</em> {match.opponent.name}</h1><p>{match.competition?.name ?? "Competition"} · {match.season?.name ?? "Season"} · {new Date(match.matchDate).toLocaleDateString()} · {match.venue ?? "Venue not set"}</p></div>
          <div className="score-block"><span className="pill green">{match.status}</span><strong>{match.ourScore ?? "—"} : {match.opponentScore ?? "—"}</strong><small>{match.formation ?? "Formation not set"} · {match.isHome ? "Home" : "Away"}</small></div>
        </section>
        <div className="workspace-tabs">{tabs.map(([label,key],i)=>{
          if (key==="evidence") return <Link className="workspace-tab-link" href={"/matches/"+params.id+"/evidence"} key={key}>{label}</Link>;
          if (key==="matrix") return <Link className="workspace-tab-link" href={"/matches/"+params.id+"/intelligence"} key={key}>{label}</Link>;
          return <button className={i===0?"active":""} key={key}>{label}</button>;
        })}</div>

        <section className="metric-grid">
          <Metric label="Evidence" value={match._count.evidence} sub="Tagged match moments" icon="◈"/>
          <Metric label="Analysis Findings" value={match._count.analyses} sub="Our team + opponent" icon="✦"/>
          <Metric label="Tactical Gaps" value={match._count.gaps} sub="Open interactions" icon="⚠"/>
          <Metric label="Training Priorities" value={match._count.priorities} sub="Ready for planning" icon="⚽"/>
        </section>

        <section className="workspace-grid">
          <article className="workspace-card large"><div className="card-title"><div><span className="section-kicker">TACTICAL INTELLIGENCE</span><h2>Decision Loop</h2></div><span className="ai-badge">AI READY</span></div><div className="decision-flow"><div><b>01</b><strong>Observe</strong><span>Capture evidence from match video.</span></div><i>→</i><div><b>02</b><strong>Diagnose</strong><span>Convert evidence into strengths, weaknesses and gaps.</span></div><i>→</i><div><b>03</b><strong>Train</strong><span>Translate priorities into exercises and KPIs.</span></div><i>→</i><div><b>04</b><strong>Plan</strong><span>Turn training outcomes into match behaviours.</span></div></div></article>
          <article className="workspace-card"><div className="section-kicker">MATCH READINESS</div><h2>Workspace Status</h2><div className="readiness"><span><b>Evidence base</b><em>{match._count.evidence ? "Started" : "Not started"}</em></span><span><b>Diagnosis</b><em>{match._count.analyses ? "Started" : "Not started"}</em></span><span><b>Training</b><em>{match._count.priorities ? "Ready" : "Pending"}</em></span><span><b>Match plan</b><em>Pending</em></span></div></article>
        </section>

        <section className="workspace-card next-actions"><div className="card-title"><div><span className="section-kicker">NEXT ACTIONS</span><h2>Build the intelligence</h2></div></div><div className="action-grid">
          <Link className="next-action" href={"/matches/"+params.id+"/evidence"}><span>◈</span><div><b>Add Evidence</b><small>Tag key moments from video</small></div><i>→</i></Link>
          <Link className="next-action" href={"/matches/"+params.id+"/evidence"}><span>◆</span><div><b>Analyse Our Team</b><small>Record repeatable behaviours</small></div><i>→</i></Link>
          <Link className="next-action" href={"/matches/"+params.id+"/evidence"}><span>◌</span><div><b>Scout Opponent</b><small>Capture strengths and weaknesses</small></div><i>→</i></Link>
          <Link className="next-action" href={"/matches/"+params.id+"/intelligence"}><span>⚠</span><div><b>Intelligence Matrix</b><small>Connect the two analyses</small></div><i>→</i></Link>
          <Link className="next-action" href={"/matches/"+params.id+"/intelligence"}><span>⚽</span><div><b>Coach Review</b><small>Convert diagnosis into practice</small></div><i>→</i></Link>
        </div></section>
      </section>
    </main>
  );
}

function Metric({label,value,sub,icon}:{label:string,value:number,sub:string,icon:string}){return <article className="metric-card"><span className="metric-icon">{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></article>}
