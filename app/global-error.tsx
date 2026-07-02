"use client";

// Filet de sécurité pour les erreurs du root layout lui-même.
// Doit rendre ses propres <html>/<body> et ne bénéficie pas de globals.css.

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "#e4e4e7",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#52525b" }}>
            Erreur
          </p>
          <h1 style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 500 }}>
            Une erreur est survenue
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#71717a" }}>
            Le service a rencontré un problème inattendu.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "2.5rem",
              padding: "0 1.25rem",
              borderRadius: "0.5rem",
              backgroundColor: "#fff",
              color: "#09090b",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
