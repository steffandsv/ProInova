"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PropostaStatus } from "@prisma/client";
import { statusLabelMap, statusColors } from "@/constants/status";
import { useUrlState } from "@/app/hooks/useUrlState";
import { EmptyState, ErrorState, FilterChips, FilterGroup, Filters, LeiLink, PageHeader, SearchInput, StatusBadge, normalize } from "@/app/components/ui";
import { ListPageSkeleton, TableSkeleton, type SkeletonColumn } from "@/app/components/Skeletons";

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

const columns: SkeletonColumn[] = [
  { label: "ID", width: "10%", cell: "short" },
  { label: "Proponente", width: "25%", cell: "two" },
  { label: "Edital (Modalidade)", width: "25%", cell: "text-tag" },
  { label: "Status", width: "15%", cell: "badge" },
  { label: "Equipe / Marcos", width: "15%", cell: "meta" },
  { label: "Ações", width: "10%", align: "right", cell: "button" },
];

export default function AdminPropostasPage() {
  return (
    <Suspense fallback={<ListPageSkeleton columns={columns} chips={8} />}>
      <AdminPropostasInner />
    </Suspense>
  );
}

function AdminPropostasInner() {
  const [statusFilter, setStatusFilter] = useUrlState("status", "ALL");
  const [busca, setBusca] = useUrlState("q");

  const [propostas, setPropostas] = useState<PropostaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const fetchPropostas = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setErro("");
    let url = "/api/admin/propostas";
    if (statusFilter !== "ALL") {
      url += `?status=${statusFilter}`;
    }
    try {
      const res = await fetch(url, { signal });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPropostas([]);
        setErro(json.error || json.message || "Não foi possível carregar as propostas.");
      } else {
        setPropostas(json.data || []);
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setPropostas([]);
      setErro("Falha de rede ao carregar as propostas.");
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPropostas(controller.signal);
    return () => controller.abort();
  }, [fetchPropostas]);

  const filteredPropostas = propostas.filter((prop) => normalize(prop.proponente.nome).includes(normalize(busca)));

  return (
    <div className="grid wide-layout" style={{ gap: 14 }}>
      <div className="card">
        <PageHeader title="Gestão de Propostas e Avaliações" actions={<LeiLink />} />

        <Filters>
          <FilterGroup label="Filtrar por Etapa / Status">
            <FilterChips options={filterOptions} value={statusFilter} onChange={(v) => setStatusFilter(v)} />
          </FilterGroup>

          <FilterGroup label="Buscar por Nome do Proponente">
            <SearchInput value={busca} onChange={(v) => setBusca(v, { replace: true })} placeholder="Digite o nome do proponente..." />
          </FilterGroup>
        </Filters>

        {erro && <ErrorState message={erro} onRetry={() => fetchPropostas()} />}

        {loading ? (
          <TableSkeleton columns={columns} />
        ) : erro ? null : filteredPropostas.length === 0 ? (
          <EmptyState>Nenhuma proposta encontrada.</EmptyState>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Proponente</th>
                  <th>Edital (Modalidade)</th>
                  <th>Status</th>
                  <th>Equipe / Marcos</th>
                  <th className="num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPropostas.map((prop) => (
                  <tr key={prop.id}>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
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
                    <td>
                      <strong>{prop.proponente.nome}</strong><br/>
                      <span className="sub">{prop.proponente.cpf}</span>
                    </td>
                    <td>
                      {prop.edital.titulo}<br/>
                      <span className="badge tag">{prop.edital.modalidade}</span>
                    </td>
                    <td>
                      <StatusBadge label={statusLabelMap[prop.status] || prop.status} color={statusColors[prop.status]} />
                    </td>
                    <td style={{ fontSize: 13 }}>
                      👤 {prop._count.equipe} membro(s)<br/>
                      📅 {prop._count.marcos} mês(es)
                    </td>
                    <td className="num">
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
