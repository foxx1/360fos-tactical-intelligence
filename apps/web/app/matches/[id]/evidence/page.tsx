"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Evidence = { id:string; analysisType:"OUR_TEAM"|"OPPONENT"; minute:number; phase:string; event:string; principle?:string|null; subPrinciple?:string|null; behaviour?:string|null; actor?:string|null; target?:string|null; trigger?:string|null; outcome?:string|null; zone?:string|null; impact?:number|null; note:string; videoRef?:string|null };

const phases = [
  ["IN_POSSESSION","In Possession"],["OUT_OF_POSSESSION","Out of Possession"],
  ["ATTACKING_TRANSITION","Attacking Transition"],["DEFENSIVE_TRANSITION","Defensive Transition"],["SET_PIECE","Set Piece"]
];
const eventTemplates = [
  "Build-up progression","High press","Counter-press","Defensive transition","Ball rotation",
  "Overload to isolate","1v1 penetration","Cutback","Cross","Chance creation","Loss of possession",
  "Slow recovery","Positioning error","Space conceded"
];

const outcomeOptions = [
  "Progression","Chance Created","Shot","Goal","Possession Retained",
  "Possession Lost","Opponent Progression","Opponent Chance","Recovery","No Outcome"
];

export default function EvidencePage() {
  const params = useParams<{id:string}>(); const router=useRouter();
  const [evidence,setEvidence]=useState<Evidence[]>([]);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [generating,setGenerating]=useState(false);
  const [message,setMessage]=useState(""); const [error,setError]=useState("");
  const [taxonomy,setTaxonomy]=useState<any[]>([]);
  const [taxonomyLoading,setTaxonomyLoading]=useState(true);
  const [form,setForm]=useState({analysisType:"OPPONENT",minute:"0",phase:"OUT_OF_POSSESSION",event:"",principle:"",subPrinciple:"",behaviour:"",actor:"",target:"",trigger:"",outcome:"",zone:"",impact:"3",note:"",videoRef:""});

  async function session(){ const {data:{session}}=await createClient().auth.getSession(); if(!session){router.replace("/login");return null} return session; }
  async function load(){
    const s=await session(); if(!s)return;
    const base=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000/api/v1";
    const [evidenceResponse,taxonomyResponse]=await Promise.all([
      fetch(base+"/matches/"+params.id+"/evidence",{headers:{Authorization:"Bearer "+s.access_token}}),
      fetch(base+"/tactical-taxonomy",{headers:{Authorization:"Bearer "+s.access_token}})
    ]);
    if(evidenceResponse.ok){
      const j: unknown=await evidenceResponse.json().catch(()=>null);
      const raw=j&&typeof j==="object"&&"data" in j?(j as {data?:unknown}).data:j;
      setEvidence(Array.isArray(raw)?raw as Evidence[]:[]);
    } else router.replace("/matches");
    if(taxonomyResponse.ok){
      const j: unknown=await taxonomyResponse.json().catch(()=>null);
      const raw=j&&typeof j==="object"&&"data" in j?(j as {data?:unknown}).data:j;
      setTaxonomy(Array.isArray(raw)?raw:[]);
    } else setError("Unable to load tactical taxonomy.");
    setLoading(false); setTaxonomyLoading(false);
  }
  useEffect(()=>{load()},[params.id]);

  const selectedPhase=taxonomy.find((x:any)=>x.id===form.phase);
  const selectedPrinciple=selectedPhase?.principles?.find((x:any)=>x.id===form.principle);
  const selectedSubPrinciple=selectedPrinciple?.subPrinciples?.find((x:any)=>x.id===form.subPrinciple);
  const principleOptions=selectedPhase?.principles??[];
  const subPrincipleOptions=selectedPrinciple?.subPrinciples??[];
  const behaviourOptions=selectedSubPrinciple?.behaviours??[];

  async function submit(e:FormEvent){
    e.preventDefault(); setSaving(true); setError(""); setMessage("");
    const s=await session(); if(!s)return;
    const base=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000/api/v1";
    const r=await fetch(base+"/matches/"+params.id+"/evidence",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.access_token},body:JSON.stringify({...form,minute:Number(form.minute),impact:Number(form.impact)})});
    const j=await r.json(); if(!r.ok)setError(j.message??"Unable to save evidence."); else {setEvidence(x=>[...x,j.data].sort((a,b)=>a.minute-b.minute));setForm({...form,minute:form.minute,event:"",zone:"",note:"",videoRef:""});setMessage("Evidence captured.");}
    setSaving(false);
  }

  async function generate(){
    setGenerating(true);setError("");setMessage("");
    const s=await session();if(!s)return;
    const base=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000/api/v1";
    const r=await fetch(base+"/matches/"+params.id+"/intelligence/generate",{method:"POST",headers:{Authorization:"Bearer "+s.access_token}});
    const j=await r.json(); if(!r.ok)setError(j.message??"Generation failed."); else setMessage("Generated "+j.data.generatedAnalyses+" analyses, "+j.data.generatedGaps+" tactical gaps and "+j.data.generatedPriorities+" training priorities.");
    setGenerating(false);
  }

  return <main className="fos-shell">
    <aside className="fos-sidebar"><div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div><nav><Link href="/">⌂ <span>Dashboard</span></Link><Link className="active" href="/matches">▣ <span>Matches</span></Link><Link href="/opponents">◌ <span>Opponents</span></Link><Link href="/training">⚽ <span>Training</span></Link></nav></aside>
    <section className="fos-main">
      <header className="fos-topbar"><div className="fos-search fake-search">⌕ Search match evidence...</div><div className="fos-user">Evidence Capture <span>•</span> 360FOS</div></header>
      <div className="page-heading"><div><div className="crumb">MATCH / EVIDENCE</div><h1>Evidence Capture Engine</h1><p>Capture match moments once. Convert them into analysis, tactical gaps and training priorities.</p></div><div className="heading-actions"><Link className="secondary-action" href={"/matches/"+params.id}>Workspace</Link><button className="primary-action" onClick={generate} disabled={generating}>{generating?"Generating...":"Generate Intelligence ✦"}</button></div></div>
      <section className="evidence-layout">
        <form className="evidence-form" onSubmit={submit}>
          <div className="section-kicker">CAPTURE MOMENT</div><h2>New Evidence</h2>
          <div className="segmented"><button type="button" className={form.analysisType==="OUR_TEAM"?"selected":""} onClick={()=>setForm({...form,analysisType:"OUR_TEAM"})}>Our Team</button><button type="button" className={form.analysisType==="OPPONENT"?"selected":""} onClick={()=>setForm({...form,analysisType:"OPPONENT"})}>Opponent</button></div>
          <div className="evidence-grid">
            <label>Minute<input required type="number" min="0" step=".1" value={form.minute} onChange={e=>setForm({...form,minute:e.target.value})}/></label>
            <label>Impact<select value={form.impact} onChange={e=>setForm({...form,impact:e.target.value})}>{[1,2,3,4,5].map(x=><option key={x} value={x}>{x} / 5</option>)}</select></label>
            <label>Phase<select value={form.phase} disabled={taxonomyLoading} onChange={e=>setForm({...form,phase:e.target.value,principle:"",subPrinciple:"",behaviour:""})}>{(taxonomy.length?taxonomy:phases).map((x:any)=>{const v=x.id??x[0];const l=x.name??x[1];return <option key={v} value={v}>{l}</option>})}</select></label>
            <label>Zone<input value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})} placeholder="Right half-space"/></label>
            <label>Principle<select value={form.principle} disabled={taxonomyLoading||!selectedPhase} onChange={e=>setForm({...form,principle:e.target.value,subPrinciple:"",behaviour:""})}><option value="">Select principle</option>{principleOptions.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label>Sub-Principle<select value={form.subPrinciple} disabled={taxonomyLoading||!selectedPrinciple} onChange={e=>setForm({...form,subPrinciple:e.target.value,behaviour:""})}><option value="">Select sub-principle</option>{subPrincipleOptions.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label>Outcome<select value={form.outcome} onChange={e=>setForm({...form,outcome:e.target.value})}><option value="">Select outcome</option>{outcomeOptions.map(x=><option key={x}>{x}</option>)}</select></label>
            <label>Actor / Unit<input value={form.actor} onChange={e=>setForm({...form,actor:e.target.value})} placeholder="RB / Back four / Front 3"/></label>
            <label>Target<input value={form.target} onChange={e=>setForm({...form,target:e.target.value})} placeholder="Opponent LB / Zone 14"/></label>
            <label>Trigger<input value={form.trigger} onChange={e=>setForm({...form,trigger:e.target.value})} placeholder="Full-back steps out"/></label>
          </div>
          <label>Event<select required value={eventTemplates.includes(form.event)?form.event:""} onChange={e=>setForm({...form,event:e.target.value})}><option value="">Select common event</option>{eventTemplates.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Or type your own<input value={eventTemplates.includes(form.event)?"":form.event} onChange={e=>setForm({...form,event:e.target.value})} placeholder="e.g. Full-back isolated 1v1"/></label>
          <label>Behaviour<select value={form.behaviour} disabled={taxonomyLoading||!selectedSubPrinciple} onChange={e=>setForm({...form,behaviour:e.target.value})}><option value="">Select behaviour</option>{behaviourOptions.map((x:any)=><option key={x.id} value={x.name}>{x.name}</option>)}</select></label>
          <label>Analyst Note<textarea required value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="What happened? What did you observe? What is the tactical significance?"/></label>
          <label>Video Reference<input value={form.videoRef} onChange={e=>setForm({...form,videoRef:e.target.value})} placeholder="Veo timestamp / clip URL / file reference"/></label>
          {error&&<div className="error-box">{error}</div>}{message&&<div className="success-box">{message}</div>}
          <button className="primary-action full" disabled={saving}>{saving?"Saving...":"Capture Evidence →"}</button>
        </form>
        <section className="evidence-list"><div className="list-header"><div><div className="section-kicker">MATCH TIMELINE</div><h2>Captured Evidence <span>{evidence.length}</span></h2></div></div>
          {loading?<div className="list-empty">Loading evidence...</div>:evidence.length===0?<div className="list-empty"><strong>No evidence captured</strong><span>Start tagging moments from your match video.</span></div>:<div className="timeline">{evidence.map(x=><article className="evidence-item" key={x.id}><div className="minute">{x.minute}'</div><div className="evidence-line"></div><div className="evidence-body"><div className="evidence-top"><span className={"type-pill "+x.analysisType.toLowerCase()}>{x.analysisType==="OUR_TEAM"?"OUR TEAM":"OPPONENT"}</span><span className="phase-pill">{x.phase.replaceAll("_"," ")}</span><b>{x.event}</b>{x.principle?<span className="phase-pill">{x.principle}</span>:""}<span className="impact">Impact {x.impact??3}/5</span></div><p>{x.note}</p><small>{x.zone??"General zone"} {x.videoRef?" · "+x.videoRef:""}</small></div></article>)}</div>}
        </section>
      </section>
    </section>
  </main>
}
