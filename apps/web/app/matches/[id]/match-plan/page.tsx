"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Plan = {
  modelVersion: string;
  status: string;
  inputs: any;
  matchPriorities: any[];
  opportunities: any[];
  threats: any[];
  keyBattles: any[];
  pressingTargets: any[];
  buildUpTargets: any[];
  defensivePriorities: any[];
  principles: { withBall: string; withoutBall: string; transition: string };
  decisionRules: string[];
};

export default function MatchPlanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
      try {
        const response = await fetch(base + "/matches/" + params.id + "/match-plan", {
          headers: { Authorization: "Bearer " + session.access_token },
        });
        const json = await response.json().catch(() => null);
        if (!response.ok) throw new Error(json?.error?.message || "Unable to build match plan.");
        setPlan(json?.data || null);
      } catch (e: any) {
        setError(e.message || "Unable to build match plan.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, router]);

  const phase = (value?: string | null) => (value || "TACTICAL").replaceAll("_", " ");
  const readiness = plan?.status || "LIMITED";

  return (
    <main className="fos-shell">
      <aside className="fos-sidebar">
        <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
        <nav>
          <Link href="/">⌂ <span>Dashboard</span></Link>
          <Link className="active" href="/matches">▣ <span>Matches</span></Link>
          <Link href="/opponents">◌ <span>Opponents</span></Link>
          <Link href="/opponent-scouting">◈ <span>Opponent Scouting</span></Link>
          <Link href="/training">⚽ <span>Training</span></Link>
          <Link href="/reports">▤ <span>Reports</span></Link>
        </nav>
      </aside>

      <section className="fos-main">
        <div className="breadcrumb-row">
          <Link href="/matches">Matches</Link><span>›</span>
          <Link href={"/matches/" + params.id}>Workspace</Link><span>›</span><b>Match Plan</b>
        </div>

        <section className="page-heading">
          <div>
            <div className="crumb">MATCH PLAN / DECISION ENGINE</div>
            <h1>Match Plan</h1>
            <p>Convert Our Team Intelligence and Opponent Intelligence into an evidence-led tactical plan.</p>
          </div>
          <div className="heading-actions">
            <span className="pill green">{readiness}</span>
            <Link className="secondary-action" href={"/matches/" + params.id + "/intelligence"}>Intelligence Matrix</Link>
          </div>
        </section>

        {error && <div className="error-box">{error}</div>}
        {loading && <div className="empty-state">Building Match Plan Engine v1...</div>}

        {plan && (
          <>
            <section className="metric-grid">
              <Metric label="Plan status" value={plan.status} sub="Decision readiness" />
              <Metric label="Our strengths" value={plan.inputs.ourTeam.strengths} sub="Documented findings" />
              <Metric label="Opponent sample" value={plan.inputs.opponent.matchesAnalyzed + "/5"} sub={plan.inputs.opponent.quality + " sample"} />
              <Metric label="Opponent confidence" value={plan.inputs.opponent.confidence + "%"} sub={plan.inputs.opponent.evidence + " evidence items"} />
            </section>

            <section className="workspace-card">
              <div className="card-title">
                <div><span className="section-kicker">MATCH PRIORITIES</span><h2>What must decide the match</h2></div>
                <span className="ai-badge">RULE-BASED V1</span>
              </div>
              {!plan.matchPriorities.length ? <div className="empty-state"><p>There is not enough structured evidence to generate match priorities yet.</p></div> :
                <div className="training-cards">{plan.matchPriorities.map((item) =>
                  <article className="workspace-card" key={item.rank + item.title}>
                    <div className="section-kicker">PRIORITY {item.rank} · {item.category}</div>
                    <h2>{item.title}</h2>
                    <div className="training-grid">
                      <Field label="Priority" value={item.priority} />
                      <Field label="Phase" value={phase(item.phase)} />
                      <Field label="Decision score" value={String(item.score)} />
                    </div>
                    <p><strong>Why:</strong> {item.why}</p>
                    <p><strong>Action:</strong> {item.action}</p>
                  </article>
                )}</div>
              }
            </section>

            <section className="training-cards">
              <article className="workspace-card">
                <div className="section-kicker">WITH THE BALL</div>
                <h2>Build-up & attacking principle</h2>
                <p>{plan.principles.withBall}</p>
                {plan.buildUpTargets.length ? plan.buildUpTargets.map((x) =>
                  <div className="training-field" key={x.target + x.ourBehaviour}><span>{x.target}</span><p>{x.ourBehaviour} · {x.coachingAction}</p></div>
                ) : <div className="empty-state">No specific build-up target meets the current evidence threshold.</div>}
              </article>

              <article className="workspace-card">
                <div className="section-kicker">WITHOUT THE BALL</div>
                <h2>Pressing & defensive principle</h2>
                <p>{plan.principles.withoutBall}</p>
                {plan.pressingTargets.length ? plan.pressingTargets.map((x) =>
                  <div className="training-field" key={x.target}><span>{x.target}</span><p>{phase(x.phase)} · {x.coachingAction}</p></div>
                ) : <div className="empty-state">No pressing target meets the current evidence threshold.</div>}
              </article>
            </section>

            <section className="workspace-card">
              <div className="section-kicker">KEY BATTLES</div>
              <h2>Decisive tactical interactions</h2>
              <div className="training-cards">
                {plan.keyBattles.map((x) =>
                  <article className="workspace-card" key={x.battle}>
                    <div className="section-kicker">{x.type} · {phase(x.phase)}</div>
                    <h2>{x.battle}</h2>
                    <div className="training-grid">
                      <Field label="Our behaviour" value={x.ourBehaviour} />
                      <Field label="Opponent behaviour" value={x.opponentBehaviour} />
                    </div>
                    <p><strong>Decisive action:</strong> {x.decisiveAction}</p>
                  </article>
                )}
              </div>
            </section>

            <section className="training-cards">
              <article className="workspace-card">
                <div className="section-kicker">DEFENSIVE PRIORITIES</div>
                <h2>Control the opponent strengths</h2>
                {plan.defensivePriorities.length ? plan.defensivePriorities.map((x) =>
                  <div className="training-field" key={x.threat + x.ourWeakness}><span>{x.threat}</span><p>{x.priority} · {phase(x.phase)} · {x.action}</p></div>
                ) : <p>No threat interaction has reached the current evidence threshold.</p>}
              </article>
              <article className="workspace-card">
                <div className="section-kicker">TRANSITION</div>
                <h2>First action after regain / loss</h2>
                <p>{plan.principles.transition}</p>
                <p>Use the selected priority as the reference behaviour for the first action after each transition.</p>
              </article>
            </section>

            <section className="workspace-card">
              <div className="section-kicker">ENGINE GOVERNANCE</div>
              <h2>How Match Plan v1 decides</h2>
              {plan.decisionRules.map((rule, index) => <div className="training-field" key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{rule}</p></div>)}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return <article className="metric-card"><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></article>;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return <div className="training-field"><span>{label}</span><p>{value || "Not defined"}</p></div>;
}
