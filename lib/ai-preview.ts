/**
 * AI Preview Service – Qwen (primary) + DeepSeek (fallback)
 *
 * Converts all proposal fields into markdown and sends to an LLM
 * for structured analysis against the Municipal Innovation Law.
 */

/* ─── Types ─── */
export interface ProposalData {
  titulo: string;
  resumo: string;
  linhaTematica: string;
  duracaoMeses: number;
  problema: string;
  publicoAlvo: string;
  propostaValor: string;
  solucao: string;
  metodologia: string;
  viabilidade: string;
  riscos: string;
  indicadores: string;
  orcamentoRateio: string;
  paginaPublicaPlano: string;
  cronograma: { mes: number; entregavel: string; evidencia: string; criterioAceitacao: string }[];
  equipe: {
    cpf: string;
    nome: string;
    dataNasc?: string;
    vinculoEstudantil?: string;
    ehMenor: boolean;
    responsavelLegal?: string;
    cpfResponsavel?: string;
    percentualRateio: number;
  }[];
}

export interface CategoryScore {
  category: string;
  emoji: string;
  score: number;
  comment: string;
}

export interface AIAnalysisResult {
  overallScore: number;
  verdict: string;
  thoughts: CategoryScore[];
}

/* ─── Strip HTML helper ─── */
function strip(html: string): string {
  let text = html.replace(/<[^>]*>/g, "");
  text = text.replaceAll("&nbsp;", " ");
  text = text.replace(/&[a-z]+;/g, " ");
  return text.trim();
}

/* ─── Build Markdown payload ─── */
function buildMarkdownPayload(d: ProposalData): string {
  const lines: string[] = [];
  lines.push(`# Proposta de Projeto: ${d.titulo}`);
  lines.push("");
  lines.push(`**Linha Temática:** ${d.linhaTematica}`);
  lines.push(`**Duração:** ${d.duracaoMeses} meses`);
  lines.push(`**Tamanho da Equipe:** ${d.equipe.length} pessoa(s)`);
  lines.push("");
  lines.push("## Resumo Executivo");
  lines.push(strip(d.resumo));
  lines.push("");
  lines.push("## Problema");
  lines.push(strip(d.problema));
  lines.push("");
  lines.push("## Público-Alvo");
  lines.push(strip(d.publicoAlvo));
  lines.push("");
  lines.push("## Proposta de Valor");
  lines.push(strip(d.propostaValor));
  lines.push("");
  lines.push("## Solução Proposta");
  lines.push(strip(d.solucao));
  lines.push("");
  lines.push("## Metodologia");
  lines.push(strip(d.metodologia));
  lines.push("");
  lines.push("## Viabilidade e Recursos");
  lines.push(strip(d.viabilidade));
  lines.push("");
  lines.push("## Riscos e Mitigação");
  lines.push(strip(d.riscos));
  lines.push("");
  lines.push("## Indicadores de Sucesso");
  lines.push(strip(d.indicadores));
  lines.push("");
  lines.push("## Orçamento e Rateio");
  lines.push(strip(d.orcamentoRateio));
  lines.push("");
  lines.push("## Plano de Transparência Pública");
  lines.push(strip(d.paginaPublicaPlano));
  lines.push("");
  lines.push("## Equipe");
  d.equipe.forEach((m, i) => {
    const menor = m.ehMenor ? " (menor de idade)" : "";
    const vinculo = m.vinculoEstudantil ? ` – ${m.vinculoEstudantil}` : "";
    lines.push(`${i + 1}. **${m.nome}**${vinculo}${menor} — Rateio: ${m.percentualRateio}%`);
  });
  lines.push("");
  lines.push("## Cronograma de Entregas Mensais");
  d.cronograma.forEach((c) => {
    lines.push(`### Mês ${c.mes}`);
    lines.push(`- **Entregável:** ${c.entregavel}`);
    lines.push(`- **Evidência:** ${c.evidencia}`);
    lines.push(`- **Critério de aceitação:** ${c.criterioAceitacao}`);
    lines.push("");
  });
  return lines.join("\n");
}

/* ─── System Prompt ─── */
function buildSystemPrompt(): string {
  return `Você é o "Analista ProInova", um avaliador super especialista na Lei Municipal de Inovação de Jaborandi-SP e em gestão de projetos de inovação pública. Sua missão é avaliar propostas de projetos com rigor técnico, mas sempre com linguagem ACESSÍVEL e ACOLHEDORA (muitos proponentes podem ser crianças ou adolescentes). Use emojis e seja entusiasmado!

CONTEXTO DA LEI:
- Art. 5º: Propostas cadastradas na Plataforma ProInova com: identificação, problema, público-alvo, proposta de valor, cronograma mensal, metodologia, viabilidade, riscos, indicadores, orçamento/rateio, IP/confidencialidade e plano de página pública.
- Art. 6º: O projeto deve demonstrar capacidade de entrega e compatibilidade escopo-prazo-recursos. São VEDADAS propostas genéricas sem entregáveis mensais ou sem benefício público mensurável.
- Art. 9º: Beneficiários a partir de 14 anos, menores com anuência de responsável legal.
- Art. 10º: Na modalidade Educação com recursos vinculados, bolsa somente para alunos matriculados na rede pública municipal.
- Art. 13º: Bolsa de até R$ 1.000,00 mensais por projeto, dividida entre membros.
- Art. 14º: Pagamento condicionado ao atingimento de marcos mensais.

REGRAS DE AVALIAÇÃO:
Avalie o projeto em 6 categorias, cada uma com nota de 0 a 10:

1. 🎯 Viabilidade da Equipe — O número de pessoas e a qualificação (onde estudam, formação) são adequados para o escopo proposto? A equipe consegue fazer o que promete?
2. ⏱️ Tempo vs. Complexidade — A duração proposta faz sentido? O proponente está pedindo muito tempo para algo simples ou pouco tempo para algo complexo?
3. ⚖️ Adequação à Lei Municipal — O projeto atende aos requisitos do Art. 5º e 6º? Tem entregáveis mensais verificáveis? Tem benefício público mensurável?
4. 🏛️ Relevância para o Município — O projeto faz sentido para um governo municipal? Resolve um problema real da comunidade? É pertinente para a realidade de uma cidade pequena?
5. 📊 Qualidade Técnica — A metodologia é sólida? Os indicadores são mensuráveis? Os riscos foram mapeados com planos de mitigação?
6. 💡 Inovação e Impacto — A solução é inovadora? O impacto potencial justifica o investimento público? Há elementos diferenciadores?

FORMATO DE RESPOSTA:
Responda EXCLUSIVAMENTE com um objeto JSON válido (sem markdown codeblocks, sem texto antes ou depois):
{
  "overallScore": <número 0-10 com 1 decimal>,
  "verdict": "<APROVAÇÃO PROVÁVEL|COM RESSALVAS|NECESSITA REVISÃO>",
  "thoughts": [
    {
      "category": "Viabilidade da Equipe",
      "emoji": "🎯",
      "score": <0-10>,
      "comment": "<1-2 frases curtas, gentis e construtivas>"
    },
    {
      "category": "Tempo vs. Complexidade",
      "emoji": "⏱️",
      "score": <0-10>,
      "comment": "<1-2 frases>"
    },
    {
      "category": "Adequação à Lei Municipal",
      "emoji": "⚖️",
      "score": <0-10>,
      "comment": "<1-2 frases>"
    },
    {
      "category": "Relevância para o Município",
      "emoji": "🏛️",
      "score": <0-10>,
      "comment": "<1-2 frases>"
    },
    {
      "category": "Qualidade Técnica",
      "emoji": "📊",
      "score": <0-10>,
      "comment": "<1-2 frases>"
    },
    {
      "category": "Inovação e Impacto",
      "emoji": "💡",
      "score": <0-10>,
      "comment": "<1-2 frases>"
    }
  ]
}

IMPORTANTE:
- overallScore = média ponderada (Adequação à Lei peso 2, Relevância peso 1.5, resto peso 1).
- verdict: >= 7 → "APROVAÇÃO PROVÁVEL", 5–6.9 → "COM RESSALVAS", < 5 → "NECESSITA REVISÃO".
- Você está conversando com o autor da proposta. Seja MUITO gentil, acolhedor e construtivo. Lembre-se que podem ser adolescentes inovando pela primeira vez.
- Nunca desmotive. Elogie os pontos positivos e sugira as melhorias necessárias com extrema clareza e suavidade.
- Comentários CURTOS, diretos e amigáveis (máximo 2 frases cada).`;
}

/* ─── API Streaming Orchestrator ─── */
interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/* ─── Parse AI response ─── */
export function parseAnalysis(raw: string): AIAnalysisResult {
  // Remover bloco <think> do DeepSeek Reasoner, caso exista
  let jsonStr = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  // Tentar extrair de blocos de marcação markdown ```json ... ```
  const cbMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cbMatch) {
    jsonStr = cbMatch[1].trim();
  } else {
    // Se não tiver markdown, tentar encontrar os limites de um objeto JSON válido
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate shape
    if (typeof parsed.overallScore !== "number" || !Array.isArray(parsed.thoughts)) {
      throw new Error("Invalid AI response structure");
    }

    return {
      overallScore: Math.round(parsed.overallScore * 10) / 10,
      verdict: parsed.verdict || "COM RESSALVAS",
      thoughts: parsed.thoughts.map((t: any) => ({
        category: t.category || "",
        emoji: t.emoji || "📌",
        score: typeof t.score === "number" ? Math.round(t.score * 10) / 10 : 5,
        comment: t.comment || "",
      })),
    };
  } catch (error) {
    console.error("Failed to parse JSON AI Result:", jsonStr, error);
    throw new Error("A I.A. retornou uma resposta em um formato inesperado. Tente submeter ao analista novamente.");
  }
}

export async function analyzeProposalStream(data: ProposalData): Promise<ReadableStream> {
  const markdown = buildMarkdownPayload(data);
  const systemPrompt = buildSystemPrompt();
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Analise a seguinte proposta de projeto:\n\n${markdown}` },
  ];

  let res: Response;
  let provider = "deepseek";

  // Try DeepSeek Reasoner first
  const dsKey = process.env.DEEPSEEK_API_KEY;
  if (!dsKey) throw new Error("DEEPSEEK_API_KEY não configurada");

  try {
    res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${dsKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-reasoner",
        messages,
        stream: true,
        max_tokens: 2500,
      }),
    });
    if (!res.ok) throw new Error(`DeepSeek Error ${res.status}: ${await res.text()}`);
  } catch (error: any) {
    console.warn("[AI Preview] DeepSeek falhou, tentando Qwen:", error.message);
    provider = "qwen";
    const qKey = process.env.QWEN_API_KEY;
    if (!qKey) throw new Error("Ambas as IAs falharam (Qwen key não configurada).");

    // Correção: Dashscope Intl URL
    res = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${qKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen-max",
        messages,
        stream: true,
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });
    if (!res.ok) throw new Error(`Qwen Error ${res.status}: ${await res.text()}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      if (provider === "qwen") {
        controller.enqueue(encoder.encode(`event: reasoning\ndata: ${JSON.stringify("Analisando proposta usando Qwen como modelo alternativo. Iniciando cálculos de impacto...")}\n\n`));
      }

      const reader = res.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      let buffer = "";
      let contentBuffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const dataStr = line.slice(6).trim();
                if (!dataStr) continue;
                const json = JSON.parse(dataStr);
                const delta = json.choices[0]?.delta;
                
                if (delta?.reasoning_content) {
                  controller.enqueue(encoder.encode(`event: reasoning\ndata: ${JSON.stringify(delta.reasoning_content)}\n\n`));
                }
                
                // Qwen fake reasoning based on content arrival
                if (provider === "qwen" && delta?.content && contentBuffer.length < 50) {
                     controller.enqueue(encoder.encode(`event: reasoning\ndata: ${JSON.stringify(".\n")}\n\n`));
                }

                if (delta?.content) {
                  contentBuffer += delta.content;
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        // Fim da Stream: parse no resultado final
        try {
          const finalResult = parseAnalysis(contentBuffer);
          controller.enqueue(encoder.encode(`event: result\ndata: ${JSON.stringify(finalResult)}\n\n`));
        } catch (parseErr: any) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(parseErr.message)}\n\n`));
        }
        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(err.message)}\n\n`));
        controller.close();
      }
    },
  });
}
