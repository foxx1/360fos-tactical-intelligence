"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TaxonomyPhase = {
  id: string;
  name: string;
  principles: { id: string; name: string; subPrinciples: { id: string; name: string; behaviours: { id: string; name: string }[] }[] }[];
};

export default function OpponentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [taxonomy, setTaxonomy] = useState<TaxonomyPhase[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMatch, setSavingMatch] = useState(false);
  const [savingEvidence, setSavingEvidence] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [matchForm, setMatchForm] = useState({
    externalOpponentName: "",
    matchDate: "",
    opponentScore: "",
    externalScore: "",
    opponentHome: true,
    videoRef: "",
    notes: "",
  });
  const [evidenceForm, setEvidenceForm] = useState({
    minute: "0",
    phase: "OUT_OF_POSSESSION",
    principle: "",
    subPrinciple: "",
    behaviour: "",
    actor: "",
    target: "",
    trigger: "",
    outcome: "",
    zone: "",
    impact: "3",
    note: "",
    videoRef: "",
  });

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

  async function authFetch(path: string, init: RequestInit = {}) {
    const { data: { session } } = await createClient().auth.getSession();
    if (!session) {
      router.replace("/login");
      throw new Error("Unauthenticated");
    }
    return fetch(base + path, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: "Bearer " + session.access_token,
        "Content-Type": "application/json",
      },
    });
  }

  async function load() {
    try {
      const [workspaceResponse, summaryResponse, taxonomyResponse] = await Promise.all([
        authFetch("/matches/" + params.id + "/opponent-scouting"),
        authFetch("/matches/" + params.id + "/opponent-scouting/summary"),
        authFetch("/tactical-taxonomy"),
      ]);

      const workspaceJson = await workspaceResponse.json().catch(() => null);
      const summaryJson = await summaryResponse.json().catch(() => null);
      const taxonomyJson = await taxonomyResponse.json().catch(() => null);

      if (!workspaceResponse.ok) throw new Error(workspaceJson?.error?.message || "Unable to load opponent scouting.");
      setWorkspace(workspaceJson?.data);
      setSummary(summaryJson?.data);
      setTaxonomy(Array.isArray(taxonomyJson?.data) ? taxonomyJson.data : []);

      const first = workspaceJson?.data?.matches?.[0];
      if (first && !selectedMatchId) setSelectedMatchId(first.id);
    } catch (e: any) {
      if (e.message !== "Unauthenticated") setError(e.message || "Unable to load scouting workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [params.id]);

  const selectedMatch = workspace?.matches?.find((x: any) => x.id === selectedMatchId);
  const selectedPhase = taxonomy.find((x) => x.id === evidenceForm.phase);
  const selectedPrinciple = selectedPhase?.principles?.find((x) => x.name === evidenceForm.principle);
  const selectedSub = selectedPrinciple?.subPrinciples?.find((x) => x.name === evidenceForm.subPrinciple);

  async function addMatch(e: FormEvent) {
    e.preventDefault();
    setSavingMatch(true); setError(""); setMessage("");
    try {
      const response = await authFetch("/matches/" + params.id + "/opponent-scouting/matches", {
        method: "POST",
        body: JSON.stringify({
          ...matchForm,
          opponentScore: matchForm.opponentScore === "" ? null : Number(matchForm.opponentScore),
          externalScore: matchForm.externalScore === "" ? null : Number(matchForm.externalScore),
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.error?.message || json?.message || "Unable to add scouting match.");
      setMessage("Previous match added.");
      setMatchForm({ externalOpponentName: "", matchDate: "", opponentScore: "", externalScore: "", opponentHome: true, videoRef: "", notes: "" });
      await load();
      if (json?.data?.id) setSelectedMatchId(json.data.id);
    } catch (e: any) {
      if (e.message !== "Unauthenticated") setError(e.message);
    } finally {
      setSavingMatch(false);
    }
  }

  async function addEvidence(e: FormEvent) {
    e.preventDefault();
    if (!selectedMatchId) return;
    setSavingEvidence(true); setError(""); setMessage("");
    try {
      const response = await authFetch("/matches/" + params.id + "/opponent-scouting/matches/" + selectedMatchId + "/evidence", {
        method: "POST",
        body: JSON.stringify({ ...evidenceForm, minute: Number(evidenceForm.minute), impact: Number(evidenceForm.impact) }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.error?.message || json?.message || "Unable to save evidence.");
      setEvidenceForm({ ...evidenceForm, minute: evidenceForm.minute, note: "", videoRef: "" });
      setMessage("Opponent evidence captured.");
      await load();
    } catch (e: any) {
      if (e.message !== "Unauthenticated") setError(e.message);
    } finally {
      setSavingEvidence(false);
    }
  }

  if (loading) return <main className="fos-shell"><section className="fos-main"><div className="empty-state">Loading opponent scouting workspace...</div></section></main>;

  return (
    <main className="fos-shell">
      <aside className="fos-sidebar">
        <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
        <nav><Link href="/">⌂ <span>Dashboard</span></Link><Link className="active" href="/matches">▣ <span>Matches</span></Link><Link href="/opponents">◌ <span>Opponents</span></Link><Link href="/training">⚽ <span>Training</span></Link><Link href="/reports">▤ <span>Reports</span></Link></nav>
      </aside>

      <section className="fos-main">
        <div className="breadcrumb-row"><Link href="/matches">Matches</Link><span>›</span><Link href={"/matches/" + params.id}>Workspace</Link><span>›</span><b>Opponent Scouting</b></div>

        <section className="page-heading">
          <div>
            <div className="crumb">MATCH / OPPONENT SCOUTING</div>
            <h1>Opponent Scouting Workspace</h1>
            <p>Build the pre-match opponent model from up to five previous matches, one match at a time.</p>
          </div>
          <Link className="secondary-action" href={"/matches/" + params.id + "/evidence"}>Current Match Evidence →</Link>
        </section>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}

        <section className="training-cards">
          <article className="workspace-card">
            <div className="section-kicker">SCOUTING SAMPLE</div>
            <h2>{workspace?.upcomingMatch?.opponent?.name || "Opponent"} · {workspace?.capacity?.used || 0}/5 matches</h2>
            <p>Five matches provide the target sample for identifying recurring behaviours. Fewer matches remain usable but should be treated as limited evidence.</p>
            <div className="training-grid">
              <Field label="Sample quality" value={summary?.sample?.sampleQuality || "NO_DATA"} />
              <Field label="Matches analysed" value={String(summary?.sample?.matchesAnalyzed || 0)} />
              <Field label="Remaining" value={String(workspace?.capacity?.remaining ?? 5)} />
            </div>
          </article>
        </section>

        <section className="workspace-card">
          <div className="section-kicker">PREVIOUS MATCHES</div>
          <h2>Match-by-Match Scouting</h2>
          <div className="training-cards">
            {workspace?.matches?.map((match: any) => (
              <button type="button" key={match.id} className={"workspace-card " + (selectedMatchId === match.id ? "selected" : "")} onClick={() => setSelectedMatchId(match.id)} style={{ textAlign: "left" }}>
                <div className="section-kicker">MATCH {match.sequence}</div>
                <h2>{match.opponentName} vs {match.externalOpponentName}</h2>
                <div className="training-grid">
                  <Field label="Date" value={new Date(match.matchDate).toLocaleDateString()} />
                  <Field label="Score" value={match.opponentScore != null && match.externalScore != null ? match.opponentScore + "-" + match.externalScore : "Not entered"} />
                  <Field label="Evidence" value={String(match._count?.evidence ?? 0)} />
                </div>
              </button>
            ))}
          </div>
          {!workspace?.matches?.length && <div className="empty-state"><h2>No previous matches added.</h2><p>Add the first available opponent match below.</p></div>}
        </section>

        {(workspace?.capacity?.remaining ?? 5) > 0 && (
          <form className="evidence-form" onSubmit={addMatch}>
            <div className="section-kicker">ADD PREVIOUS MATCH</div>
            <h2>Add Opponent Match {Number(workspace?.capacity?.used || 0) + 1} / 5</h2>
            <div className="evidence-grid">
              <label>Opponent faced<input required value={matchForm.externalOpponentName} onChange={(e) => setMatchForm({ ...matchForm, externalOpponentName: e.target.value })} placeholder="e.g. Al Riffa" /></label>
              <label>Match date<input required type="date" value={matchForm.matchDate} onChange={(e) => setMatchForm({ ...matchForm, matchDate: e.target.value })} /></label>
              <label>Opponent score<input type="number" min="0" value={matchForm.opponentScore} onChange={(e) => setMatchForm({ ...matchForm, opponentScore: e.target.value })} /></label>
              <label>Other team score<input type="number" min="0" value={matchForm.externalScore} onChange={(e) => setMatchForm({ ...matchForm, externalScore: e.target.value })} /></label>
              <label>Opponent home?<select value={String(matchForm.opponentHome)} onChange={(e) => setMatchForm({ ...matchForm, opponentHome: e.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select></label>
              <label>Video reference<input value={matchForm.videoRef} onChange={(e) => setMatchForm({ ...matchForm, videoRef: e.target.value })} placeholder="Veo / Wyscout / file reference" /></label>
            </div>
            <label>Scouting notes<textarea value={matchForm.notes} onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })} placeholder="Context about this previous match..." /></label>
            <button className="primary-action" disabled={savingMatch}>{savingMatch ? "Adding..." : "Add Previous Match →"}</button>
          </form>
        )}

        {selectedMatch && (
          <form className="evidence-form" onSubmit={addEvidence}>
            <div className="section-kicker">MATCH {selectedMatch.sequence} · EVIDENCE</div>
            <h2>Analyse {selectedMatch.opponentName} vs {selectedMatch.externalOpponentName}</h2>
            <div className="evidence-grid">
              <label>Minute<input required type="number" min="0" step=".1" value={evidenceForm.minute} onChange={(e) => setEvidenceForm({ ...evidenceForm, minute: e.target.value })} /></label>
              <label>Phase<select value={evidenceForm.phase} onChange={(e) => setEvidenceForm({ ...evidenceForm, phase: e.target.value, principle: "", subPrinciple: "", behaviour: "" })}>{taxonomy.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
              <label>Principle<select value={evidenceForm.principle} onChange={(e) => setEvidenceForm({ ...evidenceForm, principle: e.target.value, subPrinciple: "", behaviour: "" })}><option value="">Select principle</option>{selectedPhase?.principles?.map((x) => <option key={x.id} value={x.name}>{x.name}</option>)}</select></label>
              <label>Sub-Principle<select value={evidenceForm.subPrinciple} onChange={(e) => setEvidenceForm({ ...evidenceForm, subPrinciple: e.target.value, behaviour: "" })}><option value="">Select sub-principle</option>{selectedPrinciple?.subPrinciples?.map((x) => <option key={x.id} value={x.name}>{x.name}</option>)}</select></label>
              <label>Behaviour<select value={evidenceForm.behaviour} onChange={(e) => setEvidenceForm({ ...evidenceForm, behaviour: e.target.value })}><option value="">Select behaviour</option>{selectedSub?.behaviours?.map((x) => <option key={x.id} value={x.name}>{x.name}</option>)}</select></label>
              <label>Outcome<select value={evidenceForm.outcome} onChange={(e) => setEvidenceForm({ ...evidenceForm, outcome: e.target.value })}><option value="">Select outcome</option>{["Progression","Chance Created","Shot","Goal","Possession Retained","Possession Lost","Opponent Progression","Opponent Chance","Recovery","No Outcome"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Impact<select value={evidenceForm.impact} onChange={(e) => setEvidenceForm({ ...evidenceForm, impact: e.target.value })}>{[1,2,3,4,5].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Zone<input value={evidenceForm.zone} onChange={(e) => setEvidenceForm({ ...evidenceForm, zone: e.target.value })} placeholder="Right half-space" /></label>
              <label>Actor / Unit<input value={evidenceForm.actor} onChange={(e) => setEvidenceForm({ ...evidenceForm, actor: e.target.value })} placeholder="Back four / Front 3" /></label>
              <label>Target<input value={evidenceForm.target} onChange={(e) => setEvidenceForm({ ...evidenceForm, target: e.target.value })} placeholder="Zone 14 / full-back" /></label>
              <label>Trigger<input value={evidenceForm.trigger} onChange={(e) => setEvidenceForm({ ...evidenceForm, trigger: e.target.value })} placeholder="Press trigger / opponent action" /></label>
            </div>
            <label>Observation<textarea required value={evidenceForm.note} onChange={(e) => setEvidenceForm({ ...evidenceForm, note: e.target.value })} placeholder="What did the opponent actually do? Capture the tactical significance." /></label>
            <label>Video reference<input value={evidenceForm.videoRef} onChange={(e) => setEvidenceForm({ ...evidenceForm, videoRef: e.target.value })} placeholder="Timestamp / clip reference" /></label>
            <button className="primary-action" disabled={savingEvidence}>{savingEvidence ? "Capturing..." : "Capture Opponent Evidence →"}</button>
          </form>
        )}

        <section className="workspace-card">
          <div className="section-kicker">CROSS-MATCH PATTERNS</div>
          <h2>Recurring Opponent Behaviours</h2>
          {!summary?.recurringBehaviours?.length ? <div className="empty-state"><p>Capture evidence from the previous matches to build the recurring behaviour model.</p></div> : (
            <div className="training-cards">
              {summary.recurringBehaviours.slice(0, 12).map((item: any) => (
                <article className="workspace-card" key={item.behaviour}>
                  <div className="section-kicker">{item.principle || "TACTICAL PATTERN"}</div>
                  <h2>{item.behaviour}</h2>
                  <div className="training-grid">
                    <Field label="Match coverage" value={item.matchCoverage + "/" + summary.sample.matchesAnalyzed + " (" + item.coveragePct + "%)"} />
                    <Field label="Frequency" value={String(item.frequency)} />
                    <Field label="Success rate" value={item.successRate == null ? "Insufficient outcome data" : item.successRate + "%"} />
                    <Field label="Avg impact" value={item.averageImpact + "/5"} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="training-cards">
          <article className="workspace-card">
            <div className="section-kicker">PHASE DISTRIBUTION</div>
            <h2>Where the opponent shows up most</h2>
            {(summary?.phases || []).map((x: any) => <div className="training-field" key={x.phase}><span>{x.phase.replaceAll("_", " ")}</span><p>{x.count} observations</p></div>)}
          </article>
          <article className="workspace-card">
            <div className="section-kicker">PRINCIPLE DISTRIBUTION</div>
            <h2>Recurring tactical principles</h2>
            {(summary?.principles || []).slice(0, 8).map((x: any) => <div className="training-field" key={x.principle}><span>{x.principle}</span><p>{x.count} observations</p></div>)}
          </article>
        </section>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return <div className="training-field"><span>{label}</span><p>{value || "Not defined"}</p></div>;
}
