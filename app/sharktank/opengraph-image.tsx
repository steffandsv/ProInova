import { ImageResponse } from "next/og";

export const alt = "SharkTank Jaborandi — 28 de novembro, 9h, no C.TECH";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem que aparece quando o link é compartilhado no WhatsApp/Instagram/Facebook. */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#eaf6ff",
          background: "linear-gradient(180deg, #0b6b8f 0%, #04304f 32%, #021226 66%, #010409 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, letterSpacing: 4, color: "#7fe8ff" }}>
          <div style={{ width: 14, height: 14, borderRadius: 99, background: "#ff4d5e" }} />
          INSCRIÇÕES ABERTAS · ENTRADA GRATUITA
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 168, fontWeight: 900, lineHeight: 0.9, letterSpacing: -4 }}>SHARK TANK</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 18 }}>
            <div style={{ width: 90, height: 3, background: "#22e1ff" }} />
            <div style={{ fontSize: 56, letterSpacing: 18, color: "#22e1ff" }}>JABORANDI</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 30, color: "#cfe9ff", gap: 6 }}>
            <div>Prefeitos da região · Sebrae · startups ao vivo</div>
            <div style={{ color: "#ffc23d", fontSize: 40, fontWeight: 700 }}>28.11 · 9H · C.TECH</div>
          </div>
          <svg width="260" height="106" viewBox="0 0 220 90">
            <path fill="#7fe8ff" fillOpacity="0.35" d="M50 41 C38 36 21 20 6 4 C10 18 16 32 24 46 C18 54 12 62 9 71 C22 62 35 54 50 51 Z" />
            <path fill="#7fe8ff" fillOpacity="0.35" d="M216 47 C205 38 185 33 160 31 L134 30 C128 22 120 9 110 3 C114 13 115 23 112 31 C90 34 62 38 42 42 L42 50 C56 52 70 54 82 55 C84 60 86 63 84 67 C90 62 95 58 100 57 C110 57 120 57 128 57 C130 66 133 76 138 84 C140 74 144 64 150 57 C175 56 200 54 216 47 Z" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
