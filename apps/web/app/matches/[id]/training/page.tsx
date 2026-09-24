"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Priority = {
  id: string; rank?: number | null; priority: string; problem: string; evidence?: string | null;
  diagnosis?: string | null; objective: string; exerciseType?: string | null; constraint?: string | null;
  players?: string | null; durationMinutes?: number | null; intensity?: string | null;
  successKpi?: string | null; matchObjective?: string | null; sessionDay?: string | null;
};

const baseUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default function TrainingPlannerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function session() {
    const { data: { session } } = await createClient().auth.getSession();
    if (!session) { router.replace("/login"); return null; }
    return session;
  }

  async function load() {
    const s = await session(); if (!s) return;
    const res = await fetch(baseUrl() + "/matches/" + params.id + "/training-priorities", {
      headers: { Authorization: "Bearer " + s.access_token }
    });
    if (!res.ok) { router.replace("/matches"); return; }
    const json = await res.json();
    setPriorities(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  async function generate() {
    const s = await session(); if (!s) return;
    setGenerating(true); setError(""); setMessage("");
    const res = await fetch(baseUrl() + "/matches/" + params.id + "/training-priorities/generate", {
      method: "POST",
      headers: { Authorization: "Bearer " + s.access_token }
    });
    const json = await res.json();
    if (!res.ok) setError(json.message ?? "Unable to generate training plan.");
    else {
      setMessage(json.data?.message ?? "Training priorities generated.");
      await load();
    }
    setGenerating(false);
  }

  if (loading) return <main className="fos-loading">Loading Training Planner...</main>;

  return (
    <main className="fos-shell">
      <aside className="fos-sidebar">
        <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
        <nav>
          <Link href="/">⌂ <span>Dashboard</span></Link>
          <Link className="active" href="/matches">▣ <span>Matches</span></Link>
          <Link href="/">◌ <span>Opponents</span></Link>
          <Link href="/">⚽ <span>Training</span></Link>
          <Link href="/">▤ <span>Reports</span></Link>
        </nav>
        <div className="sidebar-footer">360FOS<br/><small>Turn Analysis into Performance</small></div>
      </aside>

      <section className="fos-main">
        <header className="fos-topbar">
          <div className="fos-search fake-search">⌕ Search exercises, objectives, KPIs...</div>
          <div className="fos-user">Training Planner <span>•</span> Tactical Transfer</div>
        </header>

        <div className="breadcrumb-row">
          <Link href="/matches">Matches</Link><span>›</span>
          <Link href={"/matches/" + params.id}>Workspace</Link><span>›</span>
          <b>Training Planner</b>
        </div>

        <section className="page-heading">
          <div>
            <div className="crumb">TRAINING / TACTICAL TRANSFER</div>
            <h1>From Tactical Gap to Training</h1>
            <p>Convert approved match intelligence into game-based exercises, constraints, KPIs and observable match behaviours.</p>
          </div>
          <div className="heading-actions">
            <Link className="secondary-action" href={"/matches/" + params.id + "/intelligence"}>← Intelligence Matrix</Link>
            <button className="primary-action" onClick={generate} disabled={generating}>{generating ? "Generating..." : "Generate Training Plan ✦"}</button>
          </div>
        </section>

        <section className="training-flow">
          {["TACTICAL GAP","TRAINING OBJECTIVE","EXERCISE","CONSTRAINT","KPI","MATCH BEHAVIOUR"].map((x,i)=>
            <div key={x}><span>0{i+1}</span><b>{x}</b>{i<5 && <i>→</i>}</div>
          )}
        </section>

        {error && <div className="error-box planner-message">{error}</div>}
        {message && <div className="success-box planner-message">{message}</div>}

        <section className="planner-header">
          <div><span className="section-kicker">COACHING PLAN</span><h2>{priorities.length} training priorities</h2></div>
          <span className="ai-badge">DRAFT · COACH VALIDATION REQUIRED</span>
        </section>

        <section className="training-cards">
          {priorities.length === 0 ? (
            <article className="workspace-card training-empty">
              <span className="section-kicker">NO PLAN GENERATED</span>
              <h2>Approve a Tactical Gap first</h2>
              <p>Go to the Intelligence Matrix, review the tactical diagnosis, and set at least one gap to APPROVED. The engine will then build a draft training priority.</p>
              <Link className="primary-action" href={"/matches/" + params.id + "/intelligence"}>Open Intelligence Matrix →</Link>
            </article>
          ) : priorities.map((p) => (
            <article className="workspace-card training-card" key={p.id}>
              <div className="training-card-top">
                <div className="rank">{String(p.rank ?? 0).padStart(2,"0")}</div>
                <div><span className="section-kicker">PRIORITY {p.priority}</span><h2>{p.problem}</h2></div>
                <div className="session-pill">{p.sessionDay ?? "MD-3"}</div>
              </div>

              <div className="training-grid">
                <Field label="Diagnosis" value={p.diagnosis}/>
                <Field label="Training Objective" value={p.objective}/>
                <Field label="Exercise Type" value={p.exerciseType}/>
                <Field label="Players / Unit" value={p.players}/>
                <Field label="Constraint" value={p.constraint}/>
                <Field label="Duration" value={(p.durationMinutes ?? 0) + " min · " + (p.intensity ?? "High")}/>
                <Field label="Success KPI" value={p.successKpi}/>
                <Field label="Match Objective" value={p.matchObjective}/>
              </div>

              <div className="training-card-footer">
                <span>Evidence link</span><small>{p.evidence ?? "Tactical gap evidence"}</small>
                <button className="secondary-action" onClick={() => navigator.clipboard?.writeText([p.objective,p.exerciseType,p.constraint,p.successKpi].filter(Boolean).join("\n"))}>Copy Exercise Brief</button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function Field({label,value}:{label:string,value?:string|null}) {
  return <div className="training-field"><span>{label}</span><p>{value || "Not defined"}</p></div>;
}
