"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PropostaMarcosPage({ params }: { params: { id: string } }) {
  const [proposta, setProposta] = useState<any>(null);
  const [marcos, setMarcos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state for evidence submission
  const [activeMarcoId, setActiveMarcoId] = useState<string | null>(null);
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

  async function submitEvidencia() {
    if (!activeMarcoId || !evidDesc) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/propostas/${params.id}/marcos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marcoId: activeMarcoId,
          tipo: evidTipo,
          url: evidUrl || null,
          descricao: evidDesc,
          publica: evidPublica,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setActiveMarcoId(null);
        setEvidTipo("LINK");
        setEvidUrl("");
        setEvidDesc("");
        fetchData();
      } else {
        alert(json.message || "Erro ao submeter evidência");
      }
    } catch {
      alert("Falha de rede");
    }
    setSubmitting(false);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="h1">Meus Marcos – {proposta?.titulo}</h1>
        <Link href="/painel" className="btn secondary">Voltar ao Painel</Link>
      </div>

      <p className="p">
        Submeta evidências mês a mês. O coordenador irá Validar, Solicitar Ajuste ou Rejeitar cada marco.
        Marcos validados habilitam o pagamento da bolsa correspondente.
      </p>

      {marcos.map((m) => (
        <div className="card" key={m.id} style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: 15 }}>Mês {m.mes}</strong>
              <span className="badge" style={{ marginLeft: 10 }}>{statusIcon[m.status]} {m.status}</span>
            </div>
            {["PENDENTE", "AJUSTE_SOLICITADO"].includes(m.status) && (
              <button
                className="btn secondary"
                onClick={() => setActiveMarcoId(activeMarcoId === m.id ? null : m.id)}
              >
                {activeMarcoId === m.id ? "Cancelar" : "📎 Submeter Evidência"}
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
              <p className="p" style={{ margin: "5px 0 0" }}>{m.comentarioCoordenacao}</p>
            </div>
          )}

          {/* Evidências já submetidas */}
          {m.evidencias?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <strong style={{ fontSize: 12, color: "var(--muted)" }}>Evidências Enviadas:</strong>
              {m.evidencias.map((ev: any) => (
                <div key={ev.id} style={{ padding: 8, marginTop: 6, background: "rgba(255,255,255,0.02)", borderRadius: 6, fontSize: 13 }}>
                  <span className="badge">{ev.tipo}</span> {ev.descricao}
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 10, color: "var(--accent)" }}>
                      🔗 Abrir
                    </a>
                  )}
                  <span style={{ float: "right", color: "var(--muted)", fontSize: 11 }}>
                    {new Date(ev.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Formulário de nova evidência */}
          {activeMarcoId === m.id && (
            <div className="card" style={{ padding: 14, marginTop: 14, borderColor: "var(--accent)" }}>
              <strong style={{ fontSize: 13 }}>Nova Evidência para Mês {m.mes}</strong>
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
              <button className="btn" onClick={submitEvidencia} disabled={submitting || !evidDesc} style={{ marginTop: 14 }}>
                {submitting ? "Enviando..." : "Enviar Evidência"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
