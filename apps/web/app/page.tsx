export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px" }}>
      <section style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ opacity: 0.65, marginBottom: 8 }}>360FOS</p>
        <h1 style={{ fontSize: 42, margin: "0 0 16px" }}>
          Tactical Intelligence
        </h1>
        <p style={{ maxWidth: 720, lineHeight: 1.7, opacity: 0.8 }}>
          Match → Analysis → Evidence → Strengths & Weaknesses → Gap Analysis →
          Training Priority → Match Plan → Post-Match Validation.
        </p>
        <div style={{ marginTop: 32, padding: 24, border: "1px solid #26304a", borderRadius: 16 }}>
          MVP foundation is ready. The first vertical slice will start with Match and Opponent Intelligence.
        </div>
      </section>
    </main>
  );
}
