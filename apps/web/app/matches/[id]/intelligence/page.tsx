"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Finding = {
  id: string;
  type: "OUR_TEAM" | "OPPONENT";
  findingType: "STRENGTH" | "WEAKNESS";
  behaviour: string;
  phase: string;
  impact: number;
  frequency: number;
  score: number;
  priority?: string | null;
};

type Gap = {
  id: string;
  type: "OPPORTUNITY" | "THREAT";
  ourStrength?: string | null;
  ourWeakness?: string | null;
  opponentStrength?: string | null;
  opponentWeakness?: string | null;
  interaction: string;
  opportunity?: string | null;
  threat?: string | null;
  tacticalPrinciple?: string | null;
  playerBehaviour?: string | null;
  teamBehaviour?: string | null;
  trainingObjective?: string | null;
  matchObjective?: string | null;
  priority: string;
  status: string;
};

type Candidate = {
  type: "OPPORTUNITY" | "THREAT";
  ourStrength?: Finding;
  ourWeakness?: Finding;
  opponentStrength?: Finding;
  opponentWeakness?: Finding;
  interaction: string;
  gap: Gap | null;
};

type MatrixData = {
  ourStrengths: Finding[];
  ourWeaknesses: Finding[];
  opponentStrengths: Finding[];
  opponentWeaknesses: Finding[];
  opportunities: Candidate[];
  threats: Candidate[];
  quadrants: {
    strengthVsStrength: Candidate[];
    weaknessVsWeakness: Candidate[];
  };
  gaps: Gap[];
};

const baseUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default function IntelligenceMatrixPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<MatrixData | null>(null);
  const [selected, setSelected] = useState<Gap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function getSession() {
    const { data: { session } } = await createClient().auth.getSession();
    if (!session) {
      router.replace("/login");
      return null;
    }
    return session;
  }

  async function load() {
    const session = await getSession();
    if (!session) return;
    const response = await fetch(baseUrl() + "/matches/" + params.id + "/intelligence/matrix", {
      headers: { Authorization: "Bearer " + session.access_token },
    });
    if (!response.ok) {
      router.replace("/matches");
      return;
    }
    const json = await response.json();
    setData(json.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  async function createCandidate(candidate: Candidate) {
    const session = await getSession();
    if (!session) return;
    setSaving(true);
    setError("");
    const payload = {
      type: candidate.type,
      ourStrength: candidate.ourStrength?.behaviour,
      ourWeakness: candidate.ourWeakness?.behaviour,
      opponentStrength: candidate.opponentStrength?.behaviour,
      opponentWeakness: candidate.opponentWeakness?.behaviour,
      interaction: candidate.interaction,
      opportunity: candidate.type === "OPPORTUNITY" ? candidate.interaction : undefined,
      threat: candidate.type === "THREAT" ? candidate.interaction : undefined,
      tacticalPrinciple: candidate.type === "OPPORTUNITY"
        ? "Exploit the identified opponent weakness."
        : "Protect the vulnerable area and control the opponent strength.",
      trainingObjective: candidate.type === "OPPORTUNITY"
        ? "Train " + candidate.ourStrength?.behaviour + " to repeatedly attack " + candidate.opponentWeakness?.behaviour + "."
        : "Train the team to resist " + candidate.opponentStrength?.behaviour + " and improve " + candidate.ourWeakness?.behaviour + ".",
      priority: "HIGH",
    };
    const response = await fetch(baseUrl() + "/matches/" + params.id + "/intelligence/gaps", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok) setError(json.message ?? "Unable to create tactical gap.");
    else {
      setMessage("Tactical gap created. Review the diagnosis and approve it when ready.");
      setSelected(json.data);
      await load();
    }
    setSaving(false);
  }

  async function updateGap() {
    if (!selected) return;
    const session = await getSession();
    if (!session) return;
    setSaving(true);
    setError("");
    const response = await fetch(baseUrl() + "/matches/" + params.id + "/intelligence/gaps/" + selected.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({
        interaction: selected.interaction,
        opportunity: selected.opportunity,
        threat: selected.threat,
        tacticalPrinciple: selected.tacticalPrinciple,
        playerBehaviour: selected.playerBehaviour,
        teamBehaviour: selected.teamBehaviour,
        trainingObjective: selected.trainingObjective,
        matchObjective: selected.matchObjective,
        priority: selected.priority,
        status: selected.status,
      }),
    });
    const json = await response.json();
    if (!response.ok) setError(json.message ?? "Unable to save tactical gap.");
    else {
      setSelected(json.data);
      setMessage("Tactical gap updated.");
      await load();
    }
    setSaving(false);
  }

  function edit<K extends keyof Gap>(key: K, value: Gap[K]) {
    setSelected((current) => current ? { ...current, [key]: value } : current);
  }

  if (loading) return <main className="fos-loading">Loading Tactical Intelligence Matrix...</main>;
  if (!data) return null;

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
          <div className="fos-search fake-search">⌕ Search insights, gaps, behaviours...</div>
          <div className="fos-user">Tactical Intelligence <span>•</span> Matrix</div>
        </header>

        <div className="breadcrumb-row">
          <Link href="/matches">Matches</Link><span>›</span>
          <Link href={"/matches/" + params.id}>Workspace</Link><span>›</span><b>Intelligence Matrix</b>
        </div>

        <section className="page-heading">
          <div>
            <div className="crumb">TACTICAL INTELLIGENCE / MATRIX</div>
            <h1>Our Strength × Their Weakness</h1>
            <p>Connect repeatable behaviours into actionable opportunities and threats before they become a match plan.</p>
          </div>
          <div className="heading-actions">
            <Link className="secondary-action" href={"/matches/" + params.id}>Workspace</Link>
            <Link className="primary-action" href={"/matches/" + params.id + "/evidence"}>Capture Evidence →</Link>
          </div>
        </section>

        <section className="intelligence-summary">
          <Summary label="Our Strengths" value={data.ourStrengths.length} tone="positive" text="Behaviours we can exploit"/>
          <Summary label="Our Weaknesses" value={data.ourWeaknesses.length} tone="negative" text="Behaviours we must protect"/>
          <Summary label="Opponent Strengths" value={data.opponentStrengths.length} tone="negative" text="Threats to control"/>
          <Summary label="Opponent Weaknesses" value={data.opponentWeaknesses.length} tone="positive" text="Spaces to attack"/>
        </section>

        <section className="matrix-panel">
          <div className="matrix-header">
            <div>
              <span className="section-kicker">DECISION MATRIX</span>
              <h2>Interaction Map</h2>
            </div>
            <span className="ai-badge">DRAFT INTELLIGENCE</span>
          </div>

          <div className="matrix-grid">
            <MatrixQuadrant
              title="OPPORTUNITY"
              subtitle="Our Strength × Opponent Weakness"
              tone="opportunity"
              candidates={data.opportunities}
              onCreate={createCandidate}
              onSelect={setSelected}
              saving={saving}
            />
            <MatrixQuadrant
              title="THREAT"
              subtitle="Our Weakness × Opponent Strength"
              tone="threat"
              candidates={data.threats}
              onCreate={createCandidate}
              onSelect={setSelected}
              saving={saving}
            />
            <MatrixQuadrant
              title="CONTROL"
              subtitle="Our Strength × Opponent Strength"
              tone="control"
              candidates={data.quadrants.strengthVsStrength}
              onCreate={createCandidate}
              onSelect={setSelected}
              saving={saving}
            />
            <MatrixQuadrant
              title="EXPOSURE"
              subtitle="Our Weakness × Opponent Weakness"
              tone="exposure"
              candidates={data.quadrants.weaknessVsWeakness}
              onCreate={createCandidate}
              onSelect={setSelected}
              saving={saving}
            />
          </div>
        </section>

        <section className="intelligence-layout">
          <article className="workspace-card">
            <div className="card-title">
              <div><span className="section-kicker">TACTICAL GAPS</span><h2>Coach Decision Queue</h2></div>
              <span className="pill">{data.gaps.length} gaps</span>
            </div>
            <div className="gap-list">
              {data.gaps.length === 0
                ? <div className="list-empty compact"><strong>No tactical gaps yet</strong><span>Create one from an opportunity or threat above.</span></div>
                : data.gaps.map((gap) => (
                  <button className={"gap-row " + gap.type.toLowerCase()} key={gap.id} onClick={() => setSelected(gap)}>
                    <span className="gap-type">{gap.type}</span>
                    <div><strong>{gap.interaction}</strong><small>{gap.priority} · {gap.status}</small></div>
                    <i>→</i>
                  </button>
                ))}
            </div>
          </article>

          <GapEditor
            gap={selected}
            saving={saving}
            message={message}
            error={error}
            onEdit={edit}
            onSave={updateGap}
          />
        </section>
      </section>
    </main>
  );
}

function Summary({label,value,tone,text}:{label:string,value:number,tone:"positive"|"negative",text:string}) {
  return <article className={"intel-summary-card " + tone}><span>{label}</span><strong>{value}</strong><small>{text}</small></article>;
}

function MatrixQuadrant({
  title, subtitle, tone, candidates, onCreate, onSelect, saving
}:{
  title:string; subtitle:string; tone:string; candidates:Candidate[];
  onCreate:(candidate:Candidate)=>void; onSelect:(gap:Gap)=>void; saving:boolean;
}) {
  return <article className={"matrix-quadrant " + tone}>
    <div className="matrix-quadrant-head"><div><b>{title}</b><h3>{subtitle}</h3></div><span>{candidates.length}</span></div>
    {candidates.length === 0 ? <div className="matrix-empty">Waiting for enough analysed evidence.</div> :
      <div className="candidate-list">{candidates.map((candidate, index) => {
        const left = candidate.ourStrength ?? candidate.ourWeakness;
        const right = candidate.opponentWeakness ?? candidate.opponentStrength;
        return <div className="candidate-card" key={index}>
          <div className="candidate-pair"><span>{left?.behaviour ?? "—"}</span><i>×</i><span>{right?.behaviour ?? "—"}</span></div>
          <p>{candidate.interaction}</p>
          {candidate.gap
            ? <button className="review-button" onClick={() => onSelect(candidate.gap!)}>Review gap →</button>
            : tone === "opportunity" || tone === "threat"
              ? <button className="review-button" disabled={saving} onClick={() => onCreate(candidate)}>Create Tactical Gap +</button>
              : <span className="matrix-note">Use as context for the match plan.</span>}
        </div>;
      })}</div>}
  </article>;
}

function GapEditor({
  gap, saving, message, error, onEdit, onSave
}:{
  gap:Gap|null; saving:boolean; message:string; error:string;
  onEdit:<K extends keyof Gap>(key:K,value:Gap[K])=>void; onSave:()=>void;
}) {
  if (!gap) return <article className="workspace-card gap-editor empty-editor"><span className="section-kicker">COACH REVIEW</span><h2>Select a tactical gap</h2><p>Choose an opportunity or threat to refine the tactical principle, behaviours, training objective and match objective.</p></article>;

  return <article className="workspace-card gap-editor">
    <div className="card-title"><div><span className="section-kicker">COACH REVIEW</span><h2>{gap.type === "OPPORTUNITY" ? "Opportunity Editor" : "Threat Editor"}</h2></div><span className={"pill " + gap.type.toLowerCase()}>{gap.status}</span></div>
    <label>Interaction<input value={gap.interaction} onChange={e=>onEdit("interaction",e.target.value)}/></label>
    <label>{gap.type === "OPPORTUNITY" ? "Opportunity" : "Threat"}<textarea value={(gap.type === "OPPORTUNITY" ? gap.opportunity : gap.threat) ?? ""} onChange={e=>onEdit(gap.type === "OPPORTUNITY" ? "opportunity" : "threat",e.target.value)}/></label>
    <div className="editor-grid">
      <label>Priority<select value={gap.priority} onChange={e=>onEdit("priority",e.target.value)}>{["CRITICAL","HIGH","MEDIUM","LOW"].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Status<select value={gap.status} onChange={e=>onEdit("status",e.target.value)}>{["OPEN","REVIEWED","APPROVED","REJECTED"].map(x=><option key={x}>{x}</option>)}</select></label>
    </div>
    <label>Tactical Principle<textarea value={gap.tacticalPrinciple ?? ""} onChange={e=>onEdit("tacticalPrinciple",e.target.value)} placeholder="What principle should govern the behaviour?"/></label>
    <div className="editor-grid">
      <label>Player Behaviour<textarea value={gap.playerBehaviour ?? ""} onChange={e=>onEdit("playerBehaviour",e.target.value)} placeholder="Perceive → decide → execute"/></label>
      <label>Team Behaviour<textarea value={gap.teamBehaviour ?? ""} onChange={e=>onEdit("teamBehaviour",e.target.value)} placeholder="Unit / team action"/></label>
    </div>
    <label>Training Objective<textarea value={gap.trainingObjective ?? ""} onChange={e=>onEdit("trainingObjective",e.target.value)} placeholder="What must training improve?"/></label>
    <label>Match Objective<textarea value={gap.matchObjective ?? ""} onChange={e=>onEdit("matchObjective",e.target.value)} placeholder="What should appear in the match?"/></label>
    {error && <div className="error-box">{error}</div>}
    {message && <div className="success-box">{message}</div>}
    <button className="primary-action full" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save Coach Decision →"}</button>
  </article>;
}
