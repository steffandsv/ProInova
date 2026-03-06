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

  if (loading) return <div className="card"><p className="p">Carregando painel...</p></div>;

  const isAdmin = user && ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"].includes(user.role);

  const statusIcon: Record<string, string> = {
    RASCUNHO: "📝",
    SUBMETIDA: "📥",
    EM_TRIAGEM: "🔍",
    PARECER_EDUCACAO: "📚",
    AVALIACAO_CMAA: "⚖️",
    CLASSIFICADA: "🏆",
    HOMOLOGADA: "✅",
    TERMO_OUTORGA: "📄",
    EM_EXECUCAO: "⚙️",
    SUSPENSA: "⏸️",
    CANCELADA: "❌",
    CONCLUIDA: "🏁",
  };

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="badge"><strong>Conta</strong> {user?.nome} • {user?.cpf}</div>
            <h1 className="h1" style={{ marginTop: 10 }}>Meu Painel</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/propostas/nova" className="btn">Nova Proposta</Link>
            <a className="btn secondary" href="/api/auth/logout">Sair</a>
          </div>
        </div>
      </div>

      {/* Admin Shortcuts */}
      {isAdmin && (
        <div className="card" style={{ borderColor: "var(--accent)" }}>
          <strong style={{ fontSize: 13, color: "var(--accent)" }}>🔧 Acesso Administrativo ({user.role})</strong>
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <Link href="/admin/editais" className="btn secondary">📋 Editais</Link>
            <Link href="/admin/propostas" className="btn secondary">📄 Propostas / Avaliações</Link>
            <Link href="/admin/pagamentos" className="btn secondary">💰 Pagamentos</Link>
          </div>
        </div>
      )}

      {/* Minhas Propostas */}
      <div className="card">
        <h2 className="h2">Minhas Propostas</h2>
        {propostas.length === 0 ? (
          <p className="p" style={{ marginTop: 10 }}>Você ainda não tem propostas. Clique em &ldquo;Nova Proposta&rdquo; acima para começar.</p>
        ) : (
          <div className="grid" style={{ gap: 10, marginTop: 14 }}>
            {propostas.map((p: any) => (
              <div key={p.id} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{p.titulo}</strong>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <span className="badge">{statusIcon[p.status]} {p.status}</span>
                    <span className="badge">{p.modalidade}</span>
                  </div>
                </div>
                {p.status === "EM_EXECUCAO" && (
                  <Link href={`/propostas/${p.id}`} className="btn secondary">
                    📎 Marcos e Evidências
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

