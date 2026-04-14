"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
};

export default function TransparenciaPage() {
  const [projetos, setProjetos] = useState<ProjetoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"ALL" | "APROVADA" | "EM_EXECUCAO" | "CONCLUIDA" | "REPROVADA">("APROVADA");

  useEffect(() => {
    fetch("/api/transparencia")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setProjetos(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = projetos.filter((p) => {
    if (filtro === "ALL") return true;
    if (filtro === "REPROVADA") return ["CANCELADA", "SUSPENSA"].includes(p.status);
    if (filtro === "APROVADA") return ["CLASSIFICADA", "HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO", "CONCLUIDA"].includes(p.status);
    if (filtro === "EM_EXECUCAO") return p.status === "EM_EXECUCAO";
    if (filtro === "CONCLUIDA") return p.status === "CONCLUIDA";
    return true;
  });

  const totalAprovados = projetos.filter((p) => ["CLASSIFICADA", "HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO", "CONCLUIDA"].includes(p.status)).length;
  const totalReprovados = projetos.filter((p) => ["CANCELADA", "SUSPENSA"].includes(p.status)).length;

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* Header */}
      <div className="card" style={{ textAlign: "center", padding: 30 }}>
        <h1 className="h1" style={{ fontSize: 24 }}>📊 Portal de Transparência – ProInova Jaborandi</h1>
        <p className="p" style={{ marginTop: 10, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Acompanhe em tempo real os projetos submetidos e aprovados ou reprovados pela municipalidade, com os referidos pareceres.
          Conforme Art. 19 e 20 da Lei Municipal.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid two" style={{ gap: 14 }}>
        <div 
          className="card" 
          style={{ textAlign: "center", padding: 20, cursor: "pointer", border: filtro === "ALL" ? "2px solid var(--accent)" : "2px solid transparent" }}
          onClick={() => setFiltro("ALL")}
        >
          <div style={{ fontSize: 36, fontWeight: "bold", color: "var(--accent)" }}>{projetos.length}</div>
          <div className="p" style={{ margin: 0 }}>Total de Projetos Computados</div>
        </div>
        <div className="grid two" style={{ gap: 14 }}>
          <div 
            className="card" 
            style={{ textAlign: "center", padding: 20, cursor: "pointer", border: filtro === "APROVADA" ? "2px solid var(--good)" : "2px solid transparent" }}
            onClick={() => setFiltro("APROVADA")}
          >
            <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--good)" }}>{totalAprovados}</div>
            <div className="p" style={{ margin: 0 }}>Aprovados</div>
          </div>
          <div 
            className="card" 
            style={{ textAlign: "center", padding: 20, cursor: "pointer", border: filtro === "REPROVADA" ? "2px solid var(--bad)" : "2px solid transparent" }}
            onClick={() => setFiltro("REPROVADA")}
          >
            <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--bad)" }}>{totalReprovados}</div>
            <div className="p" style={{ margin: 0 }}>Reprovados</div>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="card" style={{ padding: 14 }}>
        <div className="row">
          <div className="label">Filtrar por Status</div>
          <select className="select" value={filtro} onChange={(e) => setFiltro(e.target.value as any)}>
            <option value="ALL">Todos os Projetos</option>
            <option value="APROVADA">✅ Todos os Aprovados (Em trâmite ou execução)</option>
            <option value="EM_EXECUCAO">⚙️ Apenas Em Execução</option>
            <option value="CONCLUIDA">🏁 Apenas Concluídos</option>
            <option value="REPROVADA">❌ Projetos Reprovados / Cancelados</option>
          </select>
        </div>
      </div>

      {/* Lista de Projetos */}
      {loading ? (
        <div className="card"><p className="p">Carregando projetos...</p></div>
      ) : filtered.length === 0 ? (
        <div className="card"><p className="p">Nenhum projeto público encontrado neste filtro.</p></div>
      ) : (
        filtered.map((p) => {
          const isReprovado = ["CANCELADA", "SUSPENSA"].includes(p.status);
          const isConcluido = p.status === "CONCLUIDA";
          const isExecucao = p.status === "EM_EXECUCAO";
          
          let displayStatus = "";
          let badgeClass = "badge";
          if (isReprovado) {
             displayStatus = "❌ Reprovado/Cancelado";
             badgeClass = "badge bg-bad text-white";
          } else if (isExecucao) {
             displayStatus = "⚙️ Em Execução";
             badgeClass = "badge bg-primary text-white";
          } else if (isConcluido) {
             displayStatus = "🏁 Concluído";
             badgeClass = "badge bg-good text-white";
          } else {
             displayStatus = "✅ Aprovado (Em Trâmite Pré-Execução)";
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

              {/* Escopo Completo Ocultável */}
              <details style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: "bold", color: "var(--accent)", outline: "none" }}>
                  👀 Ver Escopo Completo do Projeto {p.sigiloso ? "(Restrito)" : ""}
                </summary>
                
                <div style={{ marginTop: 14, gap: 14, display: "flex", flexDirection: "column" }}>
                  <div>
                    <strong style={{ fontSize: 13 }}>Resumo:</strong>
                    <p className="p" style={{ fontSize: 13, marginTop: 4 }}>{p.resumo}</p>
                  </div>
                  
                  <div>
                    <strong style={{ fontSize: 13 }}>O Problema:</strong>
                    <p className="p" style={{ fontSize: 13, marginTop: 4 }}>{p.problema}</p>
                  </div>
                  
                  <div>
                    <strong style={{ fontSize: 13 }}>Proposta de Valor:</strong>
                    <p className="p" style={{ fontSize: 13, marginTop: 4 }}>{p.propostaValor}</p>
                  </div>
                  
                  <div>
                    <strong style={{ fontSize: 13 }}>Indicadores:</strong>
                    <p className="p" style={{ fontSize: 13, marginTop: 4 }}>{p.indicadores}</p>
                  </div>
                  
                  <div>
                    <strong style={{ fontSize: 13 }}>Histórico da Equipe:</strong>
                    <p className="p" style={{ fontSize: 13, marginTop: 4 }}>{p.historicoEquipe}</p>
                  </div>

                  {/* Parecer da IA (no fim) */}
                  {p.aiFeedback && (
                    <div style={{ marginTop: 10, padding: 14, background: "rgba(10, 20, 50, 0.4)", borderRadius: 6, borderLeft: "4px solid #8e24aa" }}>
                      <div style={{ fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#e1bee7" }}>🤖 ANÁLISE PRÉVIA DA IA</span>
                        <span style={{ color: "#e1bee7" }}>SCORE: {p.aiScore}/10</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text)", whiteSpace: "pre-wrap" }}>
                        {p.aiFeedback}
                      </div>
                    </div>
                  )}
                </div>
              </details>

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
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <Link href={`/projeto/${p.id}`} className="btn secondary" style={{ fontSize: 12, padding: "6px 12px" }}>
                      Ver Evidências do Projeto
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
    </div>
  );
}
