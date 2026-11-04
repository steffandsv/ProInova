"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ModalProjeto from "./ModalProjeto";
import ModalFiscalizacao from "./ModalFiscalizacao";
import { useUrlState } from "@/app/hooks/useUrlState";
import { EmptyState, ErrorState, FilterChips, FilterGroup, Filters, LeiLink, PageHeader, SearchInput, StatCard, normalize } from "@/app/components/ui";
import { CardsSkeleton, StatsSkeleton } from "@/app/components/Skeletons";

const filtroOptions = [
  { value: "ALL", label: "✨ Todos" },
  { value: "APROVADA", label: "✅ Aprovados" },
  { value: "EM_EXECUCAO", label: "⚙️ Em Execução" },
  { value: "CONCLUIDA", label: "🏁 Concluídos" },
  { value: "REPROVADA", label: "❌ Reprovados / Cancelados" },
  { value: "DILIGENCIA", label: "🔄 Em Diligência" },
];

function TransparenciaSkeleton() {
  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="skeleton-line skeleton-title" style={{ width: "45%" }} />
        <div className="skeleton-line" style={{ width: "70%", marginBottom: 22 }} />
        <StatsSkeleton count={4} />
      </div>
      <CardsSkeleton count={3} single />
    </div>
  );
}

type ProjetoPublico = {
  id: string;
  titulo: string;
  resumo: string;
  modalidade: string;
  status: string;
  linhaTematica: string;
  duracaoMeses: number;
  proponente: string;
  edital: string;
  totalMarcos: number;
  marcosValidados: number;
  progresso: number;
  createdAt: string;
  parecer: string | null;
  sigiloso?: boolean;
  isDiligencia?: boolean;
};

export default function TransparenciaPage() {
  return (
    <Suspense fallback={<TransparenciaSkeleton />}>
      <TransparenciaInner />
    </Suspense>
  );
}

function TransparenciaInner() {
  const [projetos, setProjetos] = useState<ProjetoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useUrlState("filtro", "APROVADA");
  const [busca, setBusca] = useUrlState("q");
  const [modalApp, setModalApp] = useState<string | null>(null);
  const [modalFiscalizacao, setModalFiscalizacao] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/transparencia");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) setProjetos(json.data);
      else setErro("Não foi possível carregar os projetos.");
    } catch {
      setErro("Falha de rede ao carregar os projetos.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const termo = normalize(busca);
  const filtered = projetos.filter((p) => {
    if (termo && !normalize(p.titulo).includes(termo) && !normalize(p.proponente).includes(termo)) return false;
    if (filtro === "ALL") return true;
    if (filtro === "REPROVADA") return ["CANCELADA", "SUSPENSA"].includes(p.status) && !p.isDiligencia;
    if (filtro === "DILIGENCIA") return p.isDiligencia === true;
    if (filtro === "APROVADA") return ["CLASSIFICADA", "HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO", "CONCLUIDA"].includes(p.status);
    if (filtro === "EM_EXECUCAO") return p.status === "EM_EXECUCAO";
    if (filtro === "CONCLUIDA") return p.status === "CONCLUIDA";
    return true;
  });

  const totalAprovados = projetos.filter((p) => ["CLASSIFICADA", "HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO", "CONCLUIDA"].includes(p.status)).length;
  const totalReprovados = projetos.filter((p) => ["CANCELADA", "SUSPENSA"].includes(p.status) && !p.isDiligencia).length;
  const totalDiligencia = projetos.filter((p) => p.isDiligencia === true).length;

  if (loading) return <TransparenciaSkeleton />;

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* Cabeçalho, números e filtros */}
      <div className="card">
        <PageHeader
          title="Portal de Transparência"
          subtitle="Acompanhe os projetos submetidos, aprovados e reprovados pela Prefeitura, com os respectivos pareceres, conforme os Arts. 19 e 20 da Lei Municipal."
          actions={<LeiLink />}
        />

        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <StatCard value={projetos.length} label="Total de projetos" active={filtro === "ALL"} onClick={() => setFiltro("ALL")} />
          <StatCard value={totalAprovados} label="Aprovados" color="var(--good)" active={filtro === "APROVADA"} onClick={() => setFiltro("APROVADA")} />
          <StatCard value={totalReprovados} label="Reprovados" color="var(--bad)" active={filtro === "REPROVADA"} onClick={() => setFiltro("REPROVADA")} />
          <StatCard value={totalDiligencia} label="Em diligência" color="var(--warn)" active={filtro === "DILIGENCIA"} onClick={() => setFiltro("DILIGENCIA")} />
        </div>

        <Filters>
          <FilterGroup label="Filtrar por Situação">
            <FilterChips options={filtroOptions} value={filtro} onChange={(v) => setFiltro(v)} />
          </FilterGroup>
          <FilterGroup label="Buscar por Projeto ou Proponente">
            <SearchInput value={busca} onChange={(v) => setBusca(v, { replace: true })} placeholder="Digite o nome do projeto ou do proponente..." />
          </FilterGroup>
        </Filters>

        {erro && <ErrorState message={erro} onRetry={carregar} />}
        {!erro && filtered.length === 0 && <EmptyState>Nenhum projeto público encontrado neste filtro.</EmptyState>}
      </div>

      {/* Lista de Projetos */}
      {erro || filtered.length === 0 ? null : (
        filtered.map((p) => {
          const isReprovado = ["CANCELADA", "SUSPENSA"].includes(p.status);
          const isConcluido = p.status === "CONCLUIDA";
          const isExecucao = p.status === "EM_EXECUCAO";
          
          let displayStatus = "";
          let badgeClass = "badge";
          if (isReprovado) {
             displayStatus = "Reprovado/Cancelado";
             badgeClass = "badge bg-bad text-white";
          } else if (isExecucao) {
             displayStatus = "Em Execução";
             badgeClass = "badge bg-primary text-white";
          } else if (isConcluido) {
             displayStatus = "Concluído";
             badgeClass = "badge bg-good text-white";
          } else {
             displayStatus = "Aprovado (Em Trâmite Pré-Execução)";
             badgeClass = "badge";
          }

          return (
            <div className="card" key={p.id} style={{ padding: 14, opacity: isReprovado ? 0.8 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 className="h2" style={{ fontSize: 17 }}>{p.titulo}</h2>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="badge">{p.modalidade}</span>
                    <span className="badge">{p.linhaTematica}</span>
                    <span className={badgeClass} style={{ fontWeight: 600 }}>{displayStatus}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 20, fontSize: 13, color: "var(--muted)", flexWrap: "wrap" }}>
                <span>👤 {p.proponente}</span>
                <span>📋 {p.edital}</span>
                <span>📅 {p.duracaoMeses} meses</span>
                <span>🗂️ Julgado em: {new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>

              {/* Parecer do Administrador (no começo) */}
              {p.parecer && (
                <div style={{ marginTop: 14, padding: 14, background: "rgba(0,0,0,0.2)", borderRadius: 6, borderLeft: "4px solid var(--accent)" }}>
                  <div style={{ fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, color: "var(--muted)" }}>
                    PARECER ADMINISTRATIVO
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text)", whiteSpace: "pre-wrap" }}>
                    {p.parecer}
                  </div>
                </div>
              )}

              {/* Escopo Completo Modal Button */}
              <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <button 
                  className="btn" 
                  onClick={() => setModalApp(p.id)} 
                  style={{ width: "100%", justifyContent: "center", fontWeight: "bold" }}
                >
                  👀 Ver Escopo Completo do Projeto {p.sigiloso ? "(Restrito)" : ""}
                </button>
              </div>

              {/* Barra de progresso (só faz sentido se não for reprovado) */}
              {!isReprovado && p.totalMarcos > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>Progresso de Execução: {p.marcosValidados}/{p.totalMarcos} marcos</span>
                    <span style={{ fontWeight: "bold" }}>{p.progresso}%</span>
                  </div>
                  <div style={{ background: "var(--bg)", borderRadius: 6, overflow: "hidden", height: 8 }}>
                    <div style={{
                      width: `${p.progresso}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, var(--accent), var(--good))",
                      borderRadius: 6,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                    <button
                      className="btn"
                      onClick={() => setModalFiscalizacao(p.id)}
                      style={{ fontSize: 12, padding: "6px 12px", background: "linear-gradient(135deg, var(--accent), #6d4aff)" }}
                    >
                      🔍 Fiscalização e Entregas
                    </button>
                    <Link href={`/projeto/${p.id}`} className="btn secondary" style={{ fontSize: 12, padding: "6px 12px" }}>
                      Ver Página Pública
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Footer */}
      <div className="card" style={{ textAlign: "center", padding: 20, fontSize: 12, color: "var(--muted)" }}>
        <p>Programa Municipal de Fomento à Inovação – ProInova Jaborandi</p>
        <p>Dados públicos conforme Art. 19 e 20. Projetos protegidos por sigilo (LGPD/Inovação) podem ter suas informações ofuscadas.</p>
      </div>

      {/* Modal Sobreposto Full */}
      {modalApp && (
        <ModalProjeto id={modalApp} onClose={() => setModalApp(null)} />
      )}

      {/* Modal de Fiscalização e Provas */}
      {modalFiscalizacao && (
        <ModalFiscalizacao id={modalFiscalizacao} onClose={() => setModalFiscalizacao(null)} />
      )}
    </div>
  );
}
