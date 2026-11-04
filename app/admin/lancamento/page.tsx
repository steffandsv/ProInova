"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useUrlState } from "@/app/hooks/useUrlState";
import { EmptyState, ErrorState, FilterGroup, Filters, LeiLink, PageHeader, SearchInput, normalize } from "@/app/components/ui";
import { ListPageSkeleton, TableSkeleton, type SkeletonColumn } from "@/app/components/Skeletons";

type Inscricao = {
  id: string;
  cpf: string;
  nome: string;
  idade: number | null;
  createdAt: string;
};

const columns: SkeletonColumn[] = [
  { label: "#", width: "6%", cell: "short" },
  { label: "Nome", width: "34%", cell: "text" },
  { label: "CPF", width: "20%", cell: "short" },
  { label: "Idade", width: "12%", cell: "short" },
  { label: "Data da Inscrição", width: "28%", cell: "text" },
];

function formatCpfDisplay(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminLancamentoPage() {
  return (
    <Suspense fallback={<ListPageSkeleton columns={columns} chips={0} />}>
      <AdminLancamentoInner />
    </Suspense>
  );
}

function AdminLancamentoInner() {
  const [busca, setBusca] = useUrlState("q");
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/lancamento");
      const json = await res.json().catch(() => ({}));
      if (res.ok) setInscricoes(json.data || []);
      else setErro(json.message || "Não foi possível carregar as inscrições.");
    } catch {
      setErro("Falha de rede ao carregar as inscrições.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtradas = inscricoes.filter((i) => normalize(i.nome).includes(normalize(busca)));

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <PageHeader
          title="Inscrições no Lançamento"
          subtitle="Pessoas que confirmaram presença no lançamento do ProInova — sábado, 21/03/2026, às 9h, no C.TECH."
          actions={
            <>
              <div className="badge" style={{ fontSize: 14, padding: "8px 16px" }}>
                <strong>{loading ? "…" : inscricoes.length}</strong> inscritos
              </div>
              <LeiLink />
            </>
          }
        />

        <Filters>
          <FilterGroup label="Buscar por Nome">
            <SearchInput value={busca} onChange={(v) => setBusca(v, { replace: true })} placeholder="Digite o nome da pessoa inscrita..." />
          </FilterGroup>
        </Filters>

        {erro && <ErrorState message={erro} onRetry={carregar} />}

        {loading ? (
          <TableSkeleton columns={columns} />
        ) : erro ? null : filtradas.length === 0 ? (
          <EmptyState>{inscricoes.length === 0 ? "Nenhuma inscrição registrada ainda." : "Nenhuma inscrição encontrada com esse nome."}</EmptyState>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Idade</th>
                  <th>Data da Inscrição</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((insc, idx) => (
                  <tr key={insc.id}>
                    <td className="sub" style={{ fontSize: 13 }}>{idx + 1}</td>
                    <td><strong>{insc.nome}</strong></td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{formatCpfDisplay(insc.cpf)}</td>
                    <td>{insc.idade != null ? `${insc.idade} anos` : "—"}</td>
                    <td className="sub" style={{ fontSize: 13 }}>{formatDate(insc.createdAt)}</td>
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
