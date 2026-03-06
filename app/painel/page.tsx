"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PainelPage() {
  const [user, setUser] = useState<any>(null);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setUser(res.user);
          // Fetch user proposals
          fetch("/api/propostas")
            .then((r2) => r2.json())
            .then((res2) => {
              if (res2.ok) setPropostas(res2.data || []);
              setLoading(false);
            });
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => { window.location.href = "/login"; });
  }, []);

  if (loading) return (
    <div className="section" style={{ textAlign: "center", paddingTop: 100 }}>
      <div className="hero-orb hero-orb--1" style={{ width: 300, height: 300, top: "20%", left: "50%", transform: "translate(-50%, 0)", opacity: 0.5 }} aria-hidden />
      <span className="gradient-text" style={{ fontSize: 24, fontWeight: 700 }}>Carregando seu painel...</span>
    </div>
  );

  const isAdmin = user && ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"].includes(user.role);

  const statusConfig: Record<string, { icon: string, color: string, label: string }> = {
    RASCUNHO: { icon: "📝", color: "var(--muted)", label: "Em rascunho" },
    SUBMETIDA: { icon: "📥", color: "#3b82f6", label: "Aguardando feedback" },
    EM_TRIAGEM: { icon: "🔍", color: "#8b5cf6", label: "Em triagem" },
    PARECER_EDUCACAO: { icon: "📚", color: "#8b5cf6", label: "Parecer Educação" },
    AVALIACAO_CMAA: { icon: "⚖️", color: "#f59e0b", label: "Avaliação CMAA" },
    CLASSIFICADA: { icon: "🏆", color: "#10b981", label: "Classificada" },
    HOMOLOGADA: { icon: "✅", color: "#10b981", label: "Homologada" },
    TERMO_OUTORGA: { icon: "📄", color: "#10b981", label: "Termo de outorga" },
    EM_EXECUCAO: { icon: "⚙️", color: "var(--good)", label: "Em execução" },
    SUSPENSA: { icon: "⏸️", color: "var(--warn)", label: "Suspensa" },
    CANCELADA: { icon: "❌", color: "var(--bad)", label: "Cancelada" },
    CONCLUIDA: { icon: "🏁", color: "var(--accent)", label: "Concluída" },
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Background Orbs for the Dashboard */}
      <div className="hero-orb hero-orb--1" style={{ width: 400, height: 400, top: -50, left: -100, opacity: 0.3 }} aria-hidden />
      <div className="hero-orb hero-orb--2" style={{ width: 300, height: 300, top: 100, right: -50, opacity: 0.2 }} aria-hidden />

      <div className="grid" style={{ gap: 24, position: "relative", zIndex: 2 }}>
        
        {/* WELCOME BANNER */}
        <div style={{ textAlign: "center", padding: "40px 0 20px" }}>
          <span className="section-tag" style={{ marginBottom: 16 }}>👋 Bem-vindo de volta!</span>
          <h1 className="h1" style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Olá, <span className="gradient-text">{user?.nome.split(' ')[0]}</span>.
          </h1>
          <p className="p" style={{ maxWidth: 500, margin: "0 auto" }}>
            Pronto para continuar construindo o futuro? Acompanhe seus projetos ou submeta uma nova ideia brilhante.
          </p>
        </div>

        {/* ADMIN SHORTCUTS */}
        {isAdmin && (
          <div className="card" style={{ borderColor: "rgba(245, 158, 11, 0.4)", background: "linear-gradient(180deg, rgba(245,158,11,0.06), rgba(245,158,11,0.01))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>👑</span>
              <strong style={{ fontSize: 16, color: "#fcd34d" }}>Painel Administrativo ({user.role})</strong>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/admin/editais" className="btn secondary" style={{ borderColor: "rgba(245, 158, 11, 0.2)" }}>📋 Gestão de Editais</Link>
              <Link href="/admin/propostas" className="btn secondary" style={{ borderColor: "rgba(245, 158, 11, 0.2)" }}>📄 Avaliar Propostas</Link>
              <Link href="/admin/pagamentos" className="btn secondary" style={{ borderColor: "rgba(245, 158, 11, 0.2)" }}>💰 Liberação de Pagamentos</Link>
            </div>
          </div>
        )}

        {/* USER PROJECTS */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 16 }}>
            <h2 className="h2" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Minhas Propostas</h2>
            <Link href="/propostas/nova" className="cta-btn cta-btn--primary" style={{ padding: "10px 20px", fontSize: 14 }}>
              <span className="cta-icon">⚡</span> Nova Proposta
            </Link>
          </div>

          {propostas.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>💡</span>
              <h3 style={{ fontSize: 20, margin: "0 0 8px" }}>Nenhuma ideia no papel ainda?</h3>
              <p className="p" style={{ maxWidth: 400, margin: "0 auto 24px" }}>
                Você ainda não enviou propostas. Que tal estruturar aquele projeto incrível agora mesmo?
              </p>
              <Link href="/propostas/nova" className="cta-btn cta-btn--ghost">
                Começar rascunho
              </Link>
            </div>
          ) : (
            <div className="grid two" style={{ gap: 18 }}>
              {propostas.map((p: any) => {
                const conf = statusConfig[p.status] || { icon: "📄", color: "var(--muted)" };
                return (
              <div key={p.id} className="feature-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                        <span className="badge" style={{ borderColor: conf.color, backgroundColor: `${conf.color}15`, color: conf.color, fontWeight: 600 }}>
                          {conf.icon} {conf.label}
                        </span>
                        <span className="badge">{p.modalidade}</span>
                        {p.status === "RASCUNHO" && p.aiAnalysisJson && (
                          <span className="badge" style={{ borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981", fontWeight: 600 }}>
                            🤖 Pronta para envio
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>{p.titulo || "(Sem título)"}</h3>
                      <p className="p" style={{ fontSize: 14, margin: 0, opacity: 0.8 }}>
                        {p.status === "RASCUNHO" ? "Editado" : "Enviado"} em: {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      {p.status === "RASCUNHO" ? (
                        <Link href={`/propostas/nova?draft=${p.id}`} className="cta-btn cta-btn--primary" style={{ padding: "8px 16px", fontSize: 14 }}>
                          ✏️ Continuar editando
                        </Link>
                      ) : p.status === "EM_EXECUCAO" ? (
                        <Link href={`/propostas/${p.id}`} className="cta-btn cta-btn--ghost" style={{ padding: "8px 16px", fontSize: 14, borderColor: "var(--good)" }}>
                          🚀 Marcos e Evidências
                        </Link>
                      ) : (
                        <Link href={`/propostas/${p.id}/visualizar`} className="btn secondary" style={{ fontSize: 13, padding: "8px 14px" }}>
                          Ver detalhes
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LEI BANNER */}
        <div style={{ marginTop: 24 }}>
          <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="lei-banner" style={{ justifyContent: "center", padding: 18 }}>
            📋 <strong>Consulte a Lei Municipal de Inovação</strong> — Transparência e regras claras para todos os participantes
          </a>
        </div>

      </div>
    </div>
  );
}

