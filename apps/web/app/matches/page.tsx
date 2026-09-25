"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id: string; matchDate: string; venue?: string | null; isHome: boolean;
  status: string; formation?: string | null; ourScore?: number | null; opponentScore?: number | null;
  team: { name: string }; opponent: { name: string }; competition?: { name: string } | null;
};

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1") + "/matches", {
        headers: { Authorization: "Bearer " + session.access_token }
      });
      if (response.ok) {
        const result: unknown = await response.json().catch(() => null);
        const data =
          result && typeof result === "object" && "data" in result
            ? (result as { data?: unknown }).data
            : null;

        if (Array.isArray(data)) {
          setMatches(data as Match[]);
        } else {
          setMatches([]);
        }
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
          <Link className="active" href="/matches">▣ <span>Matches</span></Link>
          <Link href="/">◌ <span>Opponents</span></Link>
          <Link href="/">◉ <span>Teams</span></Link>
          <Link href="/">♙ <span>Players</span></Link>
          <Link href="/">✦ <span>Tactical Intelligence</span></Link>
          <Link href="/">⚽ <span>Training</span></Link>
          <Link href="/">▤ <span>Reports</span></Link>
        </nav>
        <div className="sidebar-footer">360FOS<br/><small>Football Intelligence for a Better Tomorrow</small></div>
      </aside>

      <section className="fos-main">
        <header className="fos-topbar">
          <input className="fos-search" placeholder="Search matches, opponents, players, insights..." />
          <div className="fos-user">360FOS Workspace <span>•</span> Admin</div>
        </header>

        <div className="page-heading">
          <div><div className="crumb">360FOS / MATCHES</div><h1>Matches</h1><p>Build the evidence base for every tactical decision.</p></div>
          <Link className="primary-action" href="/matches/new">+ Create Match</Link>
        </div>

        {loading ? <div className="empty-state">Loading matches...</div> : matches.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">▣</div><h2>No matches yet</h2><p>Create your first match to open the Tactical Intelligence workspace.</p><Link className="primary-action" href="/matches/new">Create first match</Link></div>
        ) : (
          <div className="match-grid">
            {matches.map(match => (
              <Link className="match-card" href={"/matches/" + match.id} key={match.id}>
                <div className="match-card-top"><span className={"pill " + match.status.toLowerCase()}>{match.status}</span><span>{new Date(match.matchDate).toLocaleDateString()}</span></div>
                <div className="teams-row"><strong>{match.team.name}</strong><span>vs</span><strong>{match.opponent.name}</strong></div>
                <div className="match-meta">{match.competition?.name ?? "Competition"} · {match.isHome ? "Home" : "Away"} {match.venue ? "· " + match.venue : ""}</div>
                <div className="match-card-bottom"><span>{match.formation ?? "Formation not set"}</span><b>{match.ourScore ?? "—"} : {match.opponentScore ?? "—"}</b></div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
