"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════
   STATUS CONFIGURATION
   ═══════════════════════════════════════════════════════ */
const STATUS_MAP: Record<string, { icon: string; label: string; color: string }> = {
  RASCUNHO:          { icon: "📝", label: "Em rascunho",           color: "var(--muted)" },
  SUBMETIDA:         { icon: "📥", label: "Aguardando feedback",   color: "#3b82f6" },
  EM_TRIAGEM:        { icon: "🔍", label: "Em triagem",            color: "#8b5cf6" },
  PARECER_EDUCACAO:  { icon: "📚", label: "Parecer Educação",      color: "#8b5cf6" },
  AVALIACAO_CMAA:    { icon: "⚖️", label: "Avaliação CMAA",       color: "#f59e0b" },
  CLASSIFICADA:      { icon: "🏆", label: "Classificada",          color: "#10b981" },
  HOMOLOGADA:        { icon: "✅", label: "Homologada",            color: "#10b981" },
  TERMO_OUTORGA:     { icon: "📄", label: "Termo de outorga",      color: "#10b981" },
  EM_EXECUCAO:       { icon: "⚙️", label: "Em execução",          color: "var(--good)" },
  SUSPENSA:          { icon: "⏸️", label: "Suspensa",             color: "var(--warn)" },
  CANCELADA:         { icon: "❌", label: "Cancelada",             color: "var(--bad)" },
  CONCLUIDA:         { icon: "🏁", label: "Concluída",             color: "var(--accent)" },
};

/* ═══════════════════════════════════════════════════════
   FIELD → AI HINT KEY MAPPING
   ═══════════════════════════════════════════════════════ */
const FIELD_SECTIONS: { key: string; label: string; hintKey?: string }[] = [
  { key: "resumo",             label: "Resumo Executivo" },
  { key: "problema",           label: "O Problema",                hintKey: "problema" },
  { key: "publicoAlvo",        label: "Público-Alvo",              hintKey: "publicoAlvo" },
  { key: "propostaValor",      label: "Proposta de Valor",         hintKey: "propostaValor" },
  { key: "solucao",            label: "A Solução (Escopo)",        hintKey: "solucao" },
  { key: "metodologia",        label: "Metodologia",               hintKey: "metodologia" },
  { key: "viabilidade",        label: "Viabilidade",               hintKey: "viabilidade" },
  { key: "riscos",             label: "Riscos e Mitigação",        hintKey: "riscos" },
  { key: "indicadores",        label: "Indicadores de Sucesso",    hintKey: "indicadores" },
  { key: "orcamentoRateio",    label: "Orçamento e Rateio",        hintKey: "orcamentoRateio" },
  { key: "paginaPublicaPlano", label: "Plano de Transparência Pública", hintKey: "paginaPublicaPlano" },
];

/* ═══════════════════════════════════════════════════════
   COMPONENT: Safe HTML renderer
   ═══════════════════════════════════════════════════════ */
function RenderHtml({ html }: { html: string | undefined | null }) {
  if (!html) return <span style={{ color: "var(--muted)" }}>—</span>;
  return (
    <div
      className="prose"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   COMPONENT: AI Score Donut Chart
   ═══════════════════════════════════════════════════════ */
function ScoreDonut({ score, size = 90 }: { score: number; size?: number }) {
  const color = score >= 7 ? "#22c55e" : score >= 5 ? "#f59e0b" : "#ef4444";
  const inner = size - 18;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.31, fontWeight: 800,
      background: `conic-gradient(${color} ${score * 10}%, rgba(255,255,255,0.08) 0)`,
      color: "var(--text)",
    }}>
      <span style={{
        width: inner, height: inner, borderRadius: "50%",
        background: "var(--card-bg)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        {score}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function VisualizarPropostaPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/propostas/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.data);
        else setError(res.error || "Erro ao carregar proposta.");
        setLoading(false);
      })
      .catch(() => { setError("Falha de rede."); setLoading(false); });
  }, [params.id]);

  if (loading)
    return (
      <div className="section" style={{ textAlign: "center", paddingTop: 100 }}>
        <div className="hero-orb hero-orb--1" style={{ width: 300, height: 300, top: "20%", left: "50%", transform: "translate(-50%, 0)", opacity: 0.5 }} aria-hidden />
        <span className="gradient-text" style={{ fontSize: 24, fontWeight: 700 }}>Carregando proposta...</span>
      </div>
    );

  if (error || !data)
    return (
      <div className="section" style={{ maxWidth: 600, margin: "80px auto", textAlign: "center" }}>
        <div className="card" style={{ padding: 40 }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>😕</span>
          <h2 style={{ margin: "0 0 12px" }}>Proposta não encontrada</h2>
          <p className="p">{error}</p>
          <Link href="/painel" className="cta-btn cta-btn--ghost" style={{ marginTop: 16, display: "inline-block" }}>
            ← Voltar ao painel
          </Link>
        </div>
      </div>
    );

  const st = STATUS_MAP[data.status] || { icon: "📄", label: data.status, color: "var(--muted)" };
  const ai = data.aiAnalysisJson;
  const hints = ai?.fieldHints || {};

  return (
    <div style={{ position: "relative" }}>
      {/* Background */}
      <div className="hero-orb hero-orb--1" style={{ width: 400, height: 400, top: -50, left: -100, opacity: 0.2 }} aria-hidden />
      <div className="hero-orb hero-orb--2" style={{ width: 300, height: 300, top: 200, right: -80, opacity: 0.15 }} aria-hidden />

      <div className="grid" style={{ gap: 24, position: "relative", zIndex: 2, maxWidth: 960, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ padding: "40px 0 10px" }}>
          <Link href="/painel" className="btn secondary" style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            ← Painel
          </Link>
          <h1 className="h1" style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            {data.titulo || "(Sem título)"}
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span className="badge" style={{ borderColor: st.color, backgroundColor: `${st.color}15`, color: st.color, fontWeight: 600, padding: "6px 14px" }}>
              {st.icon} {st.label}
            </span>
            <span className="badge" style={{ padding: "6px 14px" }}>{data.edital?.modalidade}</span>
            <span className="badge" style={{ padding: "6px 14px" }}>📅 {new Date(data.createdAt).toLocaleDateString("pt-BR")}</span>
            <span className="badge" style={{ padding: "6px 14px" }}>⏱️ {data.duracaoMeses} meses</span>
          </div>
        </div>

        {/* ═══ EDITAL INFO ═══ */}
        <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>Edital</div>
            <strong style={{ fontSize: 15 }}>{data.edital?.titulo}</strong>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>Linha Temática</div>
            <strong style={{ fontSize: 14 }}>{data.linhaTematica}</strong>
          </div>
        </div>

        {/* ═══ AI OVERALL ANALYSIS ═══ */}
        {ai && (
          <div style={{
            background: "linear-gradient(180deg, rgba(20, 24, 30, 0.95), rgba(15, 18, 23, 0.98))",
            border: "1px solid rgba(124, 92, 255, 0.3)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(124, 92, 255, 0.1)",
            borderRadius: 24, padding: "32px 24px",
          }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 8 }}>🤖</span>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                Análise do <span className="gradient-text">Assistente I.A.</span>
              </h3>
              <p className="p" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Gerada automaticamente no momento da submissão.
              </p>
            </div>

            {/* Score + Verdict row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 28, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <ScoreDonut score={ai.overallScore} />
                <p className="p" style={{ fontSize: 12, margin: "8px 0 0" }}>Nota Geral</p>
              </div>
              <div className={`ai-verdict-badge ${
                ai.verdict === "APROVAÇÃO PROVÁVEL" ? "ai-verdict--good" :
                ai.verdict === "COM RESSALVAS" ? "ai-verdict--warn" : "ai-verdict--bad"
              }`}>
                {ai.verdict === "APROVAÇÃO PROVÁVEL" ? "✅" :
                 ai.verdict === "COM RESSALVAS" ? "⚠️" : "🔄"}
                {" "}{ai.verdict}
              </div>
            </div>

            {/* Per-category scores */}
            <div className="grid" style={{ gap: 12 }}>
              {ai.thoughts?.map((t: any, idx: number) => (
                <div className="ai-score-card" key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{t.emoji} {t.category}</span>
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

        {/* ═══ PROPOSAL CONTENT (with per-field AI hints) ═══ */}
        <div className="card" style={{ padding: "28px 24px" }}>
          <h2 className="h2" style={{ fontSize: 22, marginBottom: 24 }}>Conteúdo da Proposta</h2>

          {FIELD_SECTIONS.map(({ key, label, hintKey }) => {
            const value = data[key];
            const hint = hintKey ? hints[hintKey] : null;
            if (!value && !hint) return null;

            return (
              <div key={key} style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <strong style={{ fontSize: 14, color: "var(--text)" }}>{label}</strong>
                </div>
                <RenderHtml html={key === "resumo" ? `<p>${value}</p>` : value} />
                {hint && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 10,
                    background: "rgba(124, 92, 255, 0.06)",
                    border: "1px dashed rgba(124, 92, 255, 0.25)",
                    fontSize: 13, color: "#c4b5fd", lineHeight: 1.5,
                  }}>
                    <span style={{ fontWeight: 700 }}>🤖 Dica da I.A.:</span> {hint}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ═══ EQUIPE ═══ */}
        {data.equipe?.length > 0 && (
          <div className="card" style={{ overflowX: "auto" }}>
            <h2 className="h2" style={{ fontSize: 20, marginBottom: 16 }}>Equipe e Rateio</h2>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: 10, textAlign: "left" }}>Nome</th>
                  <th style={{ padding: 10, textAlign: "left" }}>CPF</th>
                  <th style={{ padding: 10, textAlign: "center" }}>Rateio (%)</th>
                  <th style={{ padding: 10, textAlign: "center" }}>Menor Idd.</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Responsável Legal</th>
                </tr>
              </thead>
              <tbody>
                {data.equipe.map((eq: any) => (
                  <tr key={eq.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 10, wordBreak: "break-word" }}>
                      {eq.nome}
                      {eq.vinculoEstudantil && <><br /><span style={{ fontSize: 11, color: "var(--muted)" }}>{eq.vinculoEstudantil}</span></>}
                    </td>
                    <td style={{ padding: 10 }}>{eq.cpf}</td>
                    <td style={{ padding: 10, textAlign: "center" }}>{eq.percentualRateio}%</td>
                    <td style={{ padding: 10, textAlign: "center" }}>{eq.ehMenor ? "Sim" : "Não"}</td>
                    <td style={{ padding: 10, fontSize: 11, wordBreak: "break-word" }}>
                      {eq.ehMenor ? `${eq.responsavelLegal} (CPF: ${eq.cpfResponsavel})` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ CRONOGRAMA / MARCOS ═══ */}
        {data.marcos?.length > 0 && (
          <div className="card">
            <h2 className="h2" style={{ fontSize: 20, marginBottom: 16 }}>Plano de Voo (Cronograma)</h2>
            <div className="grid" style={{ gap: 10 }}>
              {data.marcos.map((m: any) => (
                <div key={m.id} style={{
                  padding: 14, border: "1px solid var(--border)", borderRadius: 10,
                  background: "rgba(255,255,255,0.015)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ fontSize: 15 }}>📅 Mês {m.mes}</strong>
                    <span className="badge" style={{
                      borderColor: m.status === "VALIDADO" ? "var(--good)" : m.status === "REJEITADO" ? "var(--bad)" : "var(--border)",
                      color: m.status === "VALIDADO" ? "var(--good)" : m.status === "REJEITADO" ? "var(--bad)" : "var(--muted)",
                    }}>
                      {m.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                    <div><strong>Entregável:</strong> {m.entregavel}</div>
                    <div><strong>Evidência esperada:</strong> {m.evidenciaEsperada}</div>
                    <div><strong>Critério de aceitação:</strong> {m.criterioAceitacao}</div>
                  </div>
                  {m.comentarioCoordenacao && (
                    <div style={{
                      marginTop: 10, padding: "8px 12px", borderRadius: 8,
                      background: "rgba(245, 158, 11, 0.06)",
                      border: "1px dashed rgba(245, 158, 11, 0.25)",
                      fontSize: 13, color: "#fcd34d",
                    }}>
                      <strong>💬 Feedback da coordenação:</strong> {m.comentarioCoordenacao}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ PARECERES E AVALIAÇÕES (modular – preenchido quando houver) ═══ */}
        {data.avaliacoes?.length > 0 && (
          <div className="card">
            <h2 className="h2" style={{ fontSize: 20, marginBottom: 16 }}>Pareceres e Avaliações</h2>
            <div className="grid" style={{ gap: 12 }}>
              {data.avaliacoes.map((av: any, i: number) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${av.aprovado ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{av.aprovado ? "✅" : "⚠️"}</span>
                      <strong style={{ fontSize: 14 }}>{av.avaliador?.nome || "Avaliador"}</strong>
                      <span className="badge">{av.etapa}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      {new Date(av.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <p className="p" style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px" }}>{av.parecer}</p>

                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                    <span style={{ color: av.aprovado ? "var(--good)" : "var(--bad)", fontWeight: 600 }}>
                      {av.aprovado ? "Aprovado" : "Com pendências"}
                    </span>
                    {av.notaFinal !== null && av.notaFinal !== undefined && (
                      <span style={{ fontWeight: 600 }}>Nota Final: {av.notaFinal}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STATUS TIMELINE PLACEHOLDER (modular – para futuras versões) ═══ */}
        <div className="card" style={{ textAlign: "center", padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{st.icon}</span>
            <strong style={{ fontSize: 16 }}>Status atual: <span style={{ color: st.color }}>{st.label}</span></strong>
          </div>
          <p className="p" style={{ maxWidth: 500, margin: "0 auto", fontSize: 14 }}>
            {data.status === "SUBMETIDA" && "Sua proposta foi enviada ao comitê e está sendo avaliada. Você receberá o parecer por aqui mesmo assim que ele for emitido."}
            {data.status === "RASCUNHO" && "Esta proposta ainda está em rascunho. Finalize o preenchimento e envie ao comitê."}
            {data.status === "EM_TRIAGEM" && "O setor de triagem está analisando sua proposta."}
            {data.status === "CLASSIFICADA" && "Parabéns! Sua proposta foi classificada e está aguardando homologação."}
            {data.status === "HOMOLOGADA" && "Sua proposta foi homologada! Aguarde a geração do Termo de Outorga."}
            {data.status === "EM_EXECUCAO" && "Seu projeto está em execução. Acompanhe os marcos e submeta evidências."}
            {data.status === "CONCLUIDA" && "🎉 Seu projeto foi concluído com sucesso!"}
          </p>
          {data.status === "RASCUNHO" && (
            <Link href={`/propostas/nova?draft=${data.id}`} className="cta-btn cta-btn--primary" style={{ marginTop: 16, display: "inline-block" }}>
              ✏️ Continuar editando
            </Link>
          )}
        </div>

        {/* LEI BANNER */}
        <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="lei-banner" style={{ justifyContent: "center", padding: 18 }}>
          📋 <strong>Consulte a Lei Municipal de Inovação</strong> — Transparência e regras claras para todos os participantes
        </a>

      </div>
    </div>
  );
}
