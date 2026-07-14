"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PropostaStatus } from "@prisma/client";
import { statusLabelMap, statusColors } from "@/constants/status";



type PropostaData = {
  id: string;
  status: PropostaStatus;
  createdAt: string;
  proponente: { nome: string; cpf: string; email: string };
  edital: { titulo: string; modalidade: string };
  marcos: { status: string }[];
  _count: { equipe: number; marcos: number };
};

const filterOptions = [
  { value: "ALL", label: "✨ Todas" },
  { value: "RASCUNHO", label: "🏠 Em Rascunho" },
  { value: "SUBMETIDA", label: "📥 Submetidas" },
  { value: "EM_TRIAGEM", label: "🔍 Em Triagem" },
  { value: "PARECER_EDUCACAO", label: "📚 Parecer Educação" },
  { value: "AVALIACAO_CMAA", label: "⚖️ Avaliação CMAA" },
  { value: "CLASSIFICADA", label: "🏆 Classificada" },
  { value: "HOMOLOGADA", label: "✅ Homologada" },
  { value: "TERMO_OUTORGA", label: "📝 Outorga" },
  { value: "EM_EXECUCAO", label: "⚙️ Em Execução" },
  { value: "SUSPENSA", label: "⏸️ Suspensa" },
  { value: "EM_AJUSTE", label: "⚠️ Aguardando Revisão" },
  { value: "CANCELADA", label: "❌ Cancelada" },
  { value: "CONCLUIDA", label: "🏁 Concluída" },
];

export default function AdminPropostasPage() {
  return (
    <Suspense fallback={
      <div className="section" style={{ textAlign: "center", paddingTop: 100 }}>
        <span className="gradient-text" style={{ fontSize: 24, fontWeight: 700 }}>Carregando propostas...</span>
      </div>
    }>
      <AdminPropostasInner />
    </Suspense>
  );
}

function AdminPropostasInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlStatus = (searchParams.get("status") as PropostaStatus) || "ALL";

  const [propostas, setPropostas] = useState<PropostaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PropostaStatus | "ALL">(urlStatus);
  const [proponenteFilter, setProponenteFilter] = useState("");

  useEffect(() => {
    setStatusFilter(urlStatus);
  }, [urlStatus]);

  useEffect(() => {
    fetchPropostas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function fetchPropostas() {
    setLoading(true);
    let url = "/api/admin/propostas";
    if (statusFilter !== "ALL") {
      url += `?status=${statusFilter}`;
    }
    const res = await fetch(url);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const json = await res.json();
    setPropostas(json.data || []);
    setLoading(false);
  }

  function handleFilterChange(status: PropostaStatus | "ALL") {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const filteredPropostas = propostas.filter((prop) =>
    prop.proponente.nome.toLowerCase().includes(proponenteFilter.toLowerCase())
  );

  return (
    <div className="grid wide-layout" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h1 className="h1">Gestão de Propostas e Avaliações</h1>
          <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="lei-banner">
            <strong>Lei</strong>📋 
          </a>
        </div>
        
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="row" style={{ margin: 0, maxWidth: "450px" }}>
            <div className="label" style={{ marginBottom: 6 }}>Buscar por Nome do Proponente</div>
            <input
              type="text"
              className="input"
              placeholder="Digite o nome do proponente..."
              value={proponenteFilter}
              onChange={(e) => setProponenteFilter(e.target.value)}
            />
          </div>

          <div className="row" style={{ margin: 0 }}>
            <div className="label" style={{ marginBottom: 10 }}>Filtrar por Etapa / Status</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {filterOptions.map((opt) => {
                const isActive = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn ${isActive ? "" : "secondary"}`}
                    onClick={() => handleFilterChange(opt.value as any)}
                    style={{
                      fontSize: "12px",
                      padding: "6px 12px",
                      borderRadius: "10px",
                      border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                      transition: "all 0.15s ease",
                      boxShadow: isActive ? "0 0 10px rgba(124, 92, 255, 0.25)" : "none",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="p">Carregando propostas...</p>
        ) : filteredPropostas.length === 0 ? (
          <p className="p">Nenhuma proposta encontrada.</p>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
            <table className="table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", margin: 0 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>ID</th>
                  <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>Proponente</th>
                  <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>Edital (Modalidade)</th>
                  <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>Equipe / Marcos</th>
                  <th style={{ padding: "12px 10px", textAlign: "right", whiteSpace: "nowrap" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPropostas.map((prop) => (
                  <tr key={prop.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td 
                      style={{ 
                        padding: "12px 10px", 
                        fontFamily: "monospace", 
                        fontSize: 12, 
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        textDecoration: "underline dashed rgba(255, 255, 255, 0.25)"
                      }}
                      title={`ID completo: ${prop.id}\n(Clique para copiar)`}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(prop.id);
                          alert(`ID copiado para a área de transferência:\n${prop.id}`);
                        } catch {
                          alert("Não foi possível copiar o ID.");
                        }
                      }}
                    >
                      {prop.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                      <strong>{prop.proponente.nome}</strong><br/>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{prop.proponente.cpf}</span>
                    </td>
                    <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                      {prop.edital.titulo}<br/>
                      <span className="badge" style={{ marginTop: 4, display: "inline-block", fontSize: "10px", padding: "2px 6px" }}>{prop.edital.modalidade}</span>
                    </td>
                    <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                      <span 
                        className="badge"
                        style={{
                          backgroundColor: statusColors[prop.status] || "var(--border)",
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: "12.5px",
                          border: "none",
                          padding: "5px 10px"
                        }}
                      >
                        {statusLabelMap[prop.status] || prop.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px", fontSize: 13, whiteSpace: "nowrap" }}>
                      👤 {prop._count.equipe} membro(s)<br/>
                      📅 {prop._count.marcos} mês(es)
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <Link 
                          href={`/admin/propostas/${prop.id}`} 
                          className="btn secondary" 
                          style={{ 
                            whiteSpace: "nowrap", 
                            display: "inline-flex", 
                            alignItems: "center", 
                            fontSize: "12px", 
                            padding: "6px 12px",
                            borderColor: prop.marcos?.some((m) => m.status === "SUBMETIDO") ? "#D4AF37" : undefined,
                            color: prop.marcos?.some((m) => m.status === "SUBMETIDO") ? "#D4AF37" : undefined
                          }}
                        >
                          Avaliar / Detalhes
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
