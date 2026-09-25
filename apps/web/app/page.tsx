"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Workspace = {
  id?: string;
  name: string;
  teams: { id: string; name: string; seasons: { id: string; name: string }[] }[];
  opponents: { id: string; name: string }[];
  competitions?: { id: string; name: string }[];
};

function normalizeWorkspace(value: unknown): Workspace | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const teams = Array.isArray(raw.teams)
    ? raw.teams.filter((team): team is Record<string, unknown> => !!team && typeof team === "object").map((team) => ({
        id: typeof team.id === "string" ? team.id : "",
        name: typeof team.name === "string" ? team.name : "Unnamed team",
        seasons: Array.isArray(team.seasons)
          ? team.seasons.filter((season): season is Record<string, unknown> => !!season && typeof season === "object").map((season) => ({
              id: typeof season.id === "string" ? season.id : "",
              name: typeof season.name === "string" ? season.name : "Unnamed season"
            }))
          : []
      }))
    : [];

  const opponents = Array.isArray(raw.opponents)
    ? raw.opponents.filter((opponent): opponent is Record<string, unknown> => !!opponent && typeof opponent === "object").map((opponent) => ({
        id: typeof opponent.id === "string" ? opponent.id : "",
        name: typeof opponent.name === "string" ? opponent.name : "Unnamed opponent"
      }))
    : [];

  const competitions = Array.isArray(raw.competitions)
    ? raw.competitions.filter((competition): competition is Record<string, unknown> => !!competition && typeof competition === "object").map((competition) => ({
        id: typeof competition.id === "string" ? competition.id : "",
        name: typeof competition.name === "string" ? competition.name : "Unnamed competition"
      }))
    : [];

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    name: typeof raw.name === "string" ? raw.name : "360FOS Workspace",
    teams,
    opponents,
    competitions
  };
}

export default function HomePage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        if (active) setEmail(session.user.email ?? "");

        const response = await fetch(
          (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1") + "/organizations/me",
          {
            headers: {
              Authorization: "Bearer " + session.access_token,
              Accept: "application/json"
            },
            cache: "no-store"
          }
        );

        const result: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error("Unable to load workspace.");
        }

        const payload =
          result && typeof result === "object" && "data" in result
            ? (result as { data?: unknown }).data
            : null;

        const normalized = normalizeWorkspace(payload);

        if (!normalized) {
          router.replace("/onboarding");
          return;
        }

        if (active) setWorkspace(normalized);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load workspace.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return <main className="app-shell"><p>Loading Tactical Intelligence...</p></main>;
  }

  if (error) {
    return (
      <main className="app-shell">
        <section className="hero">
          <span className="status">WORKSPACE ERROR</span>
          <h2>Unable to load workspace</h2>
          <p>{error}</p>
          <button className="ghost-button" onClick={() => window.location.reload()}>Retry</button>
        </section>
      </main>
    );
  }

  if (!workspace) return null;

  const primaryTeam = workspace.teams[0];
  const seasonCount = primaryTeam?.seasons?.length ?? 0;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">360FOS</div>
          <h1>Tactical Intelligence</h1>
        </div>
        <div className="topbar-actions">
          <span>{email}</span>
          <button className="ghost-button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <section className="hero">
        <span className="status">WORKSPACE READY</span>
        <h2>{workspace.name}</h2>
        <p>Prepare matches by connecting our team intelligence, opponent intelligence, tactical gaps and training priorities.</p>
      </section>

      <div style={{ marginTop: 24 }}>
        <a className="primary-action" href="/matches">Open Match Workspace →</a>
      </div>

      <section className="dashboard-grid">
        <article>
          <span>TEAM</span>
          <h3>{primaryTeam?.name ?? "No team"}</h3>
          <p>{seasonCount} season(s) configured.</p>
        </article>
        <article>
          <span>OPPONENTS</span>
          <h3>{workspace.opponents.length}</h3>
          <p>Opponent profiles available for match preparation.</p>
        </article>
        <article>
          <span>INTELLIGENCE</span>
          <h3>Our Team + Opponent</h3>
          <p>Build evidence-based strengths, weaknesses and tactical gaps.</p>
        </article>
        <article>
          <span>TRAINING</span>
          <h3>Decision Loop</h3>
          <p>Convert tactical diagnosis into training objectives and match behaviours.</p>
        </article>
      </section>
    </main>
  );
}
