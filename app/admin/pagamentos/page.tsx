"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { modalidadeLabelMap } from "@/constants/status";
import { useUrlState } from "@/app/hooks/useUrlState";
import { EmptyState, ErrorState, FilterChips, FilterGroup, Filters, LeiLink, PageHeader, SearchInput, StatCard, normalize } from "@/app/components/ui";
import { ListPageSkeleton, StatsSkeleton, TableSkeleton, type SkeletonColumn } from "@/app/components/Skeletons";
import ModalRecibos from "./ModalRecibos";

type Rateio = { nome: string; cpf: string; percentual: number; valor: number };
type ItemLote = {
  marcoId: string;
  mes: number;
  entregavel: string;
  validadoEm: string | null;
  propostaTitulo: string;
  modalidade: string;
  proponente: string;
  cpfProponente: string;
  valorMensal: number;
  rateio: Rateio[];
};

const modalidadeOptions = [
  { value: "ALL", label: "Todas" },
  { value: "EDUCACAO", label: "📚 Educação" },
  { value: "GERAL", label: "🏛️ Geral" },
];

const columns: SkeletonColumn[] = [
  { label: "Proposta", width: "28%", cell: "two" },
  { label: "Mês", width: "6%", align: "center", cell: "short" },
  { label: "Entregável", width: "28%", cell: "text" },
  { label: "Modalidade", width: "12%", align: "center", cell: "short" },
  { label: "Valor Mensal (R$)", width: "14%", align: "right", cell: "short" },
  { label: "Validado Em", width: "12%", align: "center", cell: "short" },
];

const reais = (valor: number) => valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminPagamentosPage() {
  return (
    <Suspense fallback={<ListPageSkeleton columns={columns} chips={3} />}>
      <AdminPagamentosInner />
    </Suspense>
  );
}

function AdminPagamentosInner() {
  const [modalidadeFilter, setModalidadeFilter] = useUrlState("modalidade", "ALL");
  const [busca, setBusca] = useUrlState("q");

  const [itens, setItens] = useState<ItemLote[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalRecibos, setModalRecibos] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/pagamentos");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) setItens(json.data || []);
      else setErro(json.error || json.message || "Não foi possível carregar os dados de pagamento.");
    } catch {
      setErro("Falha de rede ao carregar os dados de pagamento.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const termo = normalize(busca);
  const filtrados = itens.filter(
    (i) =>
      (modalidadeFilter === "ALL" || i.modalidade === modalidadeFilter) &&
      (normalize(i.propostaTitulo).includes(termo) || normalize(i.proponente).includes(termo))
  );
  const filtrando = modalidadeFilter !== "ALL" || busca !== "";
  const valorFiltrado = filtrados.reduce((acc, i) => acc + i.valorMensal, 0);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <PageHeader
          title="Gestão de Pagamentos"
          subtitle="Marcos validados e aptos para o lote financeiro."
          actions={
            <>
              <button type="button" className="btn" onClick={() => setModalRecibos(true)}>
                📄 Recibos das últimas entregas
              </button>
              <a href="/api/admin/pagamentos?format=csv" className="btn secondary" download>
                📥 Exportar CSV (Lote Financeiro)
              </a>
              <LeiLink />
            </>
          }
        />

        <Filters>
          <FilterGroup label="Filtrar por Modalidade">
            <FilterChips options={modalidadeOptions} value={modalidadeFilter} onChange={(v) => setModalidadeFilter(v)} />
          </FilterGroup>
          <FilterGroup label="Buscar por Proposta ou Proponente">
            <SearchInput value={busca} onChange={(v) => setBusca(v, { replace: true })} placeholder="Digite o título da proposta ou o nome do proponente..." />
          </FilterGroup>
        </Filters>

        {erro && <ErrorState message={erro} onRetry={carregar} />}

        {loading ? (
          <div className="grid" style={{ gap: 14 }}>
            <StatsSkeleton count={2} />
            <TableSkeleton columns={columns} />
          </div>
        ) : erro ? null : (
          <div className="grid" style={{ gap: 14 }}>
            <div className="stats-grid">
              <StatCard value={filtrados.length} label={filtrando ? `Marcos aptos (filtrados de ${itens.length})` : "Marcos Validados (Aptos)"} />
              <StatCard value={`R$ ${reais(valorFiltrado)}`} label={filtrando ? "Valor elegível dos filtrados" : "Valor Total Elegível"} color="var(--good)" />
            </div>

            {filtrados.length === 0 ? (
              <EmptyState>{itens.length === 0 ? "Nenhum marco validado pendente de pagamento." : "Nenhum marco encontrado com esses filtros."}</EmptyState>
            ) : (
              <>
                <div className="data-table-wrap">
                  <table className="data-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Proposta</th>
                        <th className="center">Mês</th>
                        <th>Entregável</th>
                        <th className="center">Modalidade</th>
                        <th className="num">Valor Mensal (R$)</th>
                        <th className="center">Validado Em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((item) => (
                        <tr key={item.marcoId}>
                          <td>
                            <strong>{item.propostaTitulo}</strong><br />
                            <span className="sub">{item.proponente} ({item.cpfProponente})</span>
                          </td>
                          <td className="center">{item.mes}</td>
                          <td className="wrap">{item.entregavel}</td>
                          <td className="center"><span className="badge">{modalidadeLabelMap[item.modalidade] || item.modalidade}</span></td>
                          <td className="num" style={{ fontWeight: 700 }}>{reais(item.valorMensal)}</td>
                          <td className="center" style={{ fontSize: 12 }}>
                            {item.validadoEm ? new Date(item.validadoEm).toLocaleDateString("pt-BR") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="num">Total{filtrando ? " filtrado" : ""}:</td>
                        <td className="num" style={{ fontSize: 15, color: "var(--good)" }}>R$ {reais(valorFiltrado)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <details>
                  <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14, padding: "6px 2px" }}>
                    📋 Ver Detalhamento do Rateio por Membro
                  </summary>
                  <div className="data-table-wrap" style={{ marginTop: 10 }}>
                    <table className="data-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>Proposta</th>
                          <th className="center">Mês</th>
                          <th>Membro</th>
                          <th>CPF</th>
                          <th className="center">% Rateio</th>
                          <th className="num">Valor (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtrados.flatMap((item) =>
                          item.rateio.map((r, idx) => (
                            <tr key={`${item.marcoId}-${idx}`}>
                              <td>{item.propostaTitulo}</td>
                              <td className="center">{item.mes}</td>
                              <td>{r.nome}</td>
                              <td>{r.cpf}</td>
                              <td className="center">{r.percentual}%</td>
                              <td className="num">{reais(r.valor)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            )}
          </div>
        )}
      </div>

      {modalRecibos && <ModalRecibos onClose={() => setModalRecibos(false)} />}
    </div>
  );
}
