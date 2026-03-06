"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPropostaDetail({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [parecerTexto, setParecerTexto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    CANCELADA: "var(--bad)",
    CONCLUIDA: "var(--good)",
  };

  async function handleTransition(to: string) {
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/propostas/${params.id}/avaliar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRANSITION",
          nextStatus: to,
          parecerTexto,
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

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h1 className="h1">Protocolo {data.id.split("-")[0].toUpperCase()}</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
           <span className="badge" style={{ backgroundColor: statusColors[data.status] || "var(--border)", color: "#fff", padding: "5px 10px", fontSize: 13 }}>
             STATUS: {data.status}
           </span>
           <Link href="/admin/propostas" className="btn secondary">Voltar</Link>
        </div>
      </div>

      {/* LEI Reference */}
      <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="lei-banner">
        📋 <strong>Consulte a Lei Municipal de Inovação</strong> — Referência para avaliação
      </a>

      {/* ======================= TELA DE AVALIAÇÃO / TRANSIÇÃO ======================= */}
      {data.availableTransitions?.length > 0 && (
        <div className="card" style={{ borderColor: "var(--accent)", background: "rgba(0,123,255,0.05)" }}>
          <h2 className="h2" style={{ color: "var(--accent)", marginBottom: 14 }}>Ações de Workflow Disponíveis</h2>
          <p className="p">Seu perfil tem permissão para atuar nesta proposta no estágio atual.</p>
          
          <div className="row" style={{ marginTop: 14 }}>
            <div className="label">Parecer / Observação (Ficará no Histórico)</div>
            <textarea 
              className="textarea" 
              value={parecerTexto} 
              onChange={(e) => setParecerTexto(e.target.value)} 
              placeholder="Descreva o motivo da aprovação ou necessidade de ajustes..." 
              required
            />
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {data.availableTransitions.map((t: any) => {
              if (t.from === "AVALIACAO_CMAA" && t.to === "CLASSIFICADA") {
                return (
                  <Link key={t.to} href={`/admin/propostas/${data.id}/avaliar`} className="btn">
                    📋 Ir para Matriz de Avaliação CMAA
                  </Link>
                );
              }
              if (t.from === "HOMOLOGADA" && t.to === "TERMO_OUTORGA") {
                return (
                  <Link key={t.to} href={`/admin/propostas/${data.id}/termo`} className="btn">
                    📄 Gerar Termo de Outorga
                  </Link>
                );
              }

              const isBackward = ["SUBMETIDA", "EM_TRIAGEM", "SUSPENSA", "CANCELADA"].includes(t.to);
              
              return (
                <button 
                  key={t.to} 
                  className={isBackward ? "btn secondary" : "btn"} 
                  onClick={() => handleTransition(t.to)}
                  disabled={isSubmitting || (t.from !== "RASCUNHO" && !parecerTexto && !isBackward)}
                >
                  {isSubmitting ? "..." : `Mover para ${t.to}`}
                </button>
              );
            })}
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
              <div key={i} style={{ padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 6, marginBottom: 10, fontSize: 13, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <strong>{av.avaliador.nome} <span className="badge">{av.etapa}</span></strong>
                  <span style={{ color: "var(--muted)" }}>{new Date(av.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <div className="prose" style={{ marginTop: 5 }}>{av.parecer}</div>
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
  );
}
