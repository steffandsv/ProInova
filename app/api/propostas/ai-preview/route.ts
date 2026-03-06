export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { analyzeProposal } from "@/lib/ai-preview";
import { z } from "zod";

const CronogramaItemSchema = z.object({
  mes: z.number().int().min(1),
  entregavel: z.string().min(1),
  evidencia: z.string().min(1),
  criterioAceitacao: z.string().min(1),
});

const EquipeMembroSchema = z.object({
  cpf: z.string().min(1),
  nome: z.string().min(1),
  dataNasc: z.string().optional(),
  vinculoEstudantil: z.string().optional(),
  ehMenor: z.boolean(),
  responsavelLegal: z.string().optional(),
  cpfResponsavel: z.string().optional(),
  percentualRateio: z.number().min(0).max(100),
});

const AIPreviewSchema = z.object({
  titulo: z.string().min(1),
  resumo: z.string().min(1),
  linhaTematica: z.string().min(1),
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
  cronograma: z.array(CronogramaItemSchema).min(1),
  equipe: z.array(EquipeMembroSchema).min(1),
});

export async function POST(req: Request) {
  try {
    // Auth required – only logged-in users can call the AI preview
    requireAuth();

    const body = await req.json().catch(() => ({}));
    const parsed = AIPreviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Preencha todos os campos obrigatórios antes de solicitar a análise da I.A.", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const analysis = await analyzeProposal(parsed.data);

    return NextResponse.json({ ok: true, analysis });
  } catch (err: any) {
    console.error("[AI Preview Route]", err);
    return NextResponse.json(
      { ok: false, message: err.message || "Erro ao analisar proposta com I.A." },
      { status: 500 }
    );
  }
}
