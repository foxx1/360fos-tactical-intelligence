"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ProfessionalReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
      const res = await fetch(base + "/matches/" + params.id + "/report", {
        headers: { Authorization: "Bearer " + session.access_token },
      });
      const json = await res.json().catch(() => null);
      setReport(json?.data ?? json);
      setLoading(false);
    })();
  }, [params.id, router]);

  if (loading) return <main className="fos-shell"><section className="fos-main"><div className="empty-state">Generating professional report...</div></section></main>;
  if (!report) return <main className="fos-shell"><section className="fos-main"><div className="empty-state">Report unavailable.</div></section></main>;

  const tactical = report.tacticalPicture ?? {};
  const learning = report.learningLoop?.summary ?? {};

  return (
    <main className="fos-shell">
      <aside className="fos-sidebar">
        <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
        <nav>
          <Link href="/">⌂ <span>Dashboard</span></Link>
          <Link className="active" href="/matches">▣ <span>Matches</span></Link>
          <Link href="/opponents">◌ <span>Opponents</span></Link>
          <Link href="/training">⚽ <span>Training</span></Link>
          <Link className="active" href="/reports">▤ <span>Reports</span></Link>
        </nav>
      </aside>

      <section className="fos-main">
        <div className="breadcrumb-row"><Link href="/matches">Matches</Link><span>›</span><Link href={"/matches/" + params.id}>Workspace</Link><span>›</span><b>Professional Report</b></div>

        <section className="page-heading">
          <div>
            <div className="crumb">360FOS / PROFESSIONAL REPORT V1</div>
            <h1>{report.headline}</h1>
            <p>{report.match?.team?.name} vs {report.match?.opponent?.name} · {report.match?.date ? new Date(report.match.date).toLocaleDateString() : "Date pending"}</p>
          </div>
          <div className="heading-actions">
            <button className="primary-action" onClick={() => window.print()}>Print / Export PDF</button>
            <Link className="secondary-action" href={"/matches/" + params.id}>Workspace</Link>
          </div>
        </section>

        <section className="training-cards">
          {[
            ["EVIDENCE", report.executiveSummary?.evidenceItems ?? 0],
            ["TACTICAL GAPS", report.executiveSummary?.tacticalGaps ?? 0],
            ["TRAINING SESSIONS", report.executiveSummary?.trainingSessions ?? 0],
            ["TRANSFERRED", learning.transferred ?? 0],
          ].map(([label,value]) => <article className="workspace-card training-card" key={String(label)}><span className="section-kicker">{label}</span><h2>{value}</h2></article>)}
        </section>

        <section className="workspace-card">
          <div className="section-kicker">01 / EXECUTIVE SUMMARY</div>
          <h2>Technical overview</h2>
          <div className="report-grid">
            <div><strong>Team</strong><p>{report.match?.team?.name}</p></div>
            <div><strong>Opponent</strong><p>{report.match?.opponent?.name}</p></div>
            <div><strong>Competition</strong><p>{report.match?.competition?.name ?? "—"}</p></div>
            <div><strong>Score</strong><p>{report.match?.score ?? "Not available"}</p></div>
          </div>
        </section>

        <section className="training-cards">
          <article className="workspace-card training-card">
            <div className="section-kicker">02 / OUR TEAM</div><h2>Strengths</h2>
            {(tactical.ourStrengths ?? []).map((x:any) => <div className="match-card-bottom" key={x.id}><strong>{x.behaviour}</strong><span>{x.phase} · score {x.score}</span></div>)}
            {!tactical.ourStrengths?.length && <p>No validated strengths in the current evidence set.</p>}
          </article>
          <article className="workspace-card training-card">
            <div className="section-kicker">OUR TEAM</div><h2>Weaknesses</h2>
            {(tactical.ourWeaknesses ?? []).map((x:any) => <div className="match-card-bottom" key={x.id}><strong>{x.behaviour}</strong><span>{x.phase} · score {x.score}</span></div>)}
            {!tactical.ourWeaknesses?.length && <p>No validated weaknesses in the current evidence set.</p>}
          </article>
        </section>

        <section className="training-cards">
          <article className="workspace-card training-card">
            <div className="section-kicker">03 / OPPONENT</div><h2>Strengths</h2>
            {(tactical.opponentStrengths ?? []).map((x:any) => <div className="match-card-bottom" key={x.id}><strong>{x.behaviour}</strong><span>{x.phase} · score {x.score}</span></div>)}
          </article>
          <article className="workspace-card training-card">
            <div className="section-kicker">OPPONENT</div><h2>Weaknesses</h2>
            {(tactical.opponentWeaknesses ?? []).map((x:any) => <div className="match-card-bottom" key={x.id}><strong>{x.behaviour}</strong><span>{x.phase} · score {x.score}</span></div>)}
          </article>
        </section>

        <section className="workspace-card">
          <div className="section-kicker">04 / TACTICAL DECISION</div><h2>Opportunities & threats</h2>
          {[...(tactical.opportunities ?? []), ...(tactical.threats ?? [])].slice(0,8).map((x:any,i:number) =>
            <div className="match-card-bottom" key={x.id ?? i}><strong>{x.interaction}</strong><span>{x.type} · {x.priority ?? "—"}</span></div>
          )}
        </section>

        <section className="workspace-card">
          <div className="section-kicker">05 / TRAINING RESPONSE</div><h2>Training plan</h2>
          {(report.training?.sessions ?? []).map((x:any) =>
            <div className="match-card-bottom" key={x.id}><strong>{x.title}</strong><span>{x.status} · {x.objective}</span></div>
          )}
          {!report.training?.sessions?.length && <p>No training sessions recorded for this match.</p>}
        </section>

        <section className="workspace-card">
          <div className="section-kicker">06 / BEHAVIOUR TRANSFER</div>
          <h2>Training → Match</h2>
          <p>{learning.transferred ?? 0} transferred · {learning.partial ?? 0} partial · {learning.notTransferred ?? 0} not transferred · {learning.insufficientEvidence ?? 0} insufficient evidence.</p>
          {(report.learningLoop?.results ?? []).map((x:any) =>
            <div className="match-card-bottom" key={x.sessionId + x.behaviour}><strong>{x.behaviour}</strong><span>{x.status} · {x.evidenceCount} evidence · {x.matchSuccessRate == null ? "—" : x.matchSuccessRate + "%"}</span></div>
          )}
        </section>

        <section className="workspace-card">
          <div className="section-kicker">07 / COACHING RECOMMENDATIONS</div>
          <h2>Next decisions</h2>
          {(report.coachingRecommendations ?? []).map((x:any,i:number) =>
            <div className="match-card-bottom" key={i}><strong>{x.priority}</strong><span>{x.action}{x.kpi ? " · KPI: " + x.kpi : ""}</span></div>
          )}
        </section>

        <footer className="report-footer">360FOS Tactical Intelligence · Professional Reporting v1 · Generated {new Date(report.generatedAt).toLocaleString()}</footer>
      </section>
    </main>
  );
}
