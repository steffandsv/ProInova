"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { EditalStatus, Modalidade } from "@prisma/client";
import { editalStatusColors, editalStatusLabelMap, modalidadeLabelMap } from "@/constants/status";
import { useUrlState } from "@/app/hooks/useUrlState";
import { EmptyState, ErrorState, FilterChips, FilterGroup, Filters, LeiLink, PageHeader, SearchInput, StatusBadge, normalize } from "@/app/components/ui";
import { ListPageSkeleton, TableSkeleton, type SkeletonColumn } from "@/app/components/Skeletons";

type Edital = {
  id: string;
  titulo: string;
  descricao: string;
  modalidade: Modalidade;
  status: EditalStatus;
  abreEm: string;
  fechaEm: string;
};

const statusOptions = [
  { value: "ALL", label: "✨ Todos" },
  { value: "ABERTO", label: "🟢 Abertos" },
  { value: "RASCUNHO", label: "📝 Rascunhos" },
  { value: "ENCERRADO", label: "🔒 Encerrados" },
];

const modalidadeOptions = [
  { value: "ALL", label: "Todas" },
  { value: "EDUCACAO", label: "📚 Educação" },
  { value: "GERAL", label: "🏛️ Geral" },
];

const columns: SkeletonColumn[] = [
  { label: "Edital", width: "40%", cell: "two" },
  { label: "Modalidade", width: "15%", cell: "short" },
  { label: "Status", width: "15%", cell: "badge" },
  { label: "Período", width: "20%", cell: "meta" },
  { label: "Ações", width: "10%", align: "right", cell: "button" },
];

const dataCurta = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export default function EditaisListPage() {
  return (
    <Suspense fallback={<ListPageSkeleton columns={columns} />}>
      <EditaisListInner />
    </Suspense>
  );
}

function EditaisListInner() {
  const [statusFilter, setStatusFilter] = useUrlState("status", "ALL");
  const [modalidadeFilter, setModalidadeFilter] = useUrlState("modalidade", "ALL");
  const [busca, setBusca] = useUrlState("q");

  const [editais, setEditais] = useState<Edital[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/editais");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) setEditais(json.data);
      else setErro(json.message || "Não foi possível carregar os editais.");
    } catch {
      setErro("Falha de rede ao carregar os editais.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = editais.filter(
    (e) =>
      (statusFilter === "ALL" || e.status === statusFilter) &&
      (modalidadeFilter === "ALL" || e.modalidade === modalidadeFilter) &&
      normalize(e.titulo).includes(normalize(busca))
  );

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <PageHeader
          title="Editais"
          subtitle="Gestão dos editais de fomento à inovação."
          actions={
            <>
              <Link href="/admin/editais/novo" className="btn">Novo Edital</Link>
              <LeiLink />
            </>
          }
        />

        <Filters>
          <FilterGroup label="Filtrar por Status">
            <FilterChips options={statusOptions} value={statusFilter} onChange={(v) => setStatusFilter(v)} />
          </FilterGroup>
          <FilterGroup label="Filtrar por Modalidade">
            <FilterChips options={modalidadeOptions} value={modalidadeFilter} onChange={(v) => setModalidadeFilter(v)} />
          </FilterGroup>
          <FilterGroup label="Buscar por Título">
            <SearchInput value={busca} onChange={(v) => setBusca(v, { replace: true })} placeholder="Digite o título do edital..." />
          </FilterGroup>
        </Filters>

        {erro && <ErrorState message={erro} onRetry={carregar} />}

        {loading ? (
          <TableSkeleton columns={columns} rows={3} />
        ) : erro ? null : filtrados.length === 0 ? (
          <EmptyState>{editais.length === 0 ? "Nenhum edital cadastrado." : "Nenhum edital encontrado com esses filtros."}</EmptyState>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Edital</th>
                  <th>Modalidade</th>
                  <th>Status</th>
                  <th>Período</th>
                  <th className="num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((edital) => (
                  <tr key={edital.id}>
                    <td className="wrap">
                      <strong>{edital.titulo}</strong><br />
                      <span className="sub">{edital.descricao.length > 110 ? `${edital.descricao.slice(0, 110)}…` : edital.descricao}</span>
                    </td>
                    <td>
                      <span className="badge">{modalidadeLabelMap[edital.modalidade] || edital.modalidade}</span>
                    </td>
                    <td>
                      <StatusBadge label={editalStatusLabelMap[edital.status] || edital.status} color={editalStatusColors[edital.status]} />
                    </td>
                    <td style={{ fontSize: 13 }}>
                      Abre: {dataCurta(edital.abreEm)}<br />
                      Fecha: {dataCurta(edital.fechaEm)}
                    </td>
                    <td className="num">
                      <Link href={`/admin/editais/${edital.id}`} className="btn secondary chip">
                        Editar
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
