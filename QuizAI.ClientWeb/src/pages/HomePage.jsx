import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 64px" }}>

      {/* Hero */}
      <div style={{
        marginTop: 48,
        marginBottom: 48,
        background: "#fff",
        border: "2.5px solid var(--ink)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-hard-xl)",
        overflow: "hidden",
      }}>
        {/* Banner stripe */}
        <div style={{
          height: 12,
          background: "var(--violet)",
          backgroundImage: "repeating-linear-gradient(90deg, var(--violet) 0 32px, var(--coral) 32px 64px, var(--lime) 64px 96px, var(--sky) 96px 128px)",
        }} />

        <div style={{ padding: "48px 48px 40px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--lime)",
            border: "2px solid var(--ink)",
            borderRadius: 100,
            padding: "5px 14px",
            marginBottom: 24,
            boxShadow: "3px 3px 0 0 var(--ink)",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink)" }}>
              Powered by AI
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            lineHeight: 1.1,
            letterSpacing: "-.03em",
            color: "var(--ink)",
            margin: "0 0 20px",
          }}>
            Crea, Condividi e<br />
            <span style={{ color: "var(--violet)" }}>Impara</span> con Quiz Intelligenti
          </h1>

          <p style={{ fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.6, maxWidth: 520, marginBottom: 32 }}>
            Genera quiz con l&apos;intelligenza artificiale, sfida i tuoi amici e
            monitora i tuoi progressi in tempo reale.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              to="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--violet)",
                color: "#fff",
                border: "2.5px solid var(--ink)",
                borderRadius: "var(--radius-sm)",
                padding: "13px 26px",
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: "-.01em",
                textDecoration: "none",
                boxShadow: "var(--shadow-hard)",
                transition: "transform .1s, box-shadow .1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = "6px 6px 0 0 var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-hard)"; }}
            >
              Inizia Gratis
            </Link>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                color: "var(--ink)",
                border: "2.5px solid var(--ink)",
                borderRadius: "var(--radius-sm)",
                padding: "13px 26px",
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                textDecoration: "none",
                boxShadow: "var(--shadow-hard)",
                transition: "transform .1s, box-shadow .1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = "6px 6px 0 0 var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-hard)"; }}
            >
              Accedi
            </Link>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 48 }}>
        {[
          {
            color: "var(--violet)",
            label: "Generazione AI",
            desc: "Descrivi un argomento e l'AI crea domande pertinenti istantaneamente.",
            stat: "+300%",
            statLabel: "Velocità di creazione",
          },
          {
            color: "var(--coral)",
            label: "Apprendimento Sociale",
            desc: "Connettiti con gli amici, condividi quiz e costruisci una community.",
            stat: "95%",
            statLabel: "Soddisfazione utenti",
          },
          {
            color: "var(--lime)",
            label: "Analisi Avanzate",
            desc: "Monitora i progressi, traccia le performance e scopri dove migliorare.",
            stat: "Real-time",
            statLabel: "Feedback istantaneo",
          },
        ].map((f) => (
          <div
            key={f.label}
            style={{
              background: "#fff",
              border: "2.5px solid var(--ink)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-hard)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: 8, background: f.color }} />
            <div style={{ padding: "22px 22px 20px" }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                marginBottom: 8,
              }}>
                {f.label}
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 16 }}>
                {f.desc}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: "-.02em",
                  color: "var(--ink)",
                }}>
                  {f.stat}
                </span>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{f.statLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{
        background: "#fff",
        border: "2.5px solid var(--ink)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-hard-lg)",
        padding: "40px 40px 36px",
        marginBottom: 48,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--ink-soft)",
          marginBottom: 8,
        }}>
          Come funziona
        </div>
        <h2 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: "1.9rem",
          letterSpacing: "-.02em",
          color: "var(--ink)",
          marginBottom: 32,
        }}>
          Tre semplici passi
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
          {[
            { n: "01", title: "Crea un account", desc: "Registrati gratis e unisciti alla community.", color: "var(--violet)" },
            { n: "02", title: "Genera un Quiz", desc: "Scrivi un argomento, l'AI pensa al resto.", color: "var(--coral)" },
            { n: "03", title: "Condividi e Sfida", desc: "Invita gli amici e scala la classifica.", color: "var(--lime)" },
          ].map((s) => (
            <div key={s.n}>
              <div style={{
                width: 44,
                height: 44,
                background: s.color,
                border: "2.5px solid var(--ink)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "3px 3px 0 0 var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 14,
                color: "var(--ink)",
                marginBottom: 16,
              }}>
                {s.n}
              </div>
              <h3 style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: 17,
                letterSpacing: "-.01em",
                color: "var(--ink)",
                marginBottom: 6,
              }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: "var(--ink)",
        border: "2.5px solid var(--ink)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-hard-xl)",
        padding: "40px 40px",
        textAlign: "center",
      }}>
        <h2 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: "1.8rem",
          letterSpacing: "-.02em",
          color: "#fff",
          marginBottom: 12,
        }}>
          Pronto a iniziare?
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.6)", marginBottom: 28 }}>
          Unisciti alla community e inizia a creare quiz potenziati dall&apos;AI.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/register"
            style={{
              background: "var(--lime)",
              color: "var(--ink)",
              border: "2.5px solid rgba(255,255,255,.3)",
              borderRadius: "var(--radius-sm)",
              padding: "13px 26px",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "4px 4px 0 0 rgba(255,255,255,.18)",
            }}
          >
            Crea Account Gratuito
          </Link>
          <Link
            to="/quizzes"
            style={{
              background: "transparent",
              color: "#fff",
              border: "2px solid rgba(255,255,255,.35)",
              borderRadius: "var(--radius-sm)",
              padding: "13px 26px",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Esplora Quiz
          </Link>
        </div>
      </div>

    </div>
  );
}
