"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/* ── Types ──────────────────────────────────────────────────────────── */
type Ideia = {
  id: string;
  nomeAutor: string;
  titulo: string;
  descricao: string;
  createdAt: string;
};

/* ── Random helpers ─────────────────────────────────────────────────── */
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const EMOJIS = ["💡", "✨", "🌟", "⭐", "🔆", "🪄", "🚀", "🎯"];
const COLORS = [
  "rgba(124, 92, 255, 0.6)",
  "rgba(34, 197, 94, 0.5)",
  "rgba(245, 158, 11, 0.5)",
  "rgba(167, 139, 250, 0.5)",
  "rgba(59, 130, 246, 0.5)",
  "rgba(236, 72, 153, 0.45)",
];

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   BANCO DE IDEIAS — FLOATING CANVAS                    */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function BancoDeIdeiasPage() {
  const [ideias, setIdeias] = useState<Ideia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ideia | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ideias")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setIdeias(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const closeDetail = useCallback(() => setSelected(null), []);

  /* ── Loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="ideias-canvas" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16, animation: "idea-pulse 2s ease-in-out infinite" }}>💡</div>
          <p style={{ color: "var(--muted)", fontSize: 18 }}>Carregando ideias…</p>
        </div>
      </div>
    );
  }

  /* ── Empty state ───────────────────────────────────────────────── */
  if (ideias.length === 0) {
    return (
      <div className="ideias-canvas" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🏺</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            O pote de ideias está vazio!
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.6, marginBottom: 28 }}>
            Seja o primeiro a enviar uma ideia e veja ela flutuando por aqui.
          </p>
          <a href="/ideias/nova" className="btn" style={{ textDecoration: "none", fontSize: 16, padding: "14px 28px" }}>
            💡 Enviar a primeira ideia
          </a>
        </div>
      </div>
    );
  }

  /* ── Floating canvas ───────────────────────────────────────────── */
  return (
    <>
      <div className="ideias-canvas" ref={canvasRef}>
        {/* Header */}
        <div className="ideias-header">
          <h1 className="ideias-title">
            <span style={{ fontSize: 42 }}>🏺</span>{" "}
            Banco de Ideias
          </h1>
          <p className="ideias-subtitle">
            Clique em uma ideia flutuante para saber mais — cada 💡 é a ideia de um cidadão!
          </p>
          <a href="/ideias/nova" className="btn" style={{ textDecoration: "none", marginTop: 8 }}>
            + Enviar minha ideia
          </a>
        </div>

        {/* Floating orbs */}
        <div className="ideias-orbs-area">
          {ideias.map((ideia, i) => {
            const size = rand(70, 130);
            const emoji = pick(EMOJIS);
            const color = pick(COLORS);
            const duration = rand(18, 35);
            const delay = rand(0, 8);
            const startX = rand(5, 85);
            const startY = rand(5, 80);
            const animName = `idea-drift-${i % 6}`;

            return (
              <button
                key={ideia.id}
                className="idea-orb"
                onClick={() => setSelected(ideia)}
                title={ideia.titulo}
                style={{
                  width: size,
                  height: size,
                  left: `${startX}%`,
                  top: `${startY}%`,
                  animationName: animName,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  "--orb-glow": color,
                  "--orb-size": `${size}px`,
                } as React.CSSProperties}
              >
                <span className="idea-orb-emoji">{emoji}</span>
                <span className="idea-orb-label">{ideia.titulo.length > 22 ? ideia.titulo.slice(0, 20) + "…" : ideia.titulo}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Detail overlay ─────────────────────────────────────────── */}
      {selected && (
        <div className="idea-detail-overlay" onClick={closeDetail} onKeyDown={(e) => e.key === 'Escape' && closeDetail()} role="dialog" aria-modal="true" tabIndex={-1}>
          <div
            className="idea-detail-card"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="idea-detail-close" onClick={closeDetail}>✕</button>
            <div style={{ fontSize: 56, textAlign: "center", marginBottom: 12 }}>💡</div>
            <h2 className="idea-detail-title">{selected.titulo}</h2>
            <div className="idea-detail-author">
              <span style={{ opacity: 0.6 }}>Ideia de</span>{" "}
              <strong>{selected.nomeAutor}</strong>
            </div>
            <div className="idea-detail-date">
              {new Date(selected.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="idea-detail-divider" />
            <p className="idea-detail-desc">{selected.descricao}</p>
          </div>
        </div>
      )}
    </>
  );
}
