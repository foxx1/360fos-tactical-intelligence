"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Exercise = {
  id: string; exerciseOrder: number; phase: string; title: string; objective: string;
  organization?: string|null; durationMinutes?: number|null; players?: string|null;
  constraints?: string|null; coachingPoints?: string|null; successKpi?: string|null;
  progression?: string|null; regression?: string|null; matchBehaviour?: string|null;
};
type TrainingSession = {
  id: string; title: string; sessionDay?: string|null; totalDurationMinutes?: number|null;
  intensity?: string|null; objective: string; matchObjective?: string|null; status: string;
  coachNotes?: string|null; exercises: Exercise[];
};

const baseUrl=()=>process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default function TrainingSessionBuilderPage(){
  const params=useParams<{id:string}>(); const router=useRouter();
  const [session,setSession]=useState<TrainingSession|null>(null);
  const [loading,setLoading]=useState(true); const [generating,setGenerating]=useState(false); const [error,setError]=useState("");
  async function auth(){const {data:{session}}=await createClient().auth.getSession(); if(!session){router.replace("/login");return null;} return session;}
  async function load(){
    const s=await auth(); if(!s)return;
    const res=await fetch(baseUrl()+"/matches/"+params.id+"/training-sessions",{headers:{Authorization:"Bearer "+s.access_token}});
    if(!res.ok){setError("Unable to load training sessions.");setLoading(false);return;}
    const json=await res.json(); setSession((json.data??[])[0]??null); setLoading(false);
  }
  useEffect(()=>{load()},[params.id]);
  async function generate(){
    const s=await auth();if(!s)return;setGenerating(true);setError("");
    const res=await fetch(baseUrl()+"/matches/"+params.id+"/training-sessions/generate",{method:"POST",headers:{Authorization:"Bearer "+s.access_token}});
    const json=await res.json(); if(!res.ok)setError(json.message??"Unable to generate session."); else setSession(json.data?.session??null);
    setGenerating(false);
  }
  if(loading)return <main className="fos-loading">Loading Training Session Builder...</main>;
  return <main className="fos-shell">
    <aside className="fos-sidebar"><div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div><nav><Link href="/">⌂ <span>Dashboard</span></Link><Link className="active" href="/matches">▣ <span>Matches</span></Link><Link href="/">⚽ <span>Training</span></Link><Link href="/">▤ <span>Reports</span></Link></nav><div className="sidebar-footer">360FOS<br/><small>Turn Analysis into Performance</small></div></aside>
    <section className="fos-main"><header className="fos-topbar"><div className="fos-search fake-search">⌕ Session Builder</div><div className="fos-user">Training Session <span>•</span> Tactical Transfer</div></header>
      <div className="breadcrumb-row"><Link href="/matches">Matches</Link><span>›</span><Link href={"/matches/"+params.id+"/training"}>Training Planner</Link><span>›</span><b>Session Builder</b></div>
      <section className="page-heading"><div><div className="crumb">TRAINING / SESSION BUILDER</div><h1>Training Session Builder</h1><p>Build the complete session from tactical priority to observable match behaviour.</p></div><div className="heading-actions"><Link className="secondary-action" href={"/matches/"+params.id+"/training"}>← Training Planner</Link><button className="primary-action" onClick={generate} disabled={generating}>{generating?"Generating...":"Generate Session ✦"}</button></div></section>
      {error&&<div className="error-box planner-message">{error}</div>}
      {!session?<article className="workspace-card training-empty"><span className="section-kicker">SESSION NOT BUILT</span><h2>Generate the first draft session</h2><p>Training priorities are converted into a 60–75 minute tactical session with progressive game-based exercises.</p><button className="primary-action" onClick={generate} disabled={generating}>Generate Session ✦</button></article>:
      <><section className="workspace-card session-overview"><div><span className="section-kicker">{session.sessionDay??"MD-3"} · {session.status}</span><h2>{session.title}</h2><p>{session.objective}</p></div><div className="session-stats"><b>{session.totalDurationMinutes} min</b><span>{session.intensity??"High"} intensity</span></div></section>
      <section className="training-timeline">{session.exercises.map((e)=><article className="workspace-card session-exercise" key={e.id}><div className="exercise-index">{String(e.exerciseOrder).padStart(2,"0")}</div><div className="exercise-main"><span className="section-kicker">{e.phase.replaceAll("_"," ")}</span><h2>{e.title}</h2><p>{e.objective}</p><div className="training-grid"><Field label="Organization" value={e.organization}/><Field label="Players" value={e.players}/><Field label="Constraint" value={e.constraints}/><Field label="Coaching Points" value={e.coachingPoints}/><Field label="KPI" value={e.successKpi}/><Field label="Match Behaviour" value={e.matchBehaviour}/></div></div><div className="exercise-duration">{e.durationMinutes} min</div></article>)}</section>
      <div className="heading-actions"><Link className="primary-action" href={"/matches/"+params.id+"/training/session/command-center"}>Open Coach Command Center →</Link></div><div className="ai-badge">DRAFT · COACH VALIDATION REQUIRED</div></>}
    </section></main>;
}
function Field({label,value}:{label:string,value?:string|null}){return <div className="training-field"><span>{label}</span><p>{value||"Not defined"}</p></div>}
