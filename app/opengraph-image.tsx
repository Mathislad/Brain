import { ImageResponse } from "next/og";

// Image OpenGraph 1200×630 générée aux couleurs F5L Brain (partage social).
export const runtime = "edge";
export const alt = "F5L — Acquisition client, CRM et IA réunis dans une infrastructure claire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#09090b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 24,
              background: "#18181b",
              border: "1px solid #27272a",
              fontSize: 40,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -2,
            }}
          >
            F5L
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: 6,
            }}
          >
            Brain
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#fff", lineHeight: 1.1, letterSpacing: -1 }}>
            Acquisition client, CRM et IA
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa", maxWidth: 900 }}>
            Sites, publicités, CRM, automatisations et agents IA dans une seule infrastructure.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
