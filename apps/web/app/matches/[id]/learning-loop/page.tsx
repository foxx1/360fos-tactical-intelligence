"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Result = {
  behaviour: string;
  targetKpi?: string | null;
  trainingSuccessRate?: number | null;
  matchEvidenceCount: number;
  matchSuccessRate?: number | null;
  status: "TRANSFERRED" | "PARTIAL" | "NOT_TRANSFERRED" | "INSUFFICIENT_EVIDENCE";
  confidence: number;
  evidence: Array<{ id: string; minute: number; note: string; outcome?: string | null; videoRef?: string | null }>;
};

const statusCopy: Record<Result["status"], string> = {
  TRANSFERRED: "Transferred",
  PARTIAL: "Partial",
  NOT_TRANSFERRED: "Not transferred",
  INSUFFICIENT_EVIDENCE: "Insufficient evidence",
};

export default function LearningLoopPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
      const response = await fetch(base + "/matches/" + params.id + "/learning-loop", {
        headers: { Authorization: "Bearer " + session.access_token },
      });
      const json = await response.json().catch(() => null);
      setData(json?.data ?? json);
      setLoading(false);
    })();
  }, [params.id, router]);

  const summary = data?.matchValidation?.summary;
  const results: Result[] = data?.matchValidation?.results ?? [];

  return (
    <main className="fos-shell">
      <aside className="fos-sidebar">
        <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
        <nav>
          <Link href="/">⌂ <span>Dashboard</span></Link>
          <Link className="active" href="/matches">▣ <span>Matches</span></Link>
          <Link href="/opponents">◌ <span>Opponents</span></Link>
          <Link href="/training">⚽ <span>Training</span></Link>
          <Link href="/reports">▤ <span>Reports</span></Link>
        </nav>
      </aside>
      <section className="fos-main">
        <div className="breadcrumb-row"><Link href="/matches">Matches</Link><span>›</span><Link href={"/matches/" + params.id}>Workspace</Link><span>›</span><b>Learning Loop</b></div>
        <section className="page-heading">
          <div>
            <div className="crumb">TRAIN → PERFORM → VALIDATE → LEARN</div>
            <h1>Training ↔ Match Learning Loop</h1>
            <p>Measure whether trained tactical behaviours appeared and succeeded in the match.</p>
          </div>
          <div className="heading-actions">
            <Link className="secondary-action" href={"/matches/" + params.id + "/training"}>Training</Link>
            <Link className="primary-action" href={"/matches/" + params.id + "/match-plan"}>Match Plan →</Link>
          </div>
        </section>

        {loading ? <div className="empty-state">Loading learning loop...</div> : (
          <>
            <section className="training-cards">
              <article className="workspace-card training-card"><span className="section-kicker">TRAINING</span><h2>{data?.training?.sessionCount ?? 0} sessions</h2><p>Behaviour targets captured from training sessions and exercises.</p></article>
              <article className="workspace-card training-card"><span className="section-kicker">MATCH VALIDATION</span><h2>{data?.matchValidation?.evidenceCount ?? 0} evidence items</h2><p>{data?.matchValidation?.structuredEvidenceCount ?? 0} structured our-team evidence items available for validation.</p></article>
              <article className="workspace-card training-card"><span className="section-kicker">TRANSFER RATE</span><h2>{summary?.transferRate == null ? "—" : summary.transferRate + "%"}</h2><p>{summary?.behavioursTracked ?? 0} behaviours tracked · {summary?.insufficientEvidence ?? 0} require more evidence.</p></article>
            </section>

            <section className="workspace-card">
              <div className="section-kicker">BEHAVIOUR TRANSFER</div>
              <h2>Did the training behaviour transfer?</h2>
              {results.length === 0 ? <div className="empty-state">No behaviour targets are linked to this match yet. Record behaviour results or add matchBehaviour to training exercises.</div> :
                results.map((item) => (
                  <article className="match-card-bottom" key={item.behaviour + item.status + (item.evidence?.[0]?.id ?? "")}>
                    <div>
                      <strong>{item.behaviour}</strong>
                      <div>{statusCopy[item.status]} · confidence {item.confidence}% · {item.matchEvidenceCount} relevant match events</div>
                      {item.targetKpi && <div>Training KPI: {item.targetKpi}</div>}
                    </div>
                    <span>{item.matchSuccessRate == null ? "—" : item.matchSuccessRate + "% match success"}</span>
                  </article>
                ))
              }
            </section>

            <section className="training-cards">
              <article className="workspace-card training-card">
                <div className="section-kicker">NEXT COACHING ACTIONS</div>
                <h2>What happens next?</h2>
                {(data?.nextActions ?? []).map((item: any) => <div className="match-card-bottom" key={item.behaviour}><strong>{item.behaviour}</strong><span>{item.action}</span></div>)}
              </article>
              <article className="workspace-card training-card">
                <div className="section-kicker">GOVERNANCE</div>
                <h2>Auditable v1</h2>
                {(data?.governance ?? []).map((item: string) => <div className="match-card-bottom" key={item}><span>{item}</span></div>)}
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
