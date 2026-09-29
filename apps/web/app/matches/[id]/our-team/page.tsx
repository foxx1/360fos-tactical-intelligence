"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OurTeamPage(){
  const params=useParams<{id:string}>(); const router=useRouter();
  const [items,setItems]=useState<any[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{const {data:{session}}=await createClient().auth.getSession(); if(!session){router.replace("/login");return;}
    const base=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000/api/v1";
    const res=await fetch(base+"/matches/"+params.id+"/evidence",{headers:{Authorization:"Bearer "+session.access_token}});
    const json=await res.json().catch(()=>null); const raw=json&&typeof json==="object"&&"data" in json?json.data:json;
    setItems(Array.isArray(raw)?raw.filter((x:any)=>x.analysisType==="OUR_TEAM"):[]); setLoading(false);
  })()},[params.id,router]);
  return <Workspace title="Our Team" kicker="MATCH / OUR TEAM" description="Review evidence captured for our team and identify repeatable behaviours." items={items} loading={loading} matchId={params.id} empty="No Our Team evidence has been captured yet." />;
}

function Workspace({title,kicker,description,items,loading,matchId,empty}:{title:string;kicker:string;description:string;items:any[];loading:boolean;matchId:string;empty:string}){
return <main className="fos-shell"><aside className="fos-sidebar"><div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div><nav><Link href="/">⌂ <span>Dashboard</span></Link><Link className="active" href="/matches">▣ <span>Matches</span></Link><Link href="/opponents">◌ <span>Opponents</span></Link><Link href="/training">⚽ <span>Training</span></Link><Link href="/reports">▤ <span>Reports</span></Link></nav></aside><section className="fos-main"><div className="breadcrumb-row"><Link href="/matches">Matches</Link><span>›</span><Link href={"/matches/"+matchId}>Workspace</Link><span>›</span><b>{title}</b></div><section className="page-heading"><div><div className="crumb">{kicker}</div><h1>{title}</h1><p>{description}</p></div><Link className="secondary-action" href={"/matches/"+matchId+"/evidence"}>Evidence Capture →</Link></section>{loading?<div className="empty-state">Loading...</div>:items.length===0?<div className="empty-state"><h2>{empty}</h2><p>Capture evidence first, then return here to review the tactical pattern.</p><Link className="primary-action" href={"/matches/"+matchId+"/evidence"}>Capture Evidence</Link></div>:<section className="training-cards">{items.map((x:any)=><article className="workspace-card training-card" key={x.id}><span className="section-kicker">{x.phase?.replaceAll("_"," ")}</span><h2>{x.event}</h2><p>{x.note}</p><div className="training-grid"><Field label="Minute" value={String(x.minute)+"'"} /><Field label="Zone" value={x.zone}/><Field label="Impact" value={String(x.impact??3)+"/5"}/><Field label="Video" value={x.videoRef}/></div></article>)}</section>}</section></main>;
}
function Field({label,value}:{label:string;value?:string|null}){return <div className="training-field"><span>{label}</span><p>{value||"Not defined"}</p></div>}
