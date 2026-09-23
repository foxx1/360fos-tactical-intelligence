import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><div className="eyebrow">360FOS</div><h1>Tactical Intelligence</h1></div>
        <form action="/auth/signout" method="post"><button className="ghost-button">Sign out</button></form>
      </header>
      <section className="hero">
        <span className="status">MVP FOUNDATION</span>
        <h2>From match evidence to training decisions.</h2>
        <p>Your tactical workspace is ready for the first vertical slice: Match → Analysis → Evidence → Strengths & Weaknesses → Gap Analysis → Training Priority.</p>
      </section>
      <section className="dashboard-grid">
        <article><span>01</span><h3>Matches</h3><p>Create and manage the tactical workspace for each match.</p></article>
        <article><span>02</span><h3>Evidence</h3><p>Capture minute, phase, zone and video references.</p></article>
        <article><span>03</span><h3>Intelligence</h3><p>Turn observations into strengths, weaknesses and tactical gaps.</p></article>
        <article><span>04</span><h3>Training</h3><p>Convert diagnosed problems into measurable training priorities.</p></article>
      </section>
    </main>
  );
}