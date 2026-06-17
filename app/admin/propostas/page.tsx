"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PropostaStatus } from "@prisma/client";
import { statusLabelMap, statusColors } from "@/constants/status";



type PropostaData = {
  id: string;
  status: PropostaStatus;
  createdAt: string;
  proponente: { nome: string; cpf: string; email: string };
  edital: { titulo: string; modalidade: string };
  _count: { equipe: number; marcos: number };
};

export default function AdminPropostasPage() {
  const [propostas, setPropostas] = useState<PropostaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PropostaStatus | "ALL">("ALL");
  const [proponenteFilter, setProponenteFilter] = useState("");

  useEffect(() => {
    fetchPropostas();
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

  const filteredPropostas = propostas.filter((prop) =>
    prop.proponente.nome.toLowerCase().includes(proponenteFilter.toLowerCase())
  );

  return (
    <div className="grid wide-layout" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h1 className="h1">Gestão de Propostas e Avaliações</h1>
          <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="lei-banner">
            📋 <strong>Lei</strong>
          </a>
        </div>
        
        <div className="grid two" style={{ gap: 16, marginBottom: 20 }}>
          <div className="row" style={{ margin: 0 }}>
            <div className="label">Filtrar por Etapa / Status</div>
            <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="ALL">Todas as Propostas</option>
              <option value="RASCUNHO">🏠 Em Rascunho</option>
              <option value="SUBMETIDA">📥 Submetidas (Aguardando Triagem)</option>
              <option value="EM_TRIAGEM">🔍 Em Triagem</option>
              <option value="PARECER_EDUCACAO">📚 Aguardando Parecer (Educação)</option>
              <option value="AVALIACAO_CMAA">⚖️ Em Avaliação pelo CMAA</option>
              <option value="CLASSIFICADA">🏆 Classificada (Aguardando Homologação)</option>
              <option value="HOMOLOGADA">✅ Homologada</option>
              <option value="TERMO_OUTORGA">📝 Termo de Outorga</option>
              <option value="EM_EXECUCAO">⚙️ Em Execução</option>
              <option value="SUSPENSA">⏸️ Suspensa</option>
              <option value="EM_AJUSTE">⚠️ Aguardando Revisão do Proponente</option>
              <option value="CANCELADA">❌ Cancelada</option>
              <option value="CONCLUIDA">🏁 Concluída</option>
            </select>
          </div>
          <div className="row" style={{ margin: 0 }}>
            <div className="label">🔍 Buscar por Nome do Proponente</div>
            <input
              type="text"
              className="input"
              placeholder="Digite o nome do proponente..."
              value={proponenteFilter}
              onChange={(e) => setProponenteFilter(e.target.value)}
            />
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
                      📋 {prop.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                      <strong>{prop.proponente.nome}</strong><br/>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{prop.proponente.cpf}</span>
                    </td>
                    <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                      {prop.edital.titulo}<br/>
                      <span className="badge" style={{ marginTop: 4, display: "inline-block" }}>{prop.edital.modalidade}</span>
                    </td>
                    <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                      <span 
                        className="badge"
                        style={{
                          backgroundColor: statusColors[prop.status] || "var(--border)",
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: "11px",
                          border: "none",
                          padding: "4px 8px"
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
                      <Link 
                        href={`/admin/propostas/${prop.id}`} 
                        className="btn secondary" 
                        style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}
                      >
                        Avaliar / Detalhes
                      </Link>
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
