"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPropostaDetail({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [parecerTexto, setParecerTexto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisao, setDecisao] = useState<"APROVADA" | "REPROVADA" | "DILIGENCIA" | "DEVOLVER" | "">("");
  const [diligenciaTexto, setDiligenciaTexto] = useState("");

  const [editingParecerId, setEditingParecerId] = useState<string | null>(null);
  const [editingParecerText, setEditingParecerText] = useState("");

  const [novoParecer, setNovoParecer] = useState("");
  const [savingNovoParecer, setSavingNovoParecer] = useState(false);

  async function handleEditParecer(avId: string) {
    if (!editingParecerText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/avaliacoes/${avId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parecer: editingParecerText }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Erro ao editar parecer.");
      }
    } catch {
      alert("Falha ao salvar parecer");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    fetch(`/api/admin/propostas/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.data);
        else setError(res.error || "Erro ao carregar");
        setLoading(false);
      })
      .catch(() => setError("Falha de rede"));
  }, [params.id]);

  async function handleNovoParecer() {
    if (!novoParecer.trim()) return;
    setSavingNovoParecer(true);
    try {
      const res = await fetch(`/api/admin/propostas/${params.id}/parecer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parecerTexto: novoParecer }),
      });
      if (res.ok) {
        setNovoParecer("");
        window.location.reload();
      } else {
        const json = await res.json();
        alert(json.error || "Erro ao registrar parecer.");
      }
    } catch {
      alert("Falha ao salvar parecer.");
    } finally {
      setSavingNovoParecer(false);
    }
  }

  if (loading) return <div className="card"><p className="p">Carregando...</p></div>;
  if (error || !data) return <div className="card"><p className="p" style={{ color: "var(--bad)" }}>{error}</p></div>;

  const statusColors: Record<string, string> = {
    RASCUNHO: "var(--muted)",
    SUBMETIDA: "var(--accent)",
    EM_TRIAGEM: "var(--warn)",
    PARECER_EDUCACAO: "var(--warn)",
    AVALIACAO_CMAA: "var(--warn)",
    CLASSIFICADA: "var(--good)",
    HOMOLOGADA: "var(--good)",
    TERMO_OUTORGA: "var(--accent)",
    EM_EXECUCAO: "var(--good)",
    SUSPENSA: "var(--bad)",
    EM_AJUSTE: "var(--warn)",
    CANCELADA: "var(--bad)",
    CONCLUIDA: "var(--good)",
  };

  const statusColorsPrint: Record<string, string> = {
    RASCUNHO: "#999",
    SUBMETIDA: "#7c5cff",
    EM_TRIAGEM: "#f59e0b",
    PARECER_EDUCACAO: "#f59e0b",
    AVALIACAO_CMAA: "#f59e0b",
    CLASSIFICADA: "#22c55e",
    HOMOLOGADA: "#22c55e",
    TERMO_OUTORGA: "#7c5cff",
    EM_EXECUCAO: "#22c55e",
    SUSPENSA: "#ef4444",
    EM_AJUSTE: "#f59e0b",
    CANCELADA: "#ef4444",
    CONCLUIDA: "#22c55e",
  };

  async function handleTransition(to: string, parecerOverride?: string) {
    setIsSubmitting(true);
    setError("");
    const textToSend = parecerOverride !== undefined ? parecerOverride : parecerTexto;
    try {
      const res = await fetch(`/api/admin/propostas/${params.id}/avaliar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRANSITION",
          nextStatus: to,
          parecerTexto: textToSend,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Erro na transição");
      } else {
        window.location.reload();
      }
    } catch {
      setError("Falha de rede");
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Safe HTML rendering helper */
  function renderHtml(html: string | undefined | null) {
    if (!html) return <span style={{ color: "var(--muted)" }}>—</span>;
    return (
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ fontSize: 13, color: "var(--muted)" }}
      />
    );
  }

  /** Strip HTML for print plain-text rendering */
  function stripHtml(html: string | undefined | null): string {
    if (!html) return "—";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  /** Score tier helper */
  function scoreTier(score: number): "good" | "warn" | "bad" {
    if (score >= 7) return "good";
    if (score >= 5) return "warn";
    return "bad";
  }

  /** Categorize AI thoughts into strengths (score >= 7) and improvements (score < 7) */
  function categorizeThoughts(thoughts: any[]) {
    const strengths: any[] = [];
    const improvements: any[] = [];
    thoughts.forEach((t: any) => {
      if (t.score >= 7) strengths.push(t);
      else improvements.push(t);
    });
    return { strengths, improvements };
  }

  function handlePrint() {
    window.print();
  }

  const ai = data.aiAnalysisJson;
  const aiCategories = ai?.thoughts ? categorizeThoughts(ai.thoughts) : null;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN LAYOUT — hidden during print                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="screen-layout">
        <div className="grid" style={{ gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <h1 className="h1">Protocolo {data.id.split("-")[0].toUpperCase()}</h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
               <span className="badge" style={{ backgroundColor: statusColors[data.status] || "var(--border)", color: "#fff", padding: "5px 10px", fontSize: 13 }}>
                 STATUS: {data.status}
               </span>
               <button className="print-btn" onClick={handlePrint}>
                 🖨️ Imprimir Relatório
               </button>
               <Link href="/admin/propostas" className="btn secondary">Voltar</Link>
            </div>
          </div>

          {/* LEI Reference */}
          <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="lei-banner">
            📋 <strong>Consulte a Lei Municipal de Inovação</strong> — Referência para avaliação
          </a>

          {/* ======================= PROPOSTA CANCELADA: ações especiais ======================= */}
          {data.status === "CANCELADA" && (
            <div className="card" style={{ borderColor: "var(--bad)", background: "rgba(239,68,68,0.04)" }}>
              <h2 className="h2" style={{ color: "var(--bad)", marginBottom: 8 }}>Proposta Cancelada</h2>
              <p className="p" style={{ marginBottom: 20 }}>Esta proposta foi cancelada. Você pode devolvê-la ao proponente para revisão completa ou registrar um parecer complementar no histórico.</p>

              {/* Devolver para revisão */}
              <div style={{ padding: 16, borderRadius: 10, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.04)", marginBottom: 16 }}>
                <strong style={{ fontSize: 14, color: "#fbbf24", display: "block", marginBottom: 8 }}>↩️ Devolver ao Proponente para Revisão</strong>
                <p className="p" style={{ fontSize: 13, marginBottom: 10 }}>A proposta voltará ao status <strong>EM AJUSTE</strong>. O proponente poderá editar todos os campos (incluindo meses e entregáveis) e resubmeter.</p>
                <div className="label" style={{ marginBottom: 6 }}>Motivo da devolução (obrigatório — o proponente verá este texto)</div>
                <textarea
                  className="textarea"
                  value={parecerTexto}
                  onChange={(e) => setParecerTexto(e.target.value)}
                  placeholder="Explique detalhadamente o que precisa ser revisado e por que a proposta está sendo devolvida em vez de cancelada definitivamente..."
                  style={{ borderColor: "#f59e0b" }}
                />
                <button
                  className="btn"
                  style={{ marginTop: 10, borderColor: "#f59e0b", color: "#fbbf24" }}
                  disabled={isSubmitting || !parecerTexto.trim()}
                  onClick={() => handleTransition("EM_AJUSTE", parecerTexto)}
                >
                  {isSubmitting ? "Processando..." : "↩️ Devolver para Revisão (EM_AJUSTE)"}
                </button>
              </div>

              {/* Registrar parecer sem mudar status */}
              <div style={{ padding: 16, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                <strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>📝 Registrar Parecer Complementar</strong>
                <p className="p" style={{ fontSize: 13, marginBottom: 10 }}>Adiciona um registro formal ao histórico sem alterar o status de cancelamento.</p>
                <div className="label" style={{ marginBottom: 6 }}>Texto do parecer</div>
                <textarea
                  className="textarea"
                  value={novoParecer}
                  onChange={(e) => setNovoParecer(e.target.value)}
                  placeholder="Escreva o parecer complementar a ser registrado no histórico desta proposta cancelada..."
                />
                <button
                  className="btn secondary"
                  style={{ marginTop: 10 }}
                  disabled={savingNovoParecer || !novoParecer.trim()}
                  onClick={handleNovoParecer}
                >
                  {savingNovoParecer ? "Salvando..." : "💾 Registrar Parecer"}
                </button>
              </div>
            </div>
          )}

          {/* ======================= TELA DE AVALIAÇÃO / TRANSIÇÃO ======================= */}
          {data.status !== "CANCELADA" && data.availableTransitions?.length > 0 && (
            <div className="card" style={{ borderColor: "var(--accent)", background: "rgba(0,123,255,0.05)" }}>
              <h2 className="h2" style={{ color: "var(--accent)", marginBottom: 14 }}>Avaliação da Proposta</h2>
              <p className="p">Seu perfil tem permissão para decidir o avanço desta proposta.</p>

              <div className="row" style={{ marginTop: 14 }}>
                <div className="label">Decisão</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flexDirection: "column" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "var(--card-bg)", padding: "10px 14px", borderRadius: 8, border: "1px solid " + (decisao === "APROVADA" ? "#10b981" : "var(--border)") }}>
                    <input type="radio" name="decisao" value="APROVADA" checked={decisao === "APROVADA"} onChange={() => setDecisao("APROVADA")} style={{ width: 18, height: 18 }} />
                    <span style={{ fontWeight: 600 }}>✅ APROVADA</span> <span style={{ color: "var(--muted)", fontSize: 13 }}>— Avançar para próxima etapa</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "var(--card-bg)", padding: "10px 14px", borderRadius: 8, border: "1px solid " + (decisao === "REPROVADA" ? "#ef4444" : "var(--border)") }}>
                    <input type="radio" name="decisao" value="REPROVADA" checked={decisao === "REPROVADA"} onChange={() => setDecisao("REPROVADA")} style={{ width: 18, height: 18 }} />
                    <span style={{ fontWeight: 600 }}>❌ REPROVADA</span> <span style={{ color: "var(--muted)", fontSize: 13 }}>— Encerrar / cancelar proposta</span>
                  </label>
                  {data.availableTransitions.some((t: any) => t.to === "EM_AJUSTE") && (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "var(--card-bg)", padding: "10px 14px", borderRadius: 8, border: "1px solid " + (decisao === "DEVOLVER" ? "#f59e0b" : "var(--border)") }}>
                      <input type="radio" name="decisao" value="DEVOLVER" checked={decisao === "DEVOLVER"} onChange={() => setDecisao("DEVOLVER")} style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 600 }}>↩️ DEVOLVER AO PROPONENTE</span> <span style={{ color: "var(--muted)", fontSize: 13 }}>— Retornar para revisão completa (meses, entregáveis, equipe, etc.)</span>
                    </label>
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "var(--card-bg)", padding: "10px 14px", borderRadius: 8, border: "1px solid " + (decisao === "DILIGENCIA" ? "#8b5cf6" : "var(--border)") }}>
                    <input type="radio" name="decisao" value="DILIGENCIA" checked={decisao === "DILIGENCIA"} onChange={() => setDecisao("DILIGENCIA")} style={{ width: 18, height: 18 }} />
                    <span style={{ fontWeight: 600 }}>🔄 DILIGÊNCIA</span> <span style={{ color: "var(--muted)", fontSize: 13 }}>— Retroceder para etapa anterior (entre avaliadores)</span>
                  </label>
                </div>
              </div>

              {decisao === "DEVOLVER" && (
                <div className="row" style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p className="p" style={{ fontSize: 13, marginBottom: 10, color: "#fbbf24" }}>
                    ↩️ A proposta será marcada como <strong>EM AJUSTE</strong>. O proponente poderá editar <strong>todos os campos</strong> — título, equipe, meses, entregáveis, evidências, etc. — e resubmeter. Todo o histórico é preservado.
                  </p>
                </div>
              )}

              {decisao === "DILIGENCIA" && (
                <div className="row" style={{ marginTop: 14 }}>
                  <div className="label">O que precisa ser ajustado? (detalhe para Diligência)</div>
                  <textarea
                    className="textarea"
                    value={diligenciaTexto}
                    onChange={(e) => setDiligenciaTexto(e.target.value)}
                    placeholder="Especifique os pontos que precisam de revisão antes de avançar..."
                    style={{ borderColor: "#8b5cf6" }}
                    required
                  />
                </div>
              )}

              <div className="row" style={{ marginTop: 14 }}>
                <div className="label">
                  {decisao === "DEVOLVER"
                    ? "Motivo da devolução (obrigatório — o proponente verá este texto ao editar)"
                    : decisao === "DILIGENCIA"
                    ? "Parecer / Justificativa Interna"
                    : "Parecer / Observação (ficará no histórico)"}
                </div>
                <textarea
                  className="textarea"
                  value={parecerTexto}
                  onChange={(e) => setParecerTexto(e.target.value)}
                  placeholder={
                    decisao === "DEVOLVER"
                      ? "Explique o que precisa ser revisado na proposta — o proponente verá esta mensagem..."
                      : decisao === "DILIGENCIA"
                      ? "Escreva a justificativa para a diligência..."
                      : "Descreva o motivo da aprovação ou reprovação..."
                  }
                  style={{ borderColor: decisao === "DEVOLVER" ? "#f59e0b" : undefined }}
                  required
                />
              </div>

              <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {(() => {
                  if (!decisao) return <p className="p" style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Selecione uma decisão acima para continuar.</p>;

                  const forwards = ["SUBMETIDA", "EM_TRIAGEM", "PARECER_EDUCACAO", "AVALIACAO_CMAA", "CLASSIFICADA", "HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO", "CONCLUIDA"];
                  const backwards = ["RASCUNHO", "SUBMETIDA", "EM_TRIAGEM", "PARECER_EDUCACAO"];
                  const cancels = ["SUSPENSA", "CANCELADA"];

                  let targetStatus: string | null = null;
                  if (decisao === "APROVADA") {
                    targetStatus = data.availableTransitions.find((t: any) => t.to === "HOMOLOGADA")?.to
                                || data.availableTransitions.find((t: any) => forwards.includes(t.to))?.to || null;
                  } else if (decisao === "REPROVADA") {
                    targetStatus = data.availableTransitions.find((t: any) => t.to === "CANCELADA")?.to
                                || data.availableTransitions.find((t: any) => cancels.includes(t.to))?.to || null;
                  } else if (decisao === "DEVOLVER") {
                    targetStatus = data.availableTransitions.find((t: any) => t.to === "EM_AJUSTE")?.to || null;
                  } else if (decisao === "DILIGENCIA") {
                    targetStatus = data.availableTransitions.find((t: any) => backwards.includes(t.to))?.to || null;
                  }

                  if (!targetStatus) {
                    return <p className="p" style={{ fontSize: 13, color: "var(--bad)", margin: 0 }}>Não há transição configurada para esta decisão no estágio atual.</p>;
                  }

                  // Handle CMAA Matrix Route
                  if (data.status === "AVALIACAO_CMAA" && decisao === "APROVADA" && targetStatus === "CLASSIFICADA") {
                    return (
                      <Link href={`/admin/propostas/${data.id}/avaliar`} className="cta-btn cta-btn--primary">
                        📋 Ir para Matriz de Avaliação CMAA
                      </Link>
                    );
                  }

                  // Handle Termo Outorga
                  if (data.status === "HOMOLOGADA" && decisao === "APROVADA" && targetStatus === "TERMO_OUTORGA") {
                    return (
                      <Link href={`/admin/propostas/${data.id}/termo`} className="cta-btn cta-btn--primary">
                        📄 Gerar Termo de Outorga
                      </Link>
                    );
                  }

                  const isDevolver = decisao === "DEVOLVER";
                  const buttonDisabled = isSubmitting || !parecerTexto.trim() || (decisao === "DILIGENCIA" && !diligenciaTexto.trim());

                  return (
                    <button
                      className={decisao === "APROVADA" ? "cta-btn cta-btn--primary" : decisao === "REPROVADA" ? "btn secondary" : "btn"}
                      style={isDevolver ? { borderColor: "#f59e0b", color: "#fbbf24" } : undefined}
                      onClick={() => {
                        const finalParecer = decisao === "DILIGENCIA" && diligenciaTexto.trim()
                          ? `[DILIGÊNCIA SOLICITADA]: ${diligenciaTexto}\n\n[PARECER INTERNO]: ${parecerTexto}`
                          : parecerTexto;
                        handleTransition(targetStatus!, finalParecer);
                      }}
                      disabled={buttonDisabled}
                    >
                      {isSubmitting
                        ? "Processando..."
                        : isDevolver
                        ? "↩️ Devolver ao Proponente para Revisão"
                        : `Confirmar Decisão → ${targetStatus}`}
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ======================= PARECER PRÉVIO DA I.A. ======================= */}
          {ai && (
            <div style={{
              background: "linear-gradient(180deg, rgba(20, 24, 30, 0.95), rgba(15, 18, 23, 0.98))",
              border: "1px solid rgba(124, 92, 255, 0.3)",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(124, 92, 255, 0.1)",
              borderRadius: 24, padding: "32px 24px"
            }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <span style={{ fontSize: 40, display: "block", marginBottom: 8 }}>🤖</span>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                  Parecer Prévio do <span className="gradient-text">Analista I.A.</span>
                </h3>
                <p className="p" style={{ margin: "4px 0 0", fontSize: 13 }}>
                  Gerado automaticamente no momento da submissão da proposta.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, fontWeight: 800,
                    background: `conic-gradient(
                      ${ai.overallScore >= 7 ? "#22c55e" : ai.overallScore >= 5 ? "#f59e0b" : "#ef4444"}
                      ${ai.overallScore * 10}%,
                      rgba(255,255,255,0.08) 0
                    )`,
                    color: "var(--text)",
                  }}>
                    <span style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: "var(--card-bg)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {ai.overallScore}
                    </span>
                  </div>
                  <p className="p" style={{ fontSize: 12, margin: "8px 0 0" }}>Nota Geral</p>
                </div>
                <div className={`ai-verdict-badge ${
                  ai.verdict === "APROVAÇÃO PROVÁVEL" ? "ai-verdict--good" :
                  ai.verdict === "COM RESSALVAS" ? "ai-verdict--warn" :
                  "ai-verdict--bad"
                }`}>
                  {ai.verdict === "APROVAÇÃO PROVÁVEL" ? "✅" :
                   ai.verdict === "COM RESSALVAS" ? "⚠️" : "🔄"}
                  {" "}{ai.verdict}
                </div>
              </div>

              <div className="grid" style={{ gap: 12 }}>
                {ai.thoughts.map((t: any, idx: number) => (
                  <div className="ai-score-card" key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>
                        {t.emoji} {t.category}
                      </span>
                      <span style={{
                        fontSize: 16, fontWeight: 800,
                        color: t.score >= 7 ? "#22c55e" : t.score >= 5 ? "#f59e0b" : "#ef4444",
                      }}>
                        {t.score}
                      </span>
                    </div>
                    <div className="ai-score-bar">
                      <div
                        className="ai-score-fill"
                        style={{
                          width: `${t.score * 10}%`,
                          background: t.score >= 7 ? "linear-gradient(90deg, #22c55e, #4ade80)" :
                                      t.score >= 5 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" :
                                      "linear-gradient(90deg, #ef4444, #f87171)",
                          animationDelay: `${idx * 0.1}s`,
                        }}
                      />
                    </div>
                    <p className="p" style={{ fontSize: 13, margin: "8px 0 0", lineHeight: 1.5 }}>
                      {t.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================= DADOS DA PROPOSTA ======================= */}
          <div className="grid two">
            <div className="card">
              <h3 className="h3">Informações Gerais</h3>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
                <strong>Título:</strong> {data.titulo}<br/>
                <strong>Linha Temática:</strong> {data.linhaTematica}<br/>
                <strong>Edital:</strong> {data.edital.titulo} <span className="badge">{data.edital.modalidade}</span><br/>
                <strong>Duração:</strong> {data.duracaoMeses} meses<br/>
                <strong>Data Submissão:</strong> {new Date(data.createdAt).toLocaleString("pt-BR")}<br/>
              </div>
              {data.pdfPropostaUrl && (
                <div style={{ marginTop: 12 }}>
                  <a href={data.pdfPropostaUrl} target="_blank" rel="noopener noreferrer" className="btn secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    📄 Baixar PDF da Proposta Completa
                  </a>
                </div>
              )}
            </div>
            <div className="card">
              <h3 className="h3">Proponente principal</h3>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
                <strong>Nome:</strong> {data.proponente.nome}<br/>
                <strong>CPF:</strong> {data.proponente.cpf}<br/>
                <strong>E-mail:</strong> {data.proponente.email}<br/>
              </div>
            </div>
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            <h3 className="h3" style={{ marginBottom: 14 }}>Conteúdo Principal</h3>
            
            <strong style={{ fontSize: 12 }}>Resumo Executivo</strong>
            <div className="prose" style={{ marginTop: 5, marginBottom: 15, fontSize: 13, color: "var(--muted)" }}>{data.resumo}</div>
            
            <strong style={{ fontSize: 12 }}>O Problema</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.problema)}</div>

            <strong style={{ fontSize: 12 }}>Público-Alvo</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.publicoAlvo)}</div>

            <strong style={{ fontSize: 12 }}>Proposta de Valor</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.propostaValor)}</div>

            <strong style={{ fontSize: 12 }}>A Solução (Escopo)</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.solucao)}</div>

            <strong style={{ fontSize: 12 }}>Viabilidade</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.viabilidade)}</div>

            <strong style={{ fontSize: 12 }}>Metodologia</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.metodologia)}</div>

            <strong style={{ fontSize: 12 }}>Riscos e Mitigação</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.riscos)}</div>

            <strong style={{ fontSize: 12 }}>Indicadores de Sucesso</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.indicadores)}</div>

            <strong style={{ fontSize: 12 }}>Orçamento e Rateio</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.orcamentoRateio)}</div>

            <strong style={{ fontSize: 12 }}>Página Pública (Plano)</strong>
            <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.paginaPublicaPlano)}</div>
          </div>

          {/* ======================= EQUIPE ======================= */}
          <div className="card" style={{ overflowX: "auto" }}>
            <h3 className="h3" style={{ marginBottom: 14 }}>Equipe e Rateio da Bolsa</h3>
            <table className="table" style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: 8, textAlign: "left" }}>Nome</th>
                  <th style={{ padding: 8, textAlign: "left" }}>CPF</th>
                  <th style={{ padding: 8, textAlign: "center" }}>Rateio (%)</th>
                  <th style={{ padding: 8, textAlign: "center" }}>Menor Idd.</th>
                  <th style={{ padding: 8, textAlign: "left" }}>Responsável Legal</th>
                </tr>
              </thead>
              <tbody>
                {data.equipe.map((eq: any) => (
                  <tr key={eq.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 8, wordBreak: "break-word" }}>{eq.nome}<br/><span style={{ fontSize: 11, color: "var(--muted)" }}>{eq.vinculoEstudantil}</span></td>
                    <td style={{ padding: 8 }}>{eq.cpf}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{eq.percentualRateio}%</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{eq.ehMenor ? "Sim" : "Não"}</td>
                    <td style={{ padding: 8, fontSize: 11, wordBreak: "break-word" }}>
                      {eq.ehMenor ? `${eq.responsavelLegal} (CPF: ${eq.cpfResponsavel})` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ======================= CRONOGRAMA ======================= */}
          <div className="card">
            <h3 className="h3" style={{ marginBottom: 14 }}>Marcos e Entregáveis (Cronograma)</h3>
            <div className="grid">
              {data.marcos.map((m: any) => (
                <div key={m.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>Mês {m.mes}</strong>
                    <span className="badge">{m.status}</span>
                  </div>
                  <div className="prose" style={{ margin: "5px 0", fontSize: 13, color: "var(--muted)" }}><strong>Entregável:</strong> {m.entregavel}</div>
                  <div className="prose" style={{ margin: "5px 0", fontSize: 13, color: "var(--muted)" }}><strong>Evidência:</strong> {m.evidenciaEsperada}</div>
                  <div className="prose" style={{ margin: "5px 0", fontSize: 13, color: "var(--muted)" }}><strong>Critério:</strong> {m.criterioAceitacao}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ======================= HISTÓRICO DE PARECERES E AUDITORIA ======================= */}
          <div className="card">
            <h3 className="h3" style={{ marginBottom: 14 }}>Histórico e Pareceres</h3>
            {data.avaliacoes?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, marginBottom: 10, color: "var(--muted)" }}>Pareceres Técnicos</h4>
                {data.avaliacoes.map((av: any, i: number) => (
                  <div key={av.id} style={{ padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 6, marginBottom: 10, fontSize: 13, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <strong>{av.avaliador?.nome || "Avaliador Desconhecido"} <span className="badge">{av.etapa}</span></strong>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ color: "var(--muted)" }}>{new Date(av.createdAt).toLocaleString("pt-BR")}</span>
                        <button className="btn secondary" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => {
                          setEditingParecerId(av.id);
                          setEditingParecerText(av.parecer);
                        }}>Editar</button>
                      </div>
                    </div>
                    {editingParecerId === av.id ? (
                      <div style={{ marginTop: 10 }}>
                        <textarea className="textarea" value={editingParecerText} onChange={e => setEditingParecerText(e.target.value)} rows={5} />
                        <div style={{ display: "flex", gap: 10, marginTop: 5 }}>
                          <button className="btn" onClick={() => handleEditParecer(av.id)} disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar Alteração"}
                          </button>
                          <button className="btn secondary" onClick={() => setEditingParecerId(null)}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose" style={{ marginTop: 5, whiteSpace: "pre-wrap" }}>{av.parecer}</div>
                    )}
                    {av.notaFinal !== null && <p style={{ marginTop: 5 }}><strong>Nota Final:</strong> {av.notaFinal}</p>}
                    <p style={{ marginTop: 5, color: av.aprovado ? "var(--good)" : "var(--bad)" }}>
                      Decisão: {av.aprovado ? "Aprovado" : "Rejeitado / Com Falhas"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <h4 style={{ fontSize: 13, marginBottom: 10, color: "var(--muted)" }}>Registro de Auditoria (Transições)</h4>
            <div style={{ maxHeight: 200, overflowY: "auto", fontSize: 12, fontFamily: "monospace" }}>
              {data.AuditLog.map((log: any, i: number) => (
                <div key={i} style={{ borderBottom: "1px solid var(--border)", padding: "5px 0", wordBreak: "break-word" }}>
                  <span style={{ color: "var(--muted)" }}>{new Date(log.createdAt).toLocaleString("pt-BR")}</span>{" "}
                  <strong>{log.action}</strong>: 
                  ({log.beforeJson?.status} → {log.afterJson?.status})
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PRINT REPORT — visible only during print                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="print-report">
        {/* ── Report Header ── */}
        <div className="pr-header">
          <div className="pr-header-brand">
            <div className="pr-header-dot" />
            <span className="pr-header-title">ProInova — Plataforma de Inovação</span>
          </div>
          <h1 className="pr-doc-title">{data.titulo}</h1>
          <p className="pr-doc-subtitle">
            {data.edital.titulo} • Modalidade: {data.edital.modalidade}
          </p>
          <span className="pr-protocol">
            PROTOCOLO: {data.id.split("-")[0].toUpperCase()}
          </span>
          <span className="pr-status-badge" style={{ backgroundColor: statusColorsPrint[data.status] || "#999" }}>
            {data.status}
          </span>
        </div>

        {/* ══════════ SECTION 1: Proponentes + Equipe ══════════ */}
        <div className="pr-section">
          <div className="pr-section-title">
            <span className="pr-icon">👥</span> Proponente e Equipe
          </div>

          <div className="pr-info-grid" style={{ marginBottom: "8pt" }}>
            <div className="pr-info-item">
              <span className="pr-info-label">Proponente Principal</span>
              <span className="pr-info-value">{data.proponente.nome}</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">CPF</span>
              <span className="pr-info-value">{data.proponente.cpf}</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">E-mail</span>
              <span className="pr-info-value">{data.proponente.email}</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">Membros na equipe</span>
              <span className="pr-info-value">{data.equipe.length} membro(s)</span>
            </div>
          </div>

          <table className="pr-table">
            <thead>
              <tr>
                <th>Nome / Vínculo</th>
                <th>CPF</th>
                <th style={{ textAlign: "center" }}>Rateio (%)</th>
                <th style={{ textAlign: "center" }}>Menor Idade</th>
                <th>Responsável Legal</th>
              </tr>
            </thead>
            <tbody>
              {data.equipe.map((eq: any) => (
                <tr key={eq.id}>
                  <td>
                    {eq.nome}
                    {eq.vinculoEstudantil && <span className="pr-team-role">{eq.vinculoEstudantil}</span>}
                  </td>
                  <td>{eq.cpf}</td>
                  <td style={{ textAlign: "center" }}>{eq.percentualRateio}%</td>
                  <td style={{ textAlign: "center" }}>{eq.ehMenor ? "Sim" : "Não"}</td>
                  <td>{eq.ehMenor ? `${eq.responsavelLegal} (CPF: ${eq.cpfResponsavel})` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ══════════ SECTION 2: Informações Gerais ══════════ */}
        <div className="pr-section">
          <div className="pr-section-title">
            <span className="pr-icon">📋</span> Informações Gerais
          </div>
          <div className="pr-info-grid">
            <div className="pr-info-item">
              <span className="pr-info-label">Título do Projeto</span>
              <span className="pr-info-value">{data.titulo}</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">Linha Temática</span>
              <span className="pr-info-value">{data.linhaTematica}</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">Edital</span>
              <span className="pr-info-value">{data.edital.titulo}</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">Modalidade</span>
              <span className="pr-info-value">{data.edital.modalidade}</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">Duração</span>
              <span className="pr-info-value">{data.duracaoMeses} meses</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">Data de Submissão</span>
              <span className="pr-info-value">{new Date(data.createdAt).toLocaleString("pt-BR")}</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">Status Atual</span>
              <span className="pr-info-value">{data.status}</span>
            </div>
            <div className="pr-info-item">
              <span className="pr-info-label">Marcos Definidos</span>
              <span className="pr-info-value">{data.marcos.length} mês(es)</span>
            </div>
          </div>
        </div>

        {/* ══════════ SECTION 3: Conteúdo Principal ══════════ */}
        <div className="pr-section">
          <div className="pr-section-title">
            <span className="pr-icon">📄</span> Conteúdo do Projeto
          </div>

          {data.resumo && (
            <div className="pr-content-block">
              <div className="pr-content-label">Resumo Executivo</div>
              <div className="pr-content-text">{data.resumo}</div>
            </div>
          )}

          {data.problema && (
            <div className="pr-content-block">
              <div className="pr-content-label">O Problema</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.problema }} />
            </div>
          )}

          {data.publicoAlvo && (
            <div className="pr-content-block">
              <div className="pr-content-label">Público-Alvo</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.publicoAlvo }} />
            </div>
          )}

          {data.propostaValor && (
            <div className="pr-content-block">
              <div className="pr-content-label">Proposta de Valor</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.propostaValor }} />
            </div>
          )}

          {data.solucao && (
            <div className="pr-content-block">
              <div className="pr-content-label">A Solução (Escopo)</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.solucao }} />
            </div>
          )}

          {data.viabilidade && (
            <div className="pr-content-block">
              <div className="pr-content-label">Viabilidade</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.viabilidade }} />
            </div>
          )}

          {data.metodologia && (
            <div className="pr-content-block">
              <div className="pr-content-label">Metodologia</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.metodologia }} />
            </div>
          )}

          {data.riscos && (
            <div className="pr-content-block">
              <div className="pr-content-label">Riscos e Mitigação</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.riscos }} />
            </div>
          )}

          {data.indicadores && (
            <div className="pr-content-block">
              <div className="pr-content-label">Indicadores de Sucesso</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.indicadores }} />
            </div>
          )}

          {data.orcamentoRateio && (
            <div className="pr-content-block">
              <div className="pr-content-label">Orçamento e Rateio</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.orcamentoRateio }} />
            </div>
          )}

          {data.paginaPublicaPlano && (
            <div className="pr-content-block">
              <div className="pr-content-label">Página Pública (Plano)</div>
              <div className="pr-content-text" dangerouslySetInnerHTML={{ __html: data.paginaPublicaPlano }} />
            </div>
          )}
        </div>

        {/* ══════════ SECTION 4: Marcos e Entregáveis ══════════ */}
        <div className="pr-section">
          <div className="pr-section-title">
            <span className="pr-icon">📅</span> Marcos e Entregáveis (Cronograma)
          </div>
          {data.marcos.map((m: any) => (
            <div className="pr-milestone" key={m.id}>
              <div className="pr-milestone-month">M{m.mes}</div>
              <div className="pr-milestone-body">
                <div className="pr-milestone-title">Entregável: {m.entregavel}</div>
                <div className="pr-milestone-detail"><strong>Evidência Esperada:</strong> {m.evidenciaEsperada}</div>
                <div className="pr-milestone-detail"><strong>Critério de Aceitação:</strong> {m.criterioAceitacao}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════ SECTION 5: Parecer da I.A. ══════════ */}
        {ai && (
          <div className="pr-ai-section pr-section">
            <div className="pr-ai-header">
              <div className="pr-ai-header-left">
                <span style={{ fontSize: "14pt" }}>🤖</span>
                <span className="pr-ai-header-title">Parecer Prévio — Analista I.A.</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8pt" }}>
                <div className={`pr-ai-score-circle pr-ai-score-circle--${scoreTier(ai.overallScore)}`}>
                  {ai.overallScore}
                </div>
                <div className={`pr-ai-verdict pr-ai-verdict--${
                  ai.verdict === "APROVAÇÃO PROVÁVEL" ? "good" :
                  ai.verdict === "COM RESSALVAS" ? "warn" : "bad"
                }`}>
                  {ai.verdict === "APROVAÇÃO PROVÁVEL" ? "✅" :
                   ai.verdict === "COM RESSALVAS" ? "⚠️" : "🔄"}
                  {" "}{ai.verdict}
                </div>
              </div>
            </div>

            {/* AI Score Grid */}
            <div className="pr-ai-grid">
              {ai.thoughts.map((t: any, idx: number) => (
                <div className="pr-ai-card" key={idx}>
                  <div className="pr-ai-card-header">
                    <span className="pr-ai-card-category">{t.emoji} {t.category}</span>
                    <span className={`pr-ai-card-score pr-ai-card-score--${scoreTier(t.score)}`}>
                      {t.score}/10
                    </span>
                  </div>
                  <div className="pr-ai-bar">
                    <div
                      className={`pr-ai-bar-fill pr-ai-bar-fill--${scoreTier(t.score)}`}
                      style={{ width: `${t.score * 10}%` }}
                    />
                  </div>
                  <p className="pr-ai-comment">{t.comment}</p>
                </div>
              ))}
            </div>

            {/* Highlight boxes: Strengths & Improvements */}
            {aiCategories && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6pt", marginTop: "8pt" }}>
                {aiCategories.strengths.length > 0 && (
                  <div className="pr-highlight-box pr-highlight-box--good">
                    <div className="pr-highlight-title pr-highlight-title--good">✅ Pontos Fortes</div>
                    {aiCategories.strengths.map((t: any, i: number) => (
                      <div className="pr-highlight-item" key={i}>
                        <strong>{t.category}</strong> (nota {t.score}) — {t.comment}
                      </div>
                    ))}
                  </div>
                )}
                {aiCategories.improvements.length > 0 && (
                  <div className="pr-highlight-box pr-highlight-box--improve">
                    <div className="pr-highlight-title pr-highlight-title--improve">⚠️ Pontos de Melhoria</div>
                    {aiCategories.improvements.map((t: any, i: number) => (
                      <div className="pr-highlight-item" key={i}>
                        <strong>{t.category}</strong> (nota {t.score}) — {t.comment}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Report Footer ── */}
        <div className="pr-footer">
          <span>ProInova — Plataforma de Inovação Municipal</span>
          <span>Gerado em {new Date().toLocaleString("pt-BR")}</span>
          <span>Protocolo: {data.id.split("-")[0].toUpperCase()}</span>
        </div>
      </div>
    </>
  );
}
