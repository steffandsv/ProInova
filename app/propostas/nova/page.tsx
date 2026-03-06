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
  pdfPropostaUrl: z.string().optional(),
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
    pdfPropostaUrl: "",
  });

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ─── PDF upload state ─── */
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);

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

  async function handlePdfUpload(file: File) {
    setPdfFile(file);
    setPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/propostas/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok && json.url) {
        set("pdfPropostaUrl", json.url);
        setPdfUploaded(true);
      } else {
        setMsg(json.message || "Erro ao enviar PDF.");
        setPdfFile(null);
      }
    } catch {
      setMsg("Falha de rede ao enviar PDF.");
      setPdfFile(null);
    } finally {
      setPdfUploading(false);
    }
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

          <div className="grid two" style={{ gap: 24 }}>
            <div className="row">
              <div className="label">Problema (e evidências do problema)</div>
              <RichEditor value={state.problema} onChange={(v) => set("problema", v)} placeholder="Quem sofre com isso hoje? Como você sabe que o problema existe?" />
            </div>
            <div className="row">
              <div className="label">Público-alvo (Tamanho e contexto)</div>
              <RichEditor value={state.publicoAlvo} onChange={(v) => set("publicoAlvo", v)} placeholder="Tamanho estimado do público? Onde eles estão?" />
            </div>
          </div>

          <div className="grid two" style={{ gap: 24, marginTop: 24 }}>
            <div className="row">
              <div className="label">Proposta de Valor (O grande benefício)</div>
              <RichEditor value={state.propostaValor} onChange={(v) => set("propostaValor", v)} placeholder="Como o mundo melhora quando isso estiver pronto?" />
            </div>
            <div className="row">
              <div className="label">Solução Prática</div>
              <RichEditor value={state.solucao} onChange={(v) => set("solucao", v)} placeholder="O que exatamente a equipe vai construir (e o que NÃO vai)?" />
            </div>
          </div>

          <div className="grid two" style={{ gap: 24, marginTop: 24 }}>
            <div className="row">
              <div className="label">Metodologia (Execução e validação)</div>
              <RichEditor value={state.metodologia} onChange={(v) => set("metodologia", v)} placeholder="Quais ferramentas serão usadas? Como testarão com usuários?" />
            </div>
            <div className="row">
              <div className="label">Viabilidade (Recursos)</div>
              <RichEditor value={state.viabilidade} onChange={(v) => set("viabilidade", v)} placeholder="A equipe tem os recursos necessários? Alguma dependência externa?" />
            </div>
          </div>

          <div className="grid two" style={{ gap: 24, marginTop: 24 }}>
            <div className="row">
              <div className="label">Riscos e Mitigação</div>
              <RichEditor value={state.riscos} onChange={(v) => set("riscos", v)} placeholder="O que pode dar errado (Operacional, Segurança, Adesão) e como prevenir?" />
            </div>
            <div className="row">
              <div className="label">Indicadores de Sucesso (KPIs numéricos)</div>
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

          <div className="grid two" style={{ gap: 24, marginTop: 40, paddingTop: 32, borderTop: "1px dashed var(--border)" }}>
            <div className="row">
              <div className="label">Página Pública: Transparência</div>
              <RichEditor value={state.paginaPublicaPlano} onChange={(v) => set("paginaPublicaPlano", v)} placeholder="Como o projeto pode ser exposto publicamente mês a mês (sem expor segredos industriais ou senhas)?" />
            </div>
            <div className="row">
              <div className="label">Rateio Extra ou Materiais (Justifique)</div>
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

          <div style={{ marginBottom: 32 }}>
            <div className="label" style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>Anexo em PDF (Opcional)</div>
            <p className="p" style={{ fontSize: 13, marginBottom: 16 }}>
              Se tiver um projeto arquitetônico, diagramas ou slides adicionais, anexe aqui. Opcional caso já tenha preenchido tudo acima.
            </p>
            <label className={`panel-card ${pdfFile ? "has-file" : ""}`} htmlFor="pdf-upload-input" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 32, border: "2px dashed var(--border)", borderRadius: 16, cursor: "pointer", background: "rgba(255,255,255,0.02)", transition: "all 0.2s" }}>
              <input
                id="pdf-upload-input"
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      setMsg("O PDF deve ter no máximo 10 MB.");
                      return;
                    }
                    handlePdfUpload(file);
                  }
                }}
              />
              {pdfUploading ? (
                <span className="p" style={{ margin: 0, fontWeight: 600 }}>Enviando PDF...</span>
              ) : pdfFile ? (
                <>
                  <span style={{ fontSize: 32, marginBottom: 8 }}>✅</span>
                  <span className="p" style={{ margin: 0, fontWeight: 600, color: "var(--good)" }}>{pdfFile.name} (Salvo)</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 32, marginBottom: 12 }}>📄</span>
                  <span className="p" style={{ margin: 0, fontWeight: 600 }}>Cique para Selecionar PDF Complementar</span>
                  <span className="p" style={{ margin: 0, fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Até 10 MB</span>
                </>
              )}
            </label>
          </div>

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

          {/* SUBMIT BUTTON */}
          <button className="cta-btn cta-btn--primary" onClick={submit} disabled={loading || editais.length === 0} style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: 16 }}>
            {loading ? "Processando envio da proposta..." : "🚀 Submeter Ideia ao Comitê"}
          </button>
          
          {msg && (
            <div style={{ marginTop: 16, textAlign: "center", padding: "12px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              {msg}
            </div>
          )}
          {editais.length === 0 && (
            <div style={{ marginTop: 16, textAlign: "center", color: "var(--warn)", fontSize: 14 }}>
              Nenhum edital está aberto para submissão no momento.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
