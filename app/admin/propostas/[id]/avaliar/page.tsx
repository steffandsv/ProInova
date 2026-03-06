"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPropostaAvaliarCMAA({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [parecerTexto, setParecerTexto] = useState("");
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/propostas/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setData(res.data);
          // init notas: Default value 5
          const initialNotas: any = {};
          if (res.data.edital?.config?.pesosMatrizJson) {
             const pesos = res.data.edital.config.pesosMatrizJson;
             pesos.forEach((p: any) => {
               initialNotas[p.criterio] = 5;
             });
          }
          setNotas(initialNotas);
        } else {
          setError(res.error || "Erro ao carregar");
        }
        setLoading(false);
      })
      .catch(() => setError("Falha de rede"));
  }, [params.id]);

  if (loading) return <div className="card"><p className="p">Carregando formulário...</p></div>;
  if (error || !data) return <div className="card"><p className="p" style={{ color: "var(--bad)" }}>{error}</p></div>;

  // Garantir que estamos na etapa certa
  if (data.status !== "AVALIACAO_CMAA") {
    return (
      <div className="card">
        <p className="p" style={{ color: "var(--bad)" }}>O protocolo não está na etapa de avaliação do CMAA.</p>
        <Link href={`/admin/propostas/${data.id}`} className="btn secondary" style={{ marginTop: 14 }}>Voltar para a Proposta</Link>
      </div>
    );
  }

  const pesos = data.edital?.config?.pesosMatrizJson || [];

  // Calcular Nota Final Acumulada
  let notaFinal = 0;
  const notaJson: any[] = [];
  pesos.forEach((p: any) => {
    const val = notas[p.criterio] || 0;
    const parcial = val * p.peso;
    notaFinal += parcial;
    notaJson.push({
      criterio: p.criterio,
      nota: val,
      peso: p.peso,
      parcial
    });
  });

  async function submitAvaliacao(aprovado: boolean) {
    if (!parecerTexto) {
      alert("O Parecer Técnico é obrigatório.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/propostas/${params.id}/avaliar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRANSITION",
          nextStatus: aprovado ? "CLASSIFICADA" : "EM_TRIAGEM", // volta se reprovar?
          parecerTexto,
          notaFinal,
          aprovado,
          notaJson
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.message || "Erro na avaliação");
        setIsSubmitting(false);
      } else {
        router.push(`/admin/propostas/${params.id}`);
      }
    } catch {
      alert("Falha de rede");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h1 className="h1">Matriz de Avaliação (CMAA)</h1>
          <Link href={`/admin/propostas/${data.id}`} className="btn secondary">Voltar para Proposta</Link>
        </div>
        <p className="p" style={{ marginBottom: 20 }}>
          Protocolo: <strong>{data.id.split("-")[0].toUpperCase()}</strong> ({data.titulo})
        </p>

        <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="lei-banner" style={{ marginBottom: 20 }}>
          📋 <strong>Consulte a Lei Municipal de Inovação</strong> — Referência para avaliação pelo CMAA
        </a>

        {pesos.length === 0 ? (
          <div className="card" style={{ borderColor: "var(--warn)" }}>
            <p className="p">O Edital não possui configuração de Pesos da Matriz. Apenas o parecer técnico será enviado.</p>
          </div>
        ) : (
          <table className="table" style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: 10, textAlign: "left" }}>Critério (Anexo III)</th>
                <th style={{ padding: 10, textAlign: "center", width: 80 }}>Peso</th>
                <th style={{ padding: 10, textAlign: "center", width: 120 }}>Nota (0-10)</th>
                <th style={{ padding: 10, textAlign: "center", width: 120 }}>Pontuação</th>
              </tr>
            </thead>
            <tbody>
              {pesos.map((p: any, i: number) => {
                const numVal = notas[p.criterio] || 0;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 10, lineHeight: 1.4 }}>{p.criterio}</td>
                    <td style={{ padding: 10, textAlign: "center" }}>x {p.peso}</td>
                    <td style={{ padding: 10 }}>
                      <input 
                        className="input" 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.5"
                        value={numVal} 
                        onChange={(e) => setNotas({...notas, [p.criterio]: Number(e.target.value)})}
                        style={{ textAlign: "center" }}
                      />
                    </td>
                    <td style={{ padding: 10, textAlign: "center", fontWeight: "bold" }}>
                      {(numVal * p.peso).toFixed(1)}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                <td colSpan={3} style={{ padding: 14, textAlign: "right", fontSize: 16 }}><strong>Nota Final Ponderada:</strong></td>
                <td style={{ padding: 14, textAlign: "center", fontSize: 18, fontWeight: "bold", color: "var(--accent)" }}>
                  {notaFinal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <div className="row" style={{ marginTop: 24 }}>
          <div className="label">Parecer Técnico da Comissão (CMAA)</div>
          <textarea 
            className="textarea" 
            style={{ minHeight: 120 }}
            value={parecerTexto}
            onChange={(e) => setParecerTexto(e.target.value)}
            placeholder="Apresente a justificativa técnica para as notas atribuídas..."
          />
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
          <button 
            className="btn" 
            onClick={() => submitAvaliacao(true)} 
            disabled={isSubmitting || !parecerTexto}
          >
            {isSubmitting ? "Enviando..." : `Aprovar com Nota ${notaFinal.toFixed(1)}`}
          </button>
          <button 
            className="btn secondary" 
            onClick={() => submitAvaliacao(false)} 
            disabled={isSubmitting || !parecerTexto}
            style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
          >
            {isSubmitting ? "..." : "Devolver com Falhas"}
          </button>
        </div>
      </div>
    </div>
  );
}
