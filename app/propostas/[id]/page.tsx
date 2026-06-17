"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  statusLabelMap,
  marcoStatusLabelMap,
  marcoAcaoLabelMap,
} from "@/constants/status";

const buttonStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 650,
  padding: "10px 18px",
  borderRadius: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  height: "auto",
};

const smallButtonStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: "10px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  height: "auto",
};

const formatStatusText = (text: string | null | undefined): string => {
  if (!text) return "";
  let formatted = text;
  Object.entries(statusLabelMap).forEach(([key, val]) => {
    formatted = formatted.replaceAll(key, val);
  });
  Object.entries(marcoStatusLabelMap).forEach(([key, val]) => {
    formatted = formatted.replaceAll(key, val);
  });
  return formatted;
};

export default function PropostaMarcosPage({ params }: { params: { id: string } }) {
  const [proposta, setProposta] = useState<any>(null);
  const [marcos, setMarcos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentDay = new Date().getDate();
  const ignorarPrazos = proposta?.edital?.config?.ignorarPrazosMarcos ?? false;
  const isSubmissionClosed = ignorarPrazos ? false : (currentDay > 15);
  const isInitialClosed = ignorarPrazos ? false : (currentDay > 5);

  // Form state for evidence submission
  const [activeMarcoId, setActiveMarcoId] = useState<string | null>(null);
  const [editingEvidenciaId, setEditingEvidenciaId] = useState<string | null>(null);
  const [evidTipo, setEvidTipo] = useState("LINK");
  const [evidUrl, setEvidUrl] = useState("");
  const [evidDesc, setEvidDesc] = useState("");
  const [evidPublica, setEvidPublica] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/propostas/${params.id}/marcos`);
      const json = await res.json();
      if (json.ok) {
        setProposta(json.proposta);
        setMarcos(json.data);
      } else {
        setError(json.error || "Erro ao carregar marcos");
      }
    } catch {
      setError("Falha de rede");
    }
    setLoading(false);
  }

  function handleStartEdit(marcoId: string, ev: any) {
    setActiveMarcoId(marcoId);
    setEditingEvidenciaId(ev.id);
    setEvidTipo(ev.tipo);
    setEvidUrl(ev.url || "");
    setEvidDesc(ev.descricao);
    setEvidPublica(ev.publica);
  }

  function handleCancelForm() {
    setActiveMarcoId(null);
    setEditingEvidenciaId(null);
    setEvidTipo("LINK");
    setEvidUrl("");
    setEvidDesc("");
    setEvidPublica(true);
  }

  async function submitEvidencia() {
    if (!activeMarcoId || !evidDesc) return;
    setSubmitting(true);
    try {
      const isEditing = !!editingEvidenciaId;
      const res = await fetch(`/api/propostas/${params.id}/marcos`, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marcoId: activeMarcoId,
          evidenciaId: editingEvidenciaId,
          tipo: evidTipo,
          url: evidUrl || null,
          descricao: evidDesc,
          publica: evidPublica,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        handleCancelForm();
        fetchData();
      } else {
        alert(json.message || "Erro ao salvar evidência");
      }
    } catch {
      alert("Falha de rede");
    }
    setSubmitting(false);
  }

  async function handleDeleteEvidencia(evidenciaId: string) {
    if (!confirm("Tem certeza que deseja anular/excluir este envio de evidência? O status do marco voltará a ser Pendente caso não reste nenhuma evidência.")) {
      return;
    }
    try {
      const res = await fetch(`/api/propostas/${params.id}/marcos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenciaId }),
      });
      const json = await res.json();
      if (json.ok) {
        fetchData();
      } else {
        alert(json.message || "Erro ao excluir evidência");
      }
    } catch {
      alert("Falha de rede");
    }
  }

  const statusIcon: Record<string, string> = {
    PENDENTE: "⏳",
    SUBMETIDO: "📤",
    VALIDADO: "✅",
    AJUSTE_SOLICITADO: "🔄",
    REJEITADO: "❌",
  };

  if (loading) return <div className="card"><p className="p">Carregando marcos...</p></div>;
  if (error) return <div className="card"><p className="p" style={{ color: "var(--bad)" }}>{error}</p></div>;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
          <Link href="/painel" className="btn secondary" style={buttonStyle}>Voltar ao Painel</Link>
          <h1 className="h1">Meus Marcos – {proposta?.titulo}</h1>
        </div>
        {proposta?.status && (
          <span className="badge" style={{ padding: "6px 12px", fontSize: 13, fontWeight: "bold", backgroundColor: "var(--accent)", color: "#fff" }}>
            Status do Projeto: {statusLabelMap[proposta.status] || proposta.status}
          </span>
        )}
      </div>

      <p className="p">
        Submeta evidências mês a mês. O coordenador irá Validar, Solicitar Ajuste ou Rejeitar cada marco.
        Marcos validados habilitam o pagamento da bolsa correspondente.
      </p>

      <div className="card" style={{ background: "rgba(255,255,255,0.02)", borderColor: "var(--border)", padding: 14, fontSize: 13, lineHeight: 1.6 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 14 }}>📅 Calendário Mensal de Entregas e Avaliações</h3>
        {ignorarPrazos ? (
          <div style={{ padding: "8px 12px", background: "rgba(16,185,129,0.1)", border: "1px solid var(--good)", borderRadius: 8, color: "var(--good)", fontWeight: "bold", marginTop: 8 }}>
            ⚙️ Regras de Prazos Desativadas: A coordenação desativou as regras de calendário para este edital. Envio, reenvio e exclusão de evidências estão liberados em qualquer dia do mês para fins de testes/execução flexível.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "var(--muted)" }}>
              <div>• <strong>Dia 01 ao Dia 05:</strong> Envio da evidência inicial (marcos Pendentes). {isInitialClosed ? <span style={{ color: "var(--bad)", fontWeight: "bold" }}>❌ Encerrado</span> : <span style={{ color: "var(--good)", fontWeight: "bold" }}>🟢 Aberto</span>}</div>
              <div>• <strong>Dia 06 ao Dia 15:</strong> Reenvio de correções (marcos com Ajuste Solicitado). {isSubmissionClosed ? <span style={{ color: "var(--bad)", fontWeight: "bold" }}>❌ Encerrado</span> : <span style={{ color: "var(--good)", fontWeight: "bold" }}>🟢 Aberto</span>}</div>
              <div>• <strong>Dia 16 ao Dia 20:</strong> Período exclusivo de avaliação/reavaliação pela coordenação.</div>
              <div>• <strong>Dia 21 em diante:</strong> Lote de pagamento mensal fechado e processado (sem alterações).</div>
            </div>
            <div style={{ marginTop: 10, fontWeight: "bold", color: currentDay > 20 ? "var(--bad)" : currentDay > 15 ? "var(--warn)" : "var(--good)" }}>
              Hoje é dia {currentDay} do mês. Status atual: {currentDay > 20 ? "Folha fechada (leitura apenas)" : currentDay > 15 ? "Período exclusivo de avaliação" : "Prazo aberto para envio/ajustes"}
            </div>
          </>
        )}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 13, color: "var(--muted)" }}>
          ⚠️ <strong>Regra de Reenvio:</strong> Você terá apenas <strong>1 chance para realizar ajustes</strong> caso solicitado pela coordenação. A nota da segunda avaliação será a nota final e definitiva daquela entrega (multiplicadora do valor da bolsa).
        </div>
      </div>

      {marcos.map((m) => (
        <div className="card" key={m.id} style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: 15 }}>Mês {m.mes}</strong>
              <span className="badge" style={{ marginLeft: 10 }}>{statusIcon[m.status]} {marcoStatusLabelMap[m.status] || m.status}</span>
              {m.nota !== null && m.nota !== undefined && (
                <span 
                  className="badge" 
                  style={{ marginLeft: 8, borderColor: "var(--accent)", color: "var(--accent)", cursor: "help" }}
                  title="A nota atribuída funciona como multiplicador do valor da bolsa para o pagamento deste mês (ex: Nota 10 = 100% da bolsa; Nota 8.5 = 85%)."
                >
                  Nota: {m.nota} (Mult: {(m.nota / 10).toFixed(2)})
                </span>
              )}
            </div>
            {["PENDENTE", "AJUSTE_SOLICITADO"].includes(m.status) && (
              <button
                className="btn secondary"
                disabled={
                  (m.status === "PENDENTE" && isInitialClosed) ||
                  (m.status === "AJUSTE_SOLICITADO" && isSubmissionClosed)
                }
                style={{
                  ...buttonStyle,
                  opacity: ((m.status === "PENDENTE" && isInitialClosed) || (m.status === "AJUSTE_SOLICITADO" && isSubmissionClosed)) ? 0.5 : 1
                }}
                onClick={() => {
                  if (activeMarcoId === m.id) {
                    handleCancelForm();
                  } else {
                    setActiveMarcoId(m.id);
                  }
                }}
              >
                {activeMarcoId === m.id ? "Cancelar" : 
                 (m.status === "PENDENTE" && isInitialClosed) ? "Envio Inicial Fechado" :
                 (m.status === "AJUSTE_SOLICITADO" && isSubmissionClosed) ? "Ajuste Fechado" :
                 "Submeter Evidência"}
              </button>
            )}
          </div>

          <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
            <strong>Entregável:</strong> {m.entregavel}<br />
            <strong>Evidência Esperada:</strong> {m.evidenciaEsperada}<br />
            <strong>Critério de Aceitação:</strong> {m.criterioAceitacao}
          </div>

          {m.comentarioCoordenacao && (
            <div style={{ marginTop: 10, padding: 10, background: "rgba(255,200,0,0.05)", borderRadius: 6, borderLeft: "3px solid var(--warn)" }}>
              <strong style={{ fontSize: 12, color: "var(--warn)" }}>Feedback da Coordenação:</strong>
              <p className="p" style={{ margin: "5px 0 0" }}>{formatStatusText(m.comentarioCoordenacao)}</p>
            </div>
          )}

          {m.status === "AJUSTE_SOLICITADO" && (
            <div style={{ marginTop: 10, padding: 10, background: "rgba(245,158,11,0.08)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", fontSize: 13, color: "var(--warn)" }}>
              ⚠️ <strong>Ajustes solicitados pela coordenação:</strong> Você tem apenas <strong>1 chance para readequar as atividades e reenviar</strong> a entrega. A nota atribuída após esta reavaliação será a nota final e definitiva deste marco.
            </div>
          )}

          {/* Evidências já submetidas */}
          {m.evidencias?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <strong style={{ fontSize: 12, color: "var(--muted)" }}>Evidências Enviadas:</strong>
              {m.evidencias.map((ev: any) => {
                const typeIcon = ev.tipo === "LINK" ? "🔗" : ev.tipo === "ARQUIVO" ? "📁" : "📝";
                const dateStr = new Date(ev.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
                return (
                  <div 
                    key={ev.id} 
                    style={{ 
                      padding: "12px 16px", 
                      marginTop: 8, 
                      background: "rgba(255,255,255,0.03)", 
                      border: "1px solid rgba(255,255,255,0.08)", 
                      borderRadius: 12, 
                      fontSize: 13, 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span className="badge" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)", color: "var(--text)" }}>
                          {typeIcon} {ev.tipo}
                        </span>
                        {ev.publica ? (
                          <span className="badge" style={{ borderColor: "var(--good)", backgroundColor: "rgba(34,197,94,0.1)", color: "var(--good)" }}>
                            🌐 Pública
                          </span>
                        ) : (
                          <span className="badge" style={{ borderColor: "var(--muted)", backgroundColor: "rgba(255,255,255,0.02)", color: "var(--muted)" }}>
                            🔒 Privada
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 500, lineHeight: 1.5, color: "var(--text)", wordBreak: "break-word" }}>
                        {ev.descricao}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                        Enviado em: {dateStr}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {ev.url && (
                        <a 
                          href={ev.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn secondary"
                          style={{ 
                            ...smallButtonStyle,
                            color: "#c4b5fd", 
                            borderColor: "rgba(124,92,255,0.4)", 
                            background: "rgba(124,92,255,0.08)" 
                          }}
                        >
                          🔗 Acessar Prova
                        </a>
                      )}
                      {m.status !== "VALIDADO" && (
                        <>
                          <button
                            className="btn"
                            disabled={isSubmissionClosed}
                            style={{ 
                              ...smallButtonStyle,
                              background: "var(--bg)",
                              border: "1px solid var(--border)",
                              color: "var(--text)",
                              opacity: isSubmissionClosed ? 0.5 : 1
                            }}
                            onClick={() => handleStartEdit(m.id, ev)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn secondary"
                            disabled={isSubmissionClosed}
                            style={{ 
                              ...smallButtonStyle,
                              color: "var(--bad)", 
                              borderColor: "rgba(239, 68, 68, 0.4)",
                              background: "rgba(239, 68, 68, 0.05)",
                              opacity: isSubmissionClosed ? 0.5 : 1
                            }}
                            onClick={() => handleDeleteEvidencia(ev.id)}
                          >
                            🗑️ Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Histórico / Linha do tempo de atividades do marco */}
          {m.historico && m.historico.length > 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <strong style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 10 }}>📜 Histórico do Marco:</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 8, borderLeft: "2px solid rgba(255, 255, 255, 0.08)" }}>
                {m.historico.map((h: any) => {
                  const dataOcorrencia = new Date(h.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
                  const badgeColor = h.acao === "VALIDACAO" ? "var(--good)" : 
                                     h.acao === "REJEICAO" ? "var(--bad)" : 
                                     h.acao === "SOLICITACAO_AJUSTE" ? "var(--warn)" : "var(--accent)";
                  return (
                    <div key={h.id} style={{ fontSize: 12, lineHeight: 1.4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ color: "var(--muted)", fontWeight: "bold" }}>{dataOcorrencia}</span>
                        <span style={{ color: "var(--text)" }}>—</span>
                        <span className="badge" style={{ fontSize: 10, padding: "2px 6px", borderColor: badgeColor, color: badgeColor, backgroundColor: "rgba(0,0,0,0.1)" }}>
                          {marcoAcaoLabelMap[h.acao] || h.acao}
                        </span>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>por {h.autorNome}</span>
                      </div>
                      {h.nota !== null && (
                        <div style={{ marginTop: 2, fontWeight: "bold", color: "var(--accent)" }}>
                          Nota atribuída: {h.nota}
                        </div>
                      )}
                      {h.comentario && (
                        <div style={{ marginTop: 4, color: "var(--muted)", fontStyle: "italic", background: "rgba(255,255,255,0.01)", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.03)" }}>
                          &ldquo;{formatStatusText(h.comentario)}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulário de nova/edição de evidência */}
          {activeMarcoId === m.id && (
            <div className="card" style={{ padding: 14, marginTop: 14, borderColor: "var(--accent)" }}>
              <strong style={{ fontSize: 13 }}>
                {editingEvidenciaId ? `Editar Evidência do Mês ${m.mes}` : `Nova Evidência para Mês ${m.mes}`}
              </strong>
              <div className="grid two" style={{ marginTop: 10 }}>
                <div className="row">
                  <div className="label">Tipo</div>
                  <select className="select" value={evidTipo} onChange={(e) => setEvidTipo(e.target.value)}>
                    <option value="LINK">Link (URL)</option>
                    <option value="TEXTO">Texto descritivo</option>
                    <option value="ARQUIVO">Arquivo (informe URL)</option>
                  </select>
                </div>
                <div className="row">
                  <div className="label">URL / Link (opcional para Texto)</div>
                  <input className="input" value={evidUrl} onChange={(e) => setEvidUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <div className="label">Descrição da Evidência</div>
                <textarea className="textarea" value={evidDesc} onChange={(e) => setEvidDesc(e.target.value)} placeholder="Descreva o que está sendo entregue e como isso cumpre o critério de aceitação..." />
              </div>
              <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
                <input type="checkbox" checked={evidPublica} onChange={(e) => setEvidPublica(e.target.checked)} />
                <span className="p" style={{ margin: 0, fontSize: 13 }}>Esta evidência pode ser exibida na Página Pública do Projeto</span>
              </label>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="btn" onClick={submitEvidencia} disabled={submitting || !evidDesc} style={buttonStyle}>
                  {submitting ? "Salvando..." : editingEvidenciaId ? "Salvar Alterações" : "Enviar Evidência"}
                </button>
                {editingEvidenciaId && (
                  <button className="btn secondary" onClick={handleCancelForm} style={buttonStyle}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
