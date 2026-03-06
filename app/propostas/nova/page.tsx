"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const CronogramaItem = z.object({
  mes: z.number().int().min(1),
  entregavel: z.string().min(10),
  evidencia: z.string().min(5),
  criterioAceitacao: z.string().min(10),
});

const EquipeMembroItem = z.object({
  cpf: z.string().min(11),
  nome: z.string().min(3),
  dataNasc: z.string().optional(),
  vinculoEstudantil: z.string().optional(),
  ehMenor: z.boolean(),
  responsavelLegal: z.string().optional(),
  cpfResponsavel: z.string().optional(),
  percentualRateio: z.number().min(0).max(100),
});

const PropostaSchema = z.object({
  editalId: z.string().min(1),
  titulo: z.string().min(5),
  resumo: z.string().min(50).max(1000),
  linhaTematica: z.string().min(3),
  duracaoMeses: z.number().int().min(1).max(24),
  problema: z.string().min(80),
  publicoAlvo: z.string().min(30),
  propostaValor: z.string().min(80),
  solucao: z.string().min(80),
  metodologia: z.string().min(60),
  viabilidade: z.string().min(60),
  riscos: z.string().min(60),
  indicadores: z.string().min(40),
  orcamentoRateio: z.string().min(40),
  paginaPublicaPlano: z.string().min(40),
  ipConcorda: z.boolean().refine((v) => v === true, "Você precisa concordar com IP/confidencialidade"),
  cronograma: z.array(CronogramaItem).min(1),
  equipe: z.array(EquipeMembroItem).min(1),
});

type PropostaInput = z.infer<typeof PropostaSchema>;

export default function NovaPropostaPage() {
  const [editais, setEditais] = useState<any[]>([]);
  const [fetchingEditais, setFetchingEditais] = useState(true);

  const [state, setState] = useState<PropostaInput>({
    editalId: "",
    titulo: "",
    resumo: "",
    linhaTematica: "",
    duracaoMeses: 4,
    problema: "",
    publicoAlvo: "",
    propostaValor: "",
    solucao: "",
    metodologia: "",
    viabilidade: "",
    riscos: "",
    indicadores: "",
    orcamentoRateio: "",
    paginaPublicaPlano: "",
    ipConcorda: false,
    cronograma: [{ mes: 1, entregavel: "", evidencia: "", criterioAceitacao: "" }],
    equipe: [{ cpf: "", nome: "", dataNasc: "", vinculoEstudantil: "", ehMenor: false, responsavelLegal: "", cpfResponsavel: "", percentualRateio: 100 }],
  });

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/editais/abertos")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setEditais(res.data);
          if (res.data.length > 0) {
            set("editalId", res.data[0].id);
          }
        }
        setFetchingEditais(false);
      });
  }, []);

  const hasMetric = /(\b%\b|\bR\$\b|\bmin\b|\balunos\b|\busuários\b|\batendimentos\b)/i.test(state.indicadores);
  const hasRisk = /(segurança|lgpd|risco|privacidade|fraude|manutenção|adesão|treinamento)/i.test(state.riscos);
  const cronBad = state.cronograma.some((i) => i.entregavel.trim().length < 10 || i.criterioAceitacao.trim().length < 10);
  const rateioSum = state.equipe.reduce((acc, m) => acc + m.percentualRateio, 0);

  const scoreHints = useMemo(() => {
    const hints: string[] = [];
    if (!hasMetric) hints.push("Indicadores parecem genéricos. Coloque número-base e meta (ex.: de X para Y).");
    if (!hasRisk) hints.push("Riscos: cite pelo menos 1 risco operacional + 1 risco de adoção + mitigação.");
    if (cronBad) hints.push("Cronograma: cada mês precisa de entregável + critério de aceitação verificável.");
    if (Math.abs(rateioSum - 100) > 0.01 && rateioSum !== 0) hints.push("Atenção: A soma do percentual de rateio da bolsa da equipe deve ser 100% ou 0%.");
    return hints;
  }, [hasMetric, hasRisk, cronBad, rateioSum]);

  function set<K extends keyof PropostaInput>(key: K, value: PropostaInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function updateCron(index: number, patch: Partial<PropostaInput["cronograma"][number]>) {
    setState((s) => ({
      ...s,
      cronograma: s.cronograma.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function updateEq(index: number, patch: Partial<PropostaInput["equipe"][number]>) {
    setState((s) => ({
      ...s,
      equipe: s.equipe.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function addMes() {
    setState((s) => ({
      ...s,
      cronograma: [...s.cronograma, { mes: s.cronograma.length + 1, entregavel: "", evidencia: "", criterioAceitacao: "" }],
    }));
  }

  function addMembro() {
    setState((s) => ({
      ...s,
      equipe: [...s.equipe, { cpf: "", nome: "", dataNasc: "", vinculoEstudantil: "", ehMenor: false, responsavelLegal: "", cpfResponsavel: "", percentualRateio: 0 }],
    }));
  }

  async function submit() {
    setMsg(null);
    const parsed = PropostaSchema.safeParse(state);
    if (!parsed.success) {
      setMsg(parsed.error.issues[0]?.message || "Revise os campos. Verifique CPFs e comprimentos mínimos de texto.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/propostas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json?.message || "Erro ao enviar proposta.");
        setLoading(false);
        return;
      }
      window.location.href = "/painel";
    } catch {
      setMsg("Falha de rede. Tente novamente.");
      setLoading(false);
    }
  }

  if (fetchingEditais) return <div className="card"><p className="p">Carregando formulário...</p></div>;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h1 className="h1">Nova proposta</h1>
        <p className="p">
          Este formulário é propositalmente exigente. A meta é impedir proposta genérica e facilitar avaliação objetiva:
          problema → solução → equipe → entregas mensais → evidências → impacto.
        </p>

        {scoreHints.length > 0 && (
          <div className="card" style={{ padding: 14, borderColor: "var(--warn)" }}>
            <div className="badge"><strong>Guardrails</strong> problemas encontrados</div>
            <ul style={{ margin: "10px 0 0", color: "var(--text)", lineHeight: 1.5 }}>
              {scoreHints.map((h, idx) => <li key={idx}>{h}</li>)}
            </ul>
          </div>
        )}

        <div className="row" style={{ marginTop: 14 }}>
          <div className="label">Edital</div>
          <select className="select" value={state.editalId} onChange={(e) => set("editalId", e.target.value)}>
            {editais.length === 0 && <option value="">Nenhum edital aberto no momento</option>}
            {editais.map((ed) => (
              <option key={ed.id} value={ed.id}>{ed.titulo} ({ed.modalidade})</option>
            ))}
          </select>
        </div>

        <div className="grid two" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="label">Título</div>
            <input className="input" value={state.titulo} onChange={(e) => set("titulo", e.target.value)} />
          </div>
          <div className="row">
            <div className="label">Linha temática</div>
            <input className="input" value={state.linhaTematica} onChange={(e) => set("linhaTematica", e.target.value)} placeholder="ex.: educação digital, saúde, turismo..." />
          </div>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <div className="label">Duração (meses)</div>
          <input className="input" type="number" value={state.duracaoMeses} onChange={(e) => set("duracaoMeses", Number(e.target.value) as any)} min={1} max={24} />
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <div className="label">Resumo executivo (até 1.000 caracteres)</div>
          <textarea className="textarea" value={state.resumo} onChange={(e) => set("resumo", e.target.value)} />
        </div>

        {/* ========================================================= */}
        {/* EQUIPE */}
        {/* ========================================================= */}
        <div className="card" style={{ padding: 14, marginTop: 14, borderColor: Math.abs(rateioSum - 100) > 0.01 && rateioSum !== 0 ? "var(--warn)" : "var(--border)" }}>
          <div className="badge"><strong>Equipe do Projeto</strong> {rateioSum}% da bolsa distribuída</div>
          <p className="p" style={{ marginTop: 10, fontSize: 13 }}>
            Adicione todos os membros. A soma do rateio da bolsa deve dar 100% ou 0%. Se houver algum menor de idade (&lt; 18 anos), marque a caixa e preencha os dados do responsável legal. O primeiro membro é o proponente.
          </p>
          <div className="grid" style={{ gap: 12 }}>
            {state.equipe.map((it, idx) => (
              <div className="card" key={idx} style={{ padding: 14 }}>
                <div className="grid two">
                  <div className="row">
                    <div className="label">Nome</div>
                    <input className="input" value={it.nome} onChange={(e) => updateEq(idx, { nome: e.target.value })} />
                  </div>
                  <div className="row">
                    <div className="label">CPF (somente números)</div>
                    <input className="input" value={it.cpf} onChange={(e) => updateEq(idx, { cpf: e.target.value })} />
                  </div>
                </div>
                <div className="grid two" style={{ marginTop: 10 }}>
                  <div className="row">
                    <div className="label">Vínculo estudantil (escola/ano) - opcional</div>
                    <input className="input" value={it.vinculoEstudantil} onChange={(e) => updateEq(idx, { vinculoEstudantil: e.target.value })} />
                  </div>
                   <div className="row">
                    <div className="label">Rateio da Bolsa (%)</div>
                    <input className="input" type="number" min="0" max="100" value={it.percentualRateio} onChange={(e) => updateEq(idx, { percentualRateio: Number(e.target.value) })} />
                  </div>
                </div>

                <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
                  <input type="checkbox" checked={it.ehMenor} onChange={(e) => updateEq(idx, { ehMenor: e.target.checked })} />
                  <span className="p" style={{ margin: 0 }}>Membro é menor de 18 anos</span>
                </label>

                {it.ehMenor && (
                  <div className="grid two" style={{ marginTop: 10, padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
                    <div className="row">
                      <div className="label">Nome do Responsável Legal</div>
                      <input className="input" value={it.responsavelLegal} onChange={(e) => updateEq(idx, { responsavelLegal: e.target.value })} />
                    </div>
                    <div className="row">
                      <div className="label">CPF do Responsável</div>
                      <input className="input" value={it.cpfResponsavel} onChange={(e) => updateEq(idx, { cpfResponsavel: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button className="btn secondary" onClick={addMembro} type="button">Adicionar membro</button>
          </div>
        </div>


        <div className="grid two" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="label">Problema (com evidência do problema)</div>
            <textarea className="textarea" value={state.problema} onChange={(e) => set("problema", e.target.value)} placeholder="Qual é o gargalo hoje? Quem sofre? Como você sabe que isso é real?" />
          </div>
          <div className="row">
            <div className="label">Público-alvo (quantidade e contexto)</div>
            <textarea className="textarea" value={state.publicoAlvo} onChange={(e) => set("publicoAlvo", e.target.value)} placeholder="Quem vai usar? Onde? Com quais limitações?" />
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="label">Proposta de valor (benefício para município/sociedade)</div>
            <textarea className="textarea" value={state.propostaValor} onChange={(e) => set("propostaValor", e.target.value)} />
          </div>
          <div className="row">
            <div className="label">Solução (o que você vai construir e o que NÃO vai)</div>
            <textarea className="textarea" value={state.solucao} onChange={(e) => set("solucao", e.target.value)} />
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="label">Metodologia (como você trabalha e valida com usuários)</div>
            <textarea className="textarea" value={state.metodologia} onChange={(e) => set("metodologia", e.target.value)} />
          </div>
          <div className="row">
            <div className="label">Viabilidade (recursos, acessos, dependências)</div>
            <textarea className="textarea" value={state.viabilidade} onChange={(e) => set("viabilidade", e.target.value)} />
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="label">Riscos e mitigação</div>
            <textarea className="textarea" value={state.riscos} onChange={(e) => set("riscos", e.target.value)} />
          </div>
          <div className="row">
            <div className="label">Indicadores e critérios de sucesso (com número)</div>
            <textarea className="textarea" value={state.indicadores} onChange={(e) => set("indicadores", e.target.value)} />
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="label">Orçamento e rateio extra / materiais (justificativa)</div>
            <textarea className="textarea" value={state.orcamentoRateio} onChange={(e) => set("orcamentoRateio", e.target.value)} />
          </div>
          <div className="row">
            <div className="label">Página pública: como mostrar evolução sem expor segredos/dados</div>
            <textarea className="textarea" value={state.paginaPublicaPlano} onChange={(e) => set("paginaPublicaPlano", e.target.value)} />
          </div>
        </div>

        {/* ========================================================= */}
        {/* CRONOGRAMA */}
        {/* ========================================================= */}
        <div className="card" style={{ padding: 14, marginTop: 14 }}>
          <div className="badge"><strong>Cronograma mensal</strong> entregáveis + evidências</div>
          <p className="p" style={{ marginTop: 10 }}>
            Para cada mês: 1) entregável verificável, 2) evidência anexável/publicável, 3) critério de aceitação.
          </p>
          <div className="grid" style={{ gap: 12 }}>
            {state.cronograma.map((it, idx) => (
              <div className="card" key={idx} style={{ padding: 14 }}>
                <div className="badge"><strong>Mês {it.mes}</strong></div>
                <div className="grid two" style={{ marginTop: 10 }}>
                  <div className="row">
                    <div className="label">Entregável</div>
                    <input className="input" value={it.entregavel} onChange={(e) => updateCron(idx, { entregavel: e.target.value })} placeholder="ex.: protótipo funcional + manual curto" />
                  </div>
                  <div className="row">
                    <div className="label">Evidência Esperada</div>
                    <input className="input" value={it.evidencia} onChange={(e) => updateCron(idx, { evidencia: e.target.value })} placeholder="ex.: link demo, vídeo, prints, documento" />
                  </div>
                </div>
                <div className="row" style={{ marginTop: 10 }}>
                  <div className="label">Critério de aceitação (como validar)</div>
                  <input className="input" value={it.criterioAceitacao} onChange={(e) => updateCron(idx, { criterioAceitacao: e.target.value })} placeholder="ex.: 1 escola testando + checklist X aprovado" />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button className="btn secondary" onClick={addMes} type="button">Adicionar mês</button>
          </div>
        </div>

        <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
          <input type="checkbox" checked={state.ipConcorda} onChange={(e) => set("ipConcorda", e.target.checked as any)} />
          <span className="p" style={{ margin: 0 }}>
            Declaro ciência sobre propriedade intelectual do Município e regras de confidencialidade (Anexo II).
          </span>
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
          <button className="btn" onClick={submit} disabled={loading || editais.length === 0}>{loading ? "Enviando..." : "Enviar proposta"}</button>
          {msg && <span className="p" style={{ margin: 0, color: "var(--bad)" }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}

