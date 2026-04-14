"use client";

import { useEffect, useState } from "react";

export default function ModalProjeto({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/projeto/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.data);
        else setError(res.error || "Erro ao carregar");
        setLoading(false);
      })
      .catch(() => setError("Falha de rede"));
  }, [id]);

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

  function scoreTier(score: number): "good" | "warn" | "bad" {
    if (score >= 7) return "good";
    if (score >= 5) return "warn";
    return "bad";
  }

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.85)",
      zIndex: 9999,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: 20
    }}>
      <div style={{
        background: "var(--bg)",
        width: "100%", maxWidth: 900,
        height: "100%", maxHeight: "90vh",
        borderRadius: 14,
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
      }}>
        <div style={{
          position: "sticky", top: 0,
          background: "var(--card-bg)",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          zIndex: 10
        }}>
          <h2 className="h2" style={{ margin: 0, fontSize: 18 }}>Visualização de Projeto</h2>
          <button className="btn secondary" onClick={onClose}>Fechar (X)</button>
        </div>

        <div style={{ padding: 24 }} className="grid">
          {loading && <p className="p">Carregando dados completos do projeto...</p>}
          {error && <p className="p" style={{ color: "var(--bad)" }}>{error}</p>}
          
          {data && (
            <div className="grid" style={{ gap: 20 }}>
              
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
                  {data.pdfPropostaUrl && !data.sigiloso && (
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
                  </div>
                </div>
              </div>

              <div className="card" style={{ overflow: "hidden" }}>
                <h3 className="h3" style={{ marginBottom: 14 }}>Conteúdo Principal</h3>
                
                <strong style={{ fontSize: 12 }}>Resumo Executivo</strong>
                <div className="prose" style={{ marginTop: 5, marginBottom: 15, fontSize: 13, color: "var(--muted)" }}>{data.resumo}</div>
                
                {data.sigiloso ? (
                  <p className="p" style={{ color: "var(--warn)", fontStyle: "italic", padding: 14, background: "rgba(245, 158, 11, 0.1)", borderRadius: 6 }}>
                    🔒 Este projeto foi marcado como sigiloso pelo autor e avalizado pelo comitê. As informações vitais não estão disponíveis para acesso público integral, de acordo com o Art. 19 da Lei Municipal de Inovação.
                  </p>
                ) : (
                  <>
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

                    <strong style={{ fontSize: 12 }}>Orçamento e Rateio Estimado</strong>
                    <div style={{ marginTop: 5, marginBottom: 15 }}>{renderHtml(data.orcamentoRateio)}</div>
                  </>
                )}
              </div>

              {/* ======================= EQUIPE ======================= */}
              <div className="card" style={{ overflowX: "auto" }}>
                <h3 className="h3" style={{ marginBottom: 14 }}>Equipe (Registro Público)</h3>
                <table className="table" style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: 8, textAlign: "left" }}>Nome</th>
                      <th style={{ padding: 8, textAlign: "center" }}>Menor Idd.</th>
                      <th style={{ padding: 8, textAlign: "left" }}>Vínculo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.equipe.map((eq: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: 8, wordBreak: "break-word" }}>{eq.nome}</td>
                        <td style={{ padding: 8, textAlign: "center" }}>{eq.ehMenor ? "Sim" : "Não"}</td>
                        <td style={{ padding: 8, fontSize: 11, wordBreak: "break-word" }}>{eq.vinculoEstudantil || "—"}</td>
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
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
