"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import RichEditor from "@/app/RichEditor";

/* ─── Helper: strip HTML for length validation ─── */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

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
  problema: z.string().min(1),
  publicoAlvo: z.string().min(1),
  propostaValor: z.string().min(1),
  solucao: z.string().min(1),
  metodologia: z.string().min(1),
  viabilidade: z.string().min(1),
  riscos: z.string().min(1),
  indicadores: z.string().min(1),
  orcamentoRateio: z.string().min(1),
  paginaPublicaPlano: z.string().min(1),
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
    cronograma: Array.from({ length: 4 }, (_, i) => ({
      mes: i + 1,
      entregavel: "",
      evidencia: "",
      criterioAceitacao: "",
    })),
    equipe: [
      {
        cpf: "",
        nome: "",
        dataNasc: "",
        vinculoEstudantil: "",
        ehMenor: false,
        responsavelLegal: "",
        cpfResponsavel: "",
        percentualRateio: 100,
      },
    ],
  });

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ─── AI Preview state ─── */
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReasoningText, setAiReasoningText] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

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

  /* ─── Auto-sync cronograma with duracaoMeses ─── */
  useEffect(() => {
    setState((s) => {
      const n = s.duracaoMeses;
      if (n < 1 || n > 24) return s;
      const current = s.cronograma;
      let next = [...current];
      if (next.length < n) {
        for (let i = next.length; i < n; i++) {
          next.push({ mes: i + 1, entregavel: "", evidencia: "", criterioAceitacao: "" });
        }
      } else if (next.length > n) {
        next = next.slice(0, n);
      }
      return { ...s, cronograma: next };
    });
  }, [state.duracaoMeses]);

  const indicadoresPlain = stripHtml(state.indicadores);
  const riscosPlain = stripHtml(state.riscos);
  const hasMetric = /(\b%\b|\bR\$\b|\bmin\b|\balunos\b|\busuários\b|\batendimentos\b)/i.test(indicadoresPlain);
  const hasRisk = /(segurança|lgpd|risco|privacidade|fraude|manutenção|adesão|treinamento)/i.test(riscosPlain);
  const cronBad = state.cronograma.some(
    (i) => i.entregavel.trim().length < 10 || i.criterioAceitacao.trim().length < 10
  );
  const rateioSum = state.equipe.reduce((acc, m) => acc + m.percentualRateio, 0);

  const scoreHints = useMemo(() => {
    const hints: string[] = [];
    if (!hasMetric) hints.push("Indicadores parecem genéricos. Coloque número-base e meta (ex.: de X para Y).");
    if (!hasRisk) hints.push("Riscos: cite pelo menos 1 risco operacional + 1 risco de adoção + mitigação.");
    if (cronBad)
      hints.push("Cronograma: cada mês precisa de entregável + critério de aceitação verificável.");
    if (Math.abs(rateioSum - 100) > 0.01 && rateioSum !== 0)
      hints.push("Atenção: A soma do percentual de rateio da bolsa da equipe deve ser 100% ou 0%.");
    if (!state.ipConcorda) hints.push("Você precisa concordar com os termos da Lei Municipal de Inovação.");
    return hints;
  }, [hasMetric, hasRisk, cronBad, rateioSum, state.ipConcorda]);

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

  function addMembro() {
    setState((s) => ({
      ...s,
      equipe: [
        ...s.equipe,
        {
          cpf: "",
          nome: "",
          dataNasc: "",
          vinculoEstudantil: "",
          ehMenor: false,
          responsavelLegal: "",
          cpfResponsavel: "",
          percentualRateio: 0,
        },
      ],
    }));
  }

  async function submit() {
    setMsg(null);
    const parsed = PropostaSchema.safeParse(state);
    if (!parsed.success) {
      setMsg(
        parsed.error.issues[0]?.message ||
          "Revise os campos. Verifique CPFs e comprimentos mínimos de texto."
      );
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...parsed.data,
        aiAnalysisJson: aiResult,
      };

      const res = await fetch("/api/propostas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
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

  /* ─── AI Preview ─── */
  async function submitToAI() {
    const parsed = PropostaSchema.safeParse(state);
    if (!parsed.success) {
      setMsg("Preencha todos os campos corretamente antes de solicitar a análise. Role a página para cima e confira os avisos em vermelho.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    setAiReasoningText("");

    try {
      const res = await fetch("/api/propostas/ai-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        setAiError("A IA não conseguiu processar sua requisição no momento.");
        setAiLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (!reader) {
        setAiError("Falha ao ler o fluxo de dados da IA.");
        setAiLoading(false);
        return;
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith("data:")) {
              dataStr += line.substring(5).trim();
            }
          }

          if (dataStr) {
            try {
              const parsedData = JSON.parse(dataStr);
              if (eventType === "reasoning") {
                setAiReasoningText((prev) => prev + parsedData);
              } else if (eventType === "result") {
                setAiResult(parsedData);
              } else if (eventType === "error") {
                setAiError(parsedData);
              }
            } catch (e) {
              // Ignore invalid JSON inside stream chunks
            }
          }
        }
      }

      setAiLoading(false);
    } catch (err: any) {
      setAiError("Falha na comunicação com os servidores de Inteligência Artificial.");
      setAiLoading(false);
    }
  }

  if (fetchingEditais)
    return (
      <div className="section" style={{ textAlign: "center", paddingTop: 100 }}>
        <div className="hero-orb hero-orb--1" style={{ width: 300, height: 300, top: "20%", left: "50%", transform: "translate(-50%, 0)", opacity: 0.5 }} aria-hidden />
        <span className="gradient-text" style={{ fontSize: 24, fontWeight: 700 }}>Carregando formulário...</span>
      </div>
    );

  return (
    <div style={{ position: "relative", paddingBottom: 60 }}>
      {/* Background Orbs */}
      <div className="hero-orb hero-orb--1" style={{ width: 400, height: 400, top: -50, left: -100, opacity: 0.2 }} aria-hidden />
      
      {/* Header Banner */}
      <div style={{ textAlign: "center", padding: "40px 20px 60px", position: "relative", zIndex: 2 }}>
        <span className="section-tag" style={{ marginBottom: 16 }}>🚀 Nova Ideia</span>
        <h1 className="h1" style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Deixe sua marca no <span className="gradient-text">ProInova</span>
        </h1>
        <p className="p" style={{ maxWidth: 680, margin: "0 auto", fontSize: 18 }}>
          Este formulário foi desenhado para separar ideias soltas de projetos que acontecem. 
          Descreva com clareza o problema, a equipe, o plano de voo e as evidências.
        </p>
      </div>

      <div className="grid" style={{ gap: 32, position: "relative", zIndex: 3, maxWidth: 900, margin: "0 auto" }}>
        
        {/* ========================================================= */}
        {/* SECTION 1: INFORMAÇÕES BÁSICAS */}
        {/* ========================================================= */}
        <section className="card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 24 }}>📝</span>
            <h2 className="h2" style={{ margin: 0 }}>1. Informações Básicas</h2>
          </div>

          <div className="row">
            <div className="label">Edital de Submissão</div>
            <select className="input" value={state.editalId} onChange={(e) => set("editalId", e.target.value)} style={{ padding: "14px", fontSize: 15, cursor: "pointer" }}>
              {editais.length === 0 && <option value="">Nenhum edital aberto no momento</option>}
              {editais.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.titulo} ({ed.modalidade})
                </option>
              ))}
            </select>
          </div>

          <div className="grid two" style={{ marginTop: 20 }}>
            <div className="row">
              <div className="label">Nome do Projeto</div>
              <input className="input" value={state.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Curto, forte e memorável..." />
            </div>
            <div className="row">
              <div className="label">Linha Temática</div>
              <input
                className="input"
                value={state.linhaTematica}
                onChange={(e) => set("linhaTematica", e.target.value)}
                placeholder="Exemplo: Saúde Digital, Educação Inclusiva"
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 20 }}>
            <div className="label">Resumo Executivo (o famoso Elevator Pitch)</div>
            <textarea className="input" style={{ minHeight: 100, padding: 14 }} value={state.resumo} onChange={(e) => set("resumo", e.target.value)} placeholder="Escreva um parágrafo claro sobre o que o projeto resolve e quem impacta. (Até 1.000 caracteres)" />
          </div>

          <div className="row" style={{ marginTop: 20 }}>
            <div className="label">Duração Estimada do Projeto (meses)</div>
            <p className="p" style={{ fontSize: 13, margin: "0 0 8px" }}>O cronograma de entregas lá embaixo será atualizado automaticamente.</p>
            <input
              className="input"
              type="number"
              value={state.duracaoMeses}
              onChange={(e) => set("duracaoMeses", Number(e.target.value) as any)}
              min={1}
              max={24}
              style={{ maxWidth: 200, fontSize: 18, fontWeight: 600, color: "var(--accent)" }}
            />
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: EQUIPE MÁGICA */}
        {/* ========================================================= */}
        <section className="card" style={{ padding: 32, borderColor: Math.abs(rateioSum - 100) > 0.01 && rateioSum !== 0 ? "var(--warn)" : "var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>🧑‍🤝‍🧑</span>
              <h2 className="h2" style={{ margin: 0 }}>2. A Equipe Mágica</h2>
            </div>
            <div className="badge" style={{ fontSize: 14 }}>
              Rateio distribuído: <strong style={{ color: rateioSum === 100 ? "var(--good)" : "var(--warn)", marginLeft: 4 }}>{rateioSum}%</strong>
            </div>
          </div>
          <p className="p" style={{ fontSize: 15, marginBottom: 24 }}>
            Quem vai construir essa solução? Adicione todos os membros. A primeira pessoa listada será considerada o <strong>Proponente (líder)</strong>.
          </p>

          <div className="grid" style={{ gap: 16 }}>
            {state.equipe.map((it, idx) => (
              <div className="feature-card" key={idx} style={{ padding: 20, background: "var(--card-bg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div className="badge">
                    <strong>{idx === 0 ? "👑 Líder do Projeto" : `👨‍💻 Membro ${idx + 1}`}</strong>
                  </div>
                </div>
                
                <div className="grid two">
                  <div className="row">
                    <div className="label">Nome Completo</div>
                    <input className="input" value={it.nome} onChange={(e) => updateEq(idx, { nome: e.target.value })} />
                  </div>
                  <div className="row">
                    <div className="label">CPF (somente números)</div>
                    <input className="input" value={it.cpf} onChange={(e) => updateEq(idx, { cpf: e.target.value })} />
                  </div>
                </div>
                <div className="grid two" style={{ marginTop: 12 }}>
                  <div className="row">
                    <div className="label">Vínculo estudantil (opcional)</div>
                    <input className="input" value={it.vinculoEstudantil || ""} onChange={(e) => updateEq(idx, { vinculoEstudantil: e.target.value })} placeholder="Escola e ano" />
                  </div>
                  <div className="row">
                    <div className="label">Parcela da Bolsa (%)</div>
                    <input className="input" type="number" min="0" max="100" value={it.percentualRateio} onChange={(e) => updateEq(idx, { percentualRateio: Number(e.target.value) })} style={{ color: "var(--accent)", fontWeight: 600 }} />
                  </div>
                </div>

                <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16, cursor: "pointer", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <input type="checkbox" checked={it.ehMenor} onChange={(e) => updateEq(idx, { ehMenor: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />
                  <span className="p" style={{ margin: 0, fontWeight: 500 }}>Este membro tem menos de 18 anos</span>
                </label>

                {it.ehMenor && (
                  <div className="grid two" style={{ marginTop: 12, padding: 16, background: "rgba(245, 158, 11, 0.05)", borderLeft: "3px solid var(--warn)", borderRadius: "0 8px 8px 0" }}>
                    <div className="row">
                      <div className="label">Nome do Responsável Legal</div>
                      <input className="input" value={it.responsavelLegal || ""} onChange={(e) => updateEq(idx, { responsavelLegal: e.target.value })} />
                    </div>
                    <div className="row">
                      <div className="label">CPF do Responsável</div>
                      <input className="input" value={it.cpfResponsavel || ""} onChange={(e) => updateEq(idx, { cpfResponsavel: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button className="cta-btn cta-btn--ghost" onClick={addMembro} type="button" style={{ marginTop: 20, width: "100%", justifyContent: "center" }}>
            + Adicionar outro membro
          </button>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: A GRANDE IDEIA */}
        {/* ========================================================= */}
        <section className="card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 24 }}>💡</span>
            <h2 className="h2" style={{ margin: 0 }}>3. A Grande Ideia</h2>
          </div>
          <p className="p" style={{ fontSize: 15, marginBottom: 24 }}>
            Aqui é onde a inovação é detalhada. Seja claro, direto e traga evidências concretas. Respostas vagas dificultam a aprovação.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Qual é o problema?</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>Descreva o problema real que você observou. Traga dados, estatísticas ou relatos que comprovem que ele existe.</p>
              <RichEditor value={state.problema} onChange={(v) => set("problema", v)} placeholder="Quem sofre com isso hoje? Como você sabe que o problema existe?" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Quem é o público-alvo?</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>Quantas pessoas são afetadas? Onde estão? Qual perfil (idade, localização, contexto)?</p>
              <RichEditor value={state.publicoAlvo} onChange={(v) => set("publicoAlvo", v)} placeholder="Tamanho estimado do público? Onde eles estão?" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Qual é a proposta de valor?</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>O grande benefício que o projeto entrega. Como o mundo melhora quando isso estiver pronto?</p>
              <RichEditor value={state.propostaValor} onChange={(v) => set("propostaValor", v)} placeholder="Como o mundo melhora quando isso estiver pronto?" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Qual é a solução prática?</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>O que exatamente a equipe vai construir? E o que NÃO vai construir (escopo negativo)?</p>
              <RichEditor value={state.solucao} onChange={(v) => set("solucao", v)} placeholder="O que exatamente a equipe vai construir (e o que NÃO vai)?" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Metodologia de execução</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>Quais ferramentas, linguagens ou métodos serão usados? Como serão feitos testes com usuários reais?</p>
              <RichEditor value={state.metodologia} onChange={(v) => set("metodologia", v)} placeholder="Quais ferramentas serão usadas? Como testarão com usuários?" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Viabilidade e recursos</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>A equipe tem os recursos humanos, técnicos e materiais necessários? Há dependências externas?</p>
              <RichEditor value={state.viabilidade} onChange={(v) => set("viabilidade", v)} placeholder="A equipe tem os recursos necessários? Alguma dependência externa?" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Riscos e como mitigá-los</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>Cite pelo menos: 1 risco operacional, 1 risco de adoção/segurança, e como pretende reduzir cada um.</p>
              <RichEditor value={state.riscos} onChange={(v) => set("riscos", v)} placeholder="O que pode dar errado (Operacional, Segurança, Adesão) e como prevenir?" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Indicadores de sucesso (KPIs)</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>Use números! Ex: &ldquo;Reduzir de 30 dias para 5 dias&rdquo;, &ldquo;De R$ 0 para R$ 10.000/mês&rdquo;, &ldquo;Atender 200 alunos&rdquo;.</p>
              <RichEditor value={state.indicadores} onChange={(v) => set("indicadores", v)} placeholder="Dica: De R$ X para R$ Y. De Z horas para W minutos. Métrica base e alvo." />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: PLANO DE VOO (CRONOGRAMA) */}
        {/* ========================================================= */}
        <section className="card" style={{ padding: 32, background: "linear-gradient(180deg, rgba(34, 197, 94, 0.04), rgba(34, 197, 94, 0.01))", borderColor: "rgba(34, 197, 94, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 24 }}>📅</span>
            <h2 className="h2" style={{ margin: 0 }}>4. O Plano de Voo</h2>
          </div>
          <p className="p" style={{ fontSize: 15, marginBottom: 32 }}>
            Como a visão vira realidade? Detalhe o entregável de cada mês. Lembre-se: o pagamento da bolsa está <strong>condicionado</strong> à verificação destas entregas mensais.
          </p>

          <div className="timeline">
            {state.cronograma.map((it, idx) => (
              <div className="feature-card" key={idx} style={{ marginBottom: 16, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span className="badge" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "var(--good)", borderColor: "var(--good)", fontSize: 14 }}>Mês {it.mes}</span>
                </div>
                <div className="grid two" style={{ gap: 16 }}>
                  <div className="row">
                    <div className="label">Entregável (O que fica pronto)</div>
                    <input className="input" value={it.entregavel} onChange={(e) => updateCron(idx, { entregavel: e.target.value })} placeholder="Ex: Backend configurado e banco de dados" style={{ backgroundColor: "var(--bg)" }} />
                  </div>
                  <div className="row">
                    <div className="label">Evidência Esperada (O que será provado)</div>
                    <input className="input" value={it.evidencia} onChange={(e) => updateCron(idx, { evidencia: e.target.value })} placeholder="Ex: Link do repositório no GitHub" style={{ backgroundColor: "var(--bg)" }} />
                  </div>
                </div>
                <div className="row" style={{ marginTop: 16 }}>
                  <div className="label">Critério de Aceitação Técnica (Como validar que deu certo)</div>
                  <input className="input" value={it.criterioAceitacao} onChange={(e) => updateCron(idx, { criterioAceitacao: e.target.value })} placeholder="Ex: API respondendo em menos de 200ms com 10 requisições simultâneas" style={{ backgroundColor: "var(--bg)" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 40, paddingTop: 32, borderTop: "1px dashed var(--border)" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Plano de transparência pública</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>Como o andamento do projeto será exposto publicamente mês a mês, sem revelar segredos industriais ou senhas?</p>
              <RichEditor value={state.paginaPublicaPlano} onChange={(v) => set("paginaPublicaPlano", v)} placeholder="Como o projeto pode ser exposto publicamente mês a mês (sem expor segredos industriais ou senhas)?" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Orçamento e materiais extras</h3>
              <p className="p" style={{ margin: "0 0 10px", fontSize: 13 }}>Precisa de algum equipamento ou material que a prefeitura deva prover? Justifique a necessidade.</p>
              <RichEditor value={state.orcamentoRateio} onChange={(v) => set("orcamentoRateio", v)} placeholder="Precisa comprar algum equipamento específico que a prefeitura deva prover? Detalhe." />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: FINALIZAÇÃO E ENVIO */}
        {/* ========================================================= */}
        <section className="card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <h2 className="h2" style={{ margin: 0 }}>5. Finalização</h2>
          </div>

          <div style={{ marginBottom: 32 }} />

          {/* CHECKLIST DE GUARDRAILS */}
          {scoreHints.length > 0 && (
            <div className="feature-card" style={{ padding: 24, background: "rgba(245, 158, 11, 0.05)", borderColor: "rgba(245, 158, 11, 0.3)", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <strong style={{ fontSize: 16, color: "#fbbf24" }}>Checklist de Excelência</strong>
              </div>
              <p className="p" style={{ fontSize: 14, margin: "0 0 12px", opacity: 0.9 }}>Checamos alguns itens críticos que o Comitê sempre barra. Avalie o que está faltando antes de enviar:</p>
              <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text)", lineHeight: 1.6, fontSize: 14 }}>
                {scoreHints.map((h, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <label style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 20px", background: "rgba(0,0,0,0.2)", borderRadius: 14, border: "1px solid var(--border)", cursor: "pointer", marginBottom: 32 }}>
            <input type="checkbox" checked={state.ipConcorda} onChange={(e) => set("ipConcorda", e.target.checked as any)} style={{ width: 22, height: 22, marginTop: 2, accentColor: "var(--accent)" }} />
            <div>
              <span className="p" style={{ margin: 0, fontWeight: 500, display: "block", marginBottom: 6 }}>
                Declaro ciência sobre propriedade intelectual do Município e regras de confidencialidade aplicáveis.
              </span>
              <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", fontSize: 14 }}>
                Revisar Lei Municipal de Inovação
              </a>
            </div>
          </label>

          {/* SUBMIT BUTTONS E PREVIEW INLINE */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <button
              className="cta-btn cta-btn--primary"
              onClick={submitToAI}
              disabled={aiLoading || editais.length === 0}
              style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: 16, background: "linear-gradient(135deg, #8b5cf6, #a78bfa)", border: "none" }}
            >
              {aiLoading ? "🧠 Analisando com I.A..." : "🤖 Submeter ao Analista I.A."}
            </button>

            {/* AI Inline Result area */}
            {/* LOADING STATE - STREAMING REASONER */}
          {aiLoading && (
            <div className="card" style={{ marginTop: 24, textAlign: "center", animation: "fadeIn 0.4s" }}>
              <div className="ai-spinner" style={{ margin: "0 auto 20px" }}></div>
              <h3 className="h3" style={{ marginBottom: 14 }}>
                <span className="gradient-text">A I.A. está raciocinando...</span>
              </h3>
              <p className="p" style={{ maxWidth: 600, margin: "0 auto", color: "var(--muted)" }}>
                Isso pode levar de 15 a 30 segundos. Estamos lendo cada detalhe da sua proposta para garantir que ela atenda aos padrões da Inovação Municipal.
              </p>

              {aiReasoningText && (
                <div style={{ marginTop: 24, background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                     <span style={{ fontSize: 20 }}>🧠</span>
                     <strong style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>Pensamento da Máquina</strong>
                  </div>
                  <div className="ai-reasoner-text">
                    {aiReasoningText}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VERDICT MODAL */}
            {!aiLoading && aiError && (
              <div style={{ textAlign: "center", padding: "40px 0", background: "rgba(239, 68, 68, 0.1)", borderRadius: 16, border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>😞</span>
                <p className="p" style={{ fontSize: 16, color: "#fca5a5", margin: 0 }}>{aiError}</p>
              </div>
            )}

            {!aiLoading && aiResult && (
              <div style={{
                background: "linear-gradient(180deg, rgba(20, 24, 30, 0.95), rgba(15, 18, 23, 0.98))",
                border: "1px solid rgba(124, 92, 255, 0.3)",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(124, 92, 255, 0.1)",
                borderRadius: 24, padding: "32px 24px"
              }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <span style={{ fontSize: 40, display: "block", marginBottom: 8 }}>🤖</span>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                    Análise do <span className="gradient-text">Analista I.A.</span>
                  </h3>
                  <p className="p" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Prévia concluída! Revise as pontuações abaixo se necessário.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: 90, height: 90, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, fontWeight: 800,
                      background: `conic-gradient(
                        ${aiResult.overallScore >= 7 ? "#22c55e" : aiResult.overallScore >= 5 ? "#f59e0b" : "#ef4444"}
                        ${aiResult.overallScore * 10}%,
                        rgba(255,255,255,0.08) 0
                      )`,
                      color: "var(--text)",
                    }}>
                      <span style={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: "var(--card-bg)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {aiResult.overallScore}
                      </span>
                    </div>
                    <p className="p" style={{ fontSize: 12, margin: "8px 0 0" }}>Nota Geral</p>
                  </div>
                  <div className={`ai-verdict-badge ${
                    aiResult.verdict === "APROVAÇÃO PROVÁVEL" ? "ai-verdict--good" :
                    aiResult.verdict === "COM RESSALVAS" ? "ai-verdict--warn" :
                    "ai-verdict--bad"
                  }`}>
                    {aiResult.verdict === "APROVAÇÃO PROVÁVEL" ? "✅" :
                     aiResult.verdict === "COM RESSALVAS" ? "⚠️" : "🔄"}
                    {" "}{aiResult.verdict}
                  </div>
                </div>

                <div className="grid" style={{ gap: 12 }}>
                  {aiResult.thoughts.map((t: any, idx: number) => (
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

            {/* CONTEÚDO FINAL APÓS IA */}
            {(!aiLoading && (aiResult || aiError)) && (
              <div className="card" style={{ marginTop: 24, textAlign: "center", animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                
                {aiError && (
                  <div style={{ marginBottom: 20 }}>
                    <p className="p" style={{ color: "var(--warn)", fontWeight: "bold" }}>A Inteligência Artificial indisponibilizou a análise no momento.</p>
                    <p className="p" style={{ fontSize: 13, color: "var(--muted)" }}>Você pode prosseguir com a submissão normalmente sem a opinião prévia consultiva.</p>
                  </div>
                )}

                <h3 className="h3" style={{ marginBottom: 14 }}>Tudo pronto!</h3>
                <p className="p">Sua proposta está pronta para ser enviada para a verdadeira comissão avaliadora.</p>

                <button
                  type="button"
                  className="btn btn-submit"
                  onClick={submit}
                  disabled={loading || (!aiResult && !aiError)}
                  style={{ padding: "16px 32px", fontSize: 16, marginTop: 14 }}
                >
                  {loading ? "Enviando Proposta Oficial..." : (aiError ? "Finalizar sem Análise Prévia" : "Enviar Proposta Oficial para o Comitê")}
                </button>
              </div>
            )}
          </div>

          {msg && (
            <div style={{ marginTop: 24, textAlign: "center", padding: "16px", borderRadius: 12, background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              {msg}
            </div>
          )}
          {editais.length === 0 && (
            <div style={{ marginTop: 24, textAlign: "center", color: "var(--warn)", fontSize: 14 }}>
              Nenhum edital está aberto para submissão no momento.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
