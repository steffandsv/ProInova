"use client";

import { useEffect, useState } from "react";

export default function ProjetoPublicoPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/projeto/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.data);
        else setError(res.error || "Projeto não encontrado");
        setLoading(false);
      })
      .catch(() => { setError("Falha de rede"); setLoading(false); });
  }, [params.id]);

  const statusIcon: Record<string, string> = {
    PENDENTE: "⏳ Pendente",
    SUBMETIDO: "📤 Submetido",
    VALIDADO: "✅ Validado",
    AJUSTE_SOLICITADO: "🔄 Em Ajuste",
    REJEITADO: "❌ Rejeitado",
  };

  if (loading) return <div className="card"><p className="p">Carregando projeto...</p></div>;
  if (error) return <div className="card"><h1 className="h1">Projeto não encontrado</h1><p className="p">{error}</p></div>;

  const totalMarcos = data.marcos?.length || 0;
  const validados = data.marcos?.filter((m: any) => m.status === "VALIDADO").length || 0;
  const progresso = totalMarcos > 0 ? Math.round((validados / totalMarcos) * 100) : 0;

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="h1">{data.titulo}</h1>
            <p className="p" style={{ marginTop: 5 }}>
              <span className="badge">{data.edital?.modalidade}</span>
              <span style={{ marginLeft: 10, color: "var(--muted)", fontSize: 13 }}>
                Edital: {data.edital?.titulo} | Duração: {data.duracaoMeses} meses
              </span>
            </p>
          </div>
          <span className="badge" style={{ fontSize: 14, padding: "8px 16px" }}>
            {data.status === "EM_EXECUCAO" ? "⚙️ Em Execução" : "🏁 Concluído"}
          </span>
        </div>
      </div>

      {/* Progresso */}
      <div className="card">
        <h2 className="h2">Progresso do Projeto</h2>
        <div style={{ marginTop: 14, background: "var(--bg)", borderRadius: 8, overflow: "hidden", height: 28 }}>
          <div style={{
            width: `${progresso}%`,
            height: "100%",
            background: "linear-gradient(90deg, var(--accent), var(--good))",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 13,
            minWidth: progresso > 5 ? "auto" : 0,
            transition: "width 0.5s ease",
          }}>
            {progresso > 5 && `${progresso}%`}
          </div>
        </div>
        <p className="p" style={{ marginTop: 8, fontSize: 13 }}>
          {validados} de {totalMarcos} marcos validados ({progresso}%)
        </p>
      </div>

      {/* Resumo */}
      <div className="card">
        <h2 className="h2">Sobre o Projeto</h2>
        <p className="p" style={{ marginTop: 10 }}>{data.resumo}</p>
        {!data.sigiloso && (
          <>
            <h3 className="h3" style={{ marginTop: 20 }}>O Problema</h3>
            <p className="p">{data.problema}</p>
            <h3 className="h3" style={{ marginTop: 20 }}>Proposta de Valor</h3>
            <p className="p">{data.propostaValor}</p>
            <h3 className="h3" style={{ marginTop: 20 }}>Indicadores de Sucesso</h3>
            <p className="p">{data.indicadores}</p>
          </>
        )}
        {data.sigiloso && (
          <div className="card" style={{ marginTop: 14, borderColor: "var(--warn)", padding: 14 }}>
            <p className="p" style={{ fontStyle: "italic", color: "var(--warn)" }}>
              🔒 Este projeto possui informações sob sigilo (Art. 19, parágrafo único). Detalhes técnicos não são exibidos publicamente.
            </p>
          </div>
        )}
      </div>

      {/* Equipe */}
      <div className="card">
        <h2 className="h2">Equipe do Projeto</h2>
        <div className="grid two" style={{ marginTop: 14 }}>
          {data.equipe?.map((eq: any, i: number) => (
            <div key={i} style={{ padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
              <strong>{eq.nome}</strong>
              {eq.vinculoEstudantil && <span style={{ marginLeft: 10, fontSize: 12, color: "var(--muted)" }}>{eq.vinculoEstudantil}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Cronograma / Marcos */}
      <div className="card">
        <h2 className="h2">Cronograma e Entregas</h2>
        <div className="grid" style={{ gap: 12, marginTop: 14 }}>
          {data.marcos?.map((m: any) => (
            <div key={m.id} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>Mês {m.mes}</strong>
                <span className="badge">{statusIcon[m.status] || m.status}</span>
              </div>
              <p className="p" style={{ marginTop: 8, fontSize: 13 }}><strong>Entregável:</strong> {m.entregavel}</p>

              {/* Evidências públicas */}
              {m.evidencias?.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <strong style={{ fontSize: 12, color: "var(--muted)" }}>Evidências Públicas:</strong>
                  {m.evidencias.map((ev: any) => (
                    <div key={ev.id} style={{ marginTop: 6, fontSize: 13, padding: 8, background: "rgba(255,255,255,0.02)", borderRadius: 4 }}>
                      <span className="badge">{ev.tipo}</span> {ev.descricao}
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 10, color: "var(--accent)" }}>
                          🔗 Ver
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="card" style={{ textAlign: "center", padding: 20, fontSize: 12, color: "var(--muted)" }}>
        <p>Programa Municipal de Fomento à Inovação – ProInova Jaborandi</p>
        <p>Transparência pública conforme Art. 19 e 20 da Lei Municipal.</p>
      </div>
    </div>
  );
}
