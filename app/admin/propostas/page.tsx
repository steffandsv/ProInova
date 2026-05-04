"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PropostaStatus } from "@prisma/client";

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

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h1 className="h1">Gestão de Propostas e Avaliações</h1>
          <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="lei-banner">
            📋 <strong>Lei</strong>
          </a>
        </div>
        
        <div className="row" style={{ marginBottom: 20 }}>
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

        {loading ? (
          <p className="p">Carregando propostas...</p>
        ) : propostas.length === 0 ? (
          <p className="p">Nenhuma proposta encontrada.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "10px" }}>ID</th>
                  <th style={{ padding: "10px" }}>Proponente</th>
                  <th style={{ padding: "10px" }}>Edital (Modalidade)</th>
                  <th style={{ padding: "10px" }}>Status</th>
                  <th style={{ padding: "10px" }}>Equipe / Marcos</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {propostas.map((prop) => (
                  <tr key={prop.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px", fontFamily: "monospace", fontSize: 12 }}>
                      {prop.id.split("-")[0]}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <strong>{prop.proponente.nome}</strong><br/>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{prop.proponente.cpf}</span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      {prop.edital.titulo}<br/>
                      <span className="badge">{prop.edital.modalidade}</span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span className="badge">{prop.status}</span>
                    </td>
                    <td style={{ padding: "10px", fontSize: 13 }}>
                      👤 {prop._count.equipe} membro(s)<br/>
                      📅 {prop._count.marcos} mês(es)
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      <Link href={`/admin/propostas/${prop.id}`} className="btn secondary">
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
