"use client";

import Link from "next/link";

const modules = [
  { href: "/matches", icon: "▣", title: "Matches", text: "Create matches and open the tactical workspace." },
  { href: "/opponents", icon: "◌", title: "Opponents", text: "Manage opponent scouting and tactical profiles." },
  { href: "/teams", icon: "◉", title: "Teams", text: "Manage teams, squads and tactical context." },
  { href: "/players", icon: "♙", title: "Players", text: "Access player intelligence and performance context." },
  { href: "/tactical-intelligence", icon: "✦", title: "Tactical Intelligence", text: "Connect evidence, diagnosis and tactical decisions." },
  { href: "/training", icon: "⚽", title: "Training", text: "Translate tactical gaps into training actions." },
  { href: "/reports", icon: "▤", title: "Reports", text: "Review match and learning reports." },
];

export default function DashboardPage() {
  return (
    <main className="fos-shell">
      <aside className="fos-sidebar">
        <div className="fos-brand"><strong>◆ 360<span>FOS</span></strong><small>Tactical Intelligence</small></div>
        <nav>
          <Link className="active" href="/">⌂ <span>Dashboard</span></Link>
          <Link href="/matches">▣ <span>Matches</span></Link>
          <Link href="/opponents">◌ <span>Opponents</span></Link><Link href="/opponent-scouting">◈ <span>Opponent Scouting</span></Link>
          <Link href="/teams">◉ <span>Teams</span></Link>
          <Link href="/players">♙ <span>Players</span></Link>
          <Link href="/tactical-intelligence">✦ <span>Tactical Intelligence</span></Link>
          <Link href="/training">⚽ <span>Training</span></Link>
          <Link href="/reports">▤ <span>Reports</span></Link>
        </nav>
        <div className="sidebar-footer">360FOS<br/><small>Football Intelligence for a Better Tomorrow</small></div>
      </aside>

      <section className="fos-main">
        <header className="fos-topbar">
          <div className="fos-search fake-search">⌕ Search matches, opponents, players, insights...</div>
          <div className="fos-user">360FOS Workspace <span>•</span> Admin</div>
        </header>

        <div className="page-heading">
          <div>
            <div className="crumb">360FOS / DASHBOARD</div>
            <h1>Football Intelligence Dashboard</h1>
            <p>Move from evidence to tactical decisions, training and match readiness.</p>
          </div>
          <Link className="primary-action" href="/matches/new">+ Create Match</Link>
        </div>

        <section className="workspace-card" style={{ marginBottom: 24 }}>
          <div className="card-title">
            <div><span className="section-kicker">OPERATING SYSTEM</span><h2>360FOS Control Center</h2></div>
            <span className="ai-badge">TACTICAL INTELLIGENCE</span>
          </div>
          <p style={{ color: "var(--muted, #7d8798)", maxWidth: 760 }}>
            Select a module below. Each dashboard action now has its own destination instead of falling back to Matches.
          </p>
        </section>

        <section className="match-grid">
          {modules.map((module) => (
            <Link className="match-card" href={module.href} key={module.href}>
              <div className="teams-row"><span className="metric-icon">{module.icon}</span><strong>{module.title}</strong></div>
              <div className="match-meta">{module.text}</div>
              <div className="match-card-bottom"><span>Open module</span><b>→</b></div>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}
