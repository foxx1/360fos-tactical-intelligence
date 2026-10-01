"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id: string; matchDate: string; status: string; isHome: boolean;
  team: { name: string }; opponent: { name: string }; competition?: { name: string } | null;
};

export default function OpponentScoutingHubPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1") + "/matches", {
        headers: { Authorization: "Bearer " + session.access_token }
      });
      if (response.ok) {
        const json = await response.json().catch(() => null);
        setMatches(Array.isArray(json?.data) ? json.data : []);
      }
      setLoading(false);
    })();
  }, [router]);

  return (
    <main className="fos-shell">
      <aside className="fos-sidebar">
        <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
        <nav>
          <Link href="/">⌂ <span>Dashboard</span></Link>
          <Link href="/matches">▣ <span>Matches</span></Link>
          <Link href="/opponents">◌ <span>Opponents</span></Link>
          <Link className="active" href="/opponent-scouting">◈ <span>Opponent Scouting</span></Link>
          <Link href="/teams">◉ <span>Teams</span></Link>
          <Link href="/players">♙ <span>Players</span></Link>
          <Link href="/tactical-intelligence">✦ <span>Tactical Intelligence</span></Link>
          <Link href="/training">⚽ <span>Training</span></Link>
          <Link href="/reports">▤ <span>Reports</span></Link>
        </nav>
        <div className="sidebar-footer">360FOS<br/><small>Football Intelligence for a Better Tomorrow</small></div>
      </aside>
      <section className="fos-main">
        <header className="fos-topbar"><div className="fos-search fake-search">⌕ Search matches, opponents, players, insights...</div><div className="fos-user">360FOS Workspace <span>•</span> Opponent Intelligence</div></header>
        <div className="page-heading">
          <div><div className="crumb">360FOS / OPPONENT SCOUTING</div><h1>Opponent Scouting</h1><p>Select an upcoming match to open its dedicated Opponent Scouting Workspace.</p></div>
          <Link className="secondary-action" href="/matches">View Matches</Link>
        </div>
        <section className="workspace-card"><div className="section-kicker">PRE-MATCH INTELLIGENCE</div><h2>Choose the upcoming match</h2><p>Each match has its own scouting workspace. Review up to five previous opponent matches, capture evidence match by match, and build the recurring tactical model.</p></section>
        {loading ? <div className="empty-state">Loading upcoming matches...</div> : matches.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">◈</div><h2>No matches available</h2><p>Create an upcoming match first, then return here to start opponent scouting.</p><Link className="primary-action" href="/matches/new">Create Match</Link></div>
        ) : (
          <div className="match-grid">{matches.map(match => (
            <article className="match-card" key={match.id}>
              <div className="match-card-top"><span className={"pill " + match.status.toLowerCase()}>{match.status}</span><span>{new Date(match.matchDate).toLocaleDateString()}</span></div>
              <div className="teams-row"><strong>{match.team.name}</strong><span>vs</span><strong>{match.opponent.name}</strong></div>
              <div className="match-meta">{match.competition?.name ?? "Competition"} · {match.isHome ? "Home" : "Away"}</div>
              <div className="match-card-bottom"><span>Opponent: {match.opponent.name}</span><Link className="primary-action" href={"/matches/" + match.id + "/opponent"}>Scout Opponent →</Link></div>
            </article>
          ))}</div>
        )}
      </section>
    </main>
  );
}
