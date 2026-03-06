"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_PESOS = [
  { criterio: "Relevância do Problema (0-10)", peso: 2 },
  { criterio: "Impacto da Solução (0-10)", peso: 3 },
  { criterio: "Metodologia e Entregas (0-10)", peso: 2 },
  { criterio: "Viabilidade (0-10)", peso: 2 },
  { criterio: "Indicadores e Custos (0-10)", peso: 1 },
];

export default function EditalFormPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "novo";
  const router = useRouter();

  const [state, setState] = useState({
    titulo: "",
    descricao: "",
    modalidade: "GERAL",
    status: "RASCUNHO",
    abreEm: "",
    fechaEm: "",
    config: {
      linhasTematicas: "Educação Digital, Saúde, Governo Digital", // CSV temporarily
      tetoMensal: 600,
      duracaoMaxMeses: 12,
      pesosMatrizJson: DEFAULT_PESOS,
    },
  });

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(!isNew);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/editais/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          const d = res.data;
          setState({
            ...d,
            abreEm: d.abreEm ? new Date(d.abreEm).toISOString().slice(0, 16) : "",
            fechaEm: d.fechaEm ? new Date(d.fechaEm).toISOString().slice(0, 16) : "",
            config: {
              ...d.config,
              linhasTematicas: Array.isArray(d.config.linhasTematicas)
                ? d.config.linhasTematicas.join(", ")
                : "",
              pesosMatrizJson: Array.isArray(d.config.pesosMatrizJson)
                ? d.config.pesosMatrizJson
                : DEFAULT_PESOS,
            },
          });
        }
        setInitLoading(false);
      });
  }, [isNew, params.id]);

  function set<K extends keyof typeof state>(key: K, value: typeof state[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function setConfig<K extends keyof typeof state.config>(key: K, value: typeof state.config[K]) {
    setState((s) => ({ ...s, config: { ...s.config, [key]: value } }));
  }

  async function salvar() {
    setLoading(true);
    setMsg("");
    try {
      const parsedConfig = {
        ...state.config,
        linhasTematicas: state.config.linhasTematicas.split(",").map((s: string) => s.trim()).filter(Boolean),
      };

      const payload = {
        ...state,
        abreEm: state.abreEm ? new Date(state.abreEm).toISOString() : "",
        fechaEm: state.fechaEm ? new Date(state.fechaEm).toISOString() : "",
        config: parsedConfig,
      };

      const res = await fetch(isNew ? "/api/admin/editais" : `/api/admin/editais/${params.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setMsg(json.message + (json.errors ? " Verifique os campos." : ""));
        setLoading(false);
        return;
      }

      router.push("/admin/editais");
      router.refresh();
    } catch {
      setMsg("Falha ao salvar.");
      setLoading(false);
    }
  }

  if (initLoading) return <div className="card"><p className="p">Carregando...</p></div>;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h1 className="h1">{isNew ? "Novo Edital" : "Editar Edital"}</h1>
        
        <div className="grid two">
          <div className="row">
            <div className="label">Título</div>
            <input className="input" value={state.titulo} onChange={(e) => set("titulo", e.target.value)} />
          </div>
          <div className="row">
            <div className="label">Status</div>
            <select className="select" value={state.status} onChange={(e) => set("status", e.target.value)}>
              <option value="RASCUNHO">Rascunho</option>
              <option value="ABERTO">Aberto</option>
              <option value="ENCERRADO">Encerrado</option>
            </select>
          </div>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <div className="label">Descrição</div>
          <textarea className="textarea" value={state.descricao} onChange={(e) => set("descricao", e.target.value)} />
        </div>

        <div className="grid two" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="label">Data de Abertura</div>
            <input className="input" type="datetime-local" value={state.abreEm} onChange={(e) => set("abreEm", e.target.value)} />
          </div>
          <div className="row">
            <div className="label">Data de Fechamento</div>
            <input className="input" type="datetime-local" value={state.fechaEm} onChange={(e) => set("fechaEm", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="h1" style={{ fontSize: 20 }}>Configurações do Edital</h2>
        
        <div className="grid two">
          <div className="row">
            <div className="label">Modalidade de Fomento</div>
            <select className="select" value={state.modalidade} onChange={(e) => set("modalidade", e.target.value)}>
              <option value="EDUCACAO">ProInova Educação (Art. 7)</option>
              <option value="GERAL">ProInova Geral (Art. 8)</option>
            </select>
          </div>
          <div className="row">
            <div className="label">Linhas Temáticas Permitidas (separadas por vírgula)</div>
            <input className="input" value={state.config.linhasTematicas} onChange={(e) => setConfig("linhasTematicas", e.target.value)} />
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="label">Teto Mensal da Bolsa (R$)</div>
            <input className="input" type="number" step="0.01" value={state.config.tetoMensal} onChange={(e) => setConfig("tetoMensal", Number(e.target.value))} />
          </div>
          <div className="row">
            <div className="label">Duração Máxima (Meses)</div>
            <input className="input" type="number" min="1" max="24" value={state.config.duracaoMaxMeses} onChange={(e) => setConfig("duracaoMaxMeses", Number(e.target.value))} />
          </div>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <div className="label">Critérios de Avaliação (Anexo III)</div>
          <p className="p" style={{ fontSize: 13, margin: "0 0 8px" }}>A matriz será gerada com estes critérios e pesos.</p>
          <div className="card" style={{ padding: 12 }}>
            {state.config.pesosMatrizJson.map((crit, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input className="input" value={crit.criterio} onChange={(e) => {
                  const arr = [...state.config.pesosMatrizJson];
                  arr[idx].criterio = e.target.value;
                  setConfig("pesosMatrizJson", arr);
                }} placeholder="Nome do critério" />
                <input className="input" type="number" style={{ width: 100 }} value={crit.peso} onChange={(e) => {
                  const arr = [...state.config.pesosMatrizJson];
                  arr[idx].peso = Number(e.target.value);
                  setConfig("pesosMatrizJson", arr);
                }} placeholder="Peso" title="Peso" />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
          <button className="btn" onClick={salvar} disabled={loading}>{loading ? "Salvando..." : "Salvar Edital"}</button>
          <a href="/admin/editais" className="btn secondary">Cancelar</a>
          {msg && <span className="p" style={{ margin: 0, color: "var(--bad)" }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}
