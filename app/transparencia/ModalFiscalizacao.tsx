"use client";

import { useEffect, useState } from "react";

type ModalFiscalizacaoProps = {
  id: string;
  onClose: () => void;
};

export default function ModalFiscalizacao({ id, onClose }: ModalFiscalizacaoProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/projeto/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.data);
        else setError(res.error || "Erro ao carregar dados de fiscalização.");
        setLoading(false);
      })
      .catch(() => {
        setError("Falha ao conectar com o servidor.");
        setLoading(false);
      });
  }, [id]);

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PENDENTE: { label: "⏳ Pendente de Envio", bg: "rgba(255,255,255,0.05)", color: "var(--muted)" },
    SUBMETIDO: { label: "📤 Enviado / Em Análise", bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" },
    VALIDADO: { label: "✅ Validado (Aprovado)", bg: "rgba(34, 197, 94, 0.15)", color: "var(--good)" },
    AJUSTE_SOLICITADO: { label: "🔄 Ajuste Solicitado", bg: "rgba(245, 158, 11, 0.15)", color: "var(--warn)" },
    REJEITADO: { label: "❌ Rejeitado", bg: "rgba(239, 68, 68, 0.15)", color: "var(--bad)" },
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(10,15,20,0.85)",
      zIndex: 9999,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backdropFilter: "blur(8px)"
    }}>
      <div className="card" style={{
        width: "100%", maxWidth: 800,
        height: "100%", maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        padding: 0,
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        border: "1px solid var(--border)"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.02)"
        }}>
          <div>
            <h2 className="h2" style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
              🔍 Prestação de Contas & Fiscalização
            </h2>
            {data && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
                {data.titulo}
              </p>
            )}
          </div>
          <button 
            className="btn secondary" 
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13 }}
          >
            Fechar (X)
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }} className="grid">
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p className="p">Carregando histórico e provas públicas...</p>
            </div>
          )}
          
          {error && (
            <div style={{ padding: 14, borderColor: "var(--bad)", borderStyle: "solid", borderWidth: 1, borderRadius: 10, background: "rgba(239,68,68,0.05)" }}>
              <p className="p" style={{ color: "var(--bad)", margin: 0 }}>{error}</p>
            </div>
          )}

          {data && (
            <div className="grid" style={{ gap: 20 }}>
              
              {/* Resumo do Progresso */}
              <div className="card" style={{ padding: 16, background: "rgba(255,255,255,0.01)" }}>
                <h3 style={{ fontSize: 15, margin: "0 0 10px", fontWeight: 700 }}>Marcos Consolidados</h3>
                {(() => {
                  const total = data.marcos?.length || 0;
                  const validados = data.marcos?.filter((m: any) => m.status === "VALIDADO").length || 0;
                  const pct = total > 0 ? Math.round((validados / total) * 100) : 0;
                  return (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                        <span>Progresso Geral: <strong>{validados} de {total} meses</strong></span>
                        <strong>{pct}%</strong>
                      </div>
                      <div style={{ background: "var(--bg)", borderRadius: 6, overflow: "hidden", height: 10 }}>
                        <div style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, var(--accent), var(--good))",
                          borderRadius: 6,
                          transition: "width 0.5s ease"
                        }} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Lista de Entregas Mensais */}
              <div className="grid" style={{ gap: 14 }}>
                <h3 style={{ fontSize: 15, margin: "0 0 4px", fontWeight: 700 }}>Histórico de Entregas Mês a Mês</h3>
                
                {data.marcos?.length === 0 ? (
                  <p className="p" style={{ fontStyle: "italic" }}>Nenhum marco definido para este projeto.</p>
                ) : (
                  data.marcos.map((m: any) => {
                    const conf = statusConfig[m.status] || { label: m.status, bg: "transparent", color: "var(--text)" };
                    return (
                      <div key={m.id} style={{
                        padding: 16,
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.01)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                          <strong style={{ fontSize: 14 }}>Mês {m.mes}</strong>
                          <span className="badge" style={{
                            backgroundColor: conf.bg,
                            borderColor: conf.color,
                            color: conf.color,
                            fontWeight: 600,
                            padding: "4px 10px"
                          }}>
                            {conf.label}
                          </span>
                        </div>

                        <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }} className="grid">
                          <div><strong>📋 Entregável Previsto:</strong> {m.entregavel}</div>
                          <div style={{ marginTop: 4 }}><strong>🎯 Critério de Sucesso:</strong> {m.criterioAceitacao}</div>
                          {m.validadoEm && (
                            <div style={{ marginTop: 4, color: "var(--good)", fontSize: 12 }}>
                              🗓️ Validado em: {new Date(m.validadoEm).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>

                        {/* Comentário do Gestor Público */}
                        {m.comentarioCoordenacao && m.status === "VALIDADO" && (
                          <div style={{
                            marginTop: 10,
                            padding: 10,
                            background: "rgba(34, 197, 94, 0.05)",
                            borderRadius: 8,
                            borderLeft: "3px solid var(--good)",
                            fontSize: 13
                          }}>
                            <strong>Parecer da Coordenação:</strong> {m.comentarioCoordenacao}
                          </div>
                        )}

                        {/* Evidências / Provas Submetidas */}
                        {m.evidencias?.length > 0 ? (
                          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                            <strong style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 8 }}>
                              🛡️ Provas de Entrega (Evidências Públicas):
                            </strong>
                            <div className="grid" style={{ gap: 8 }}>
                              {m.evidencias.map((ev: any) => (
                                <div key={ev.id} style={{
                                  padding: 10,
                                  background: "rgba(255,255,255,0.02)",
                                  borderRadius: 8,
                                  fontSize: 13,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 10,
                                  border: "1px solid var(--border)"
                                }}>
                                  <div>
                                    <span className="badge">{ev.tipo}</span>
                                    <span style={{ marginLeft: 8, color: "var(--text)" }}>{ev.descricao}</span>
                                  </div>
                                  {ev.url && (
                                    <a 
                                      href={ev.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="btn secondary"
                                      style={{ padding: "6px 12px", fontSize: 12, borderColor: "var(--accent)", color: "#a78bfa" }}
                                    >
                                      🔗 Acessar Prova
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          m.status !== "PENDENTE" && (
                            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                              Nenhuma evidência pública liberada para este mês.
                            </div>
                          )
                        )}

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
