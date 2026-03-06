export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// GET: lista propostas do proponente autenticado
export async function GET(req: Request) {
  try {
    const session = requireAuth(req);
    const propostas = await prisma.proposta.findMany({
      where: { proponenteId: session.sub },
      select: {
        id: true,
        titulo: true,
        status: true,
        modalidade: true,
        createdAt: true,
        duracaoMeses: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, data: propostas });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
  }
}

const CronogramaItemSchema = z.object({
  mes: z.number().int().min(1),
  entregavel: z.string().min(10),
  evidencia: z.string().min(5),
  criterioAceitacao: z.string().min(10),
});

const EquipeMembroSchema = z.object({
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
  ipConcorda: z.literal(true),
  cronograma: z.array(CronogramaItemSchema).min(1),
  equipe: z.array(EquipeMembroSchema).min(1),
  pdfPropostaUrl: z.string().optional(),
  aiAnalysisJson: z.any().optional(),
});

export async function POST(req: Request) {
  try {
    const session = requireAuth();
    const body = await req.json().catch(() => ({}));
    const parsed = PropostaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Payload inválido.", errors: parsed.error.format() }, { status: 400 });
    }

    const edital = await prisma.edital.findUnique({ where: { id: parsed.data.editalId } });
    if (!edital || edital.status !== "ABERTO") {
      return NextResponse.json({ message: "Edital não encontrado ou não está aberto." }, { status: 400 });
    }

    // Validação da soma de rateio da equipe
    const somaRateio = parsed.data.equipe.reduce((acc, m) => acc + m.percentualRateio, 0);
    if (Math.abs(somaRateio - 100) > 0.01 && somaRateio !== 0) {
      return NextResponse.json({ message: "O percentual de rateio da equipe deve somar 100% ou 0%." }, { status: 400 });
    }

    // Validação de Menores
    for (const membro of parsed.data.equipe) {
      if (membro.ehMenor) {
        if (!membro.cpfResponsavel || !membro.responsavelLegal) {
          return NextResponse.json({ message: `Membro menor de idade (${membro.nome}) exige responsável legal e CPF do responsável.` }, { status: 400 });
        }
      }
    }

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const p = await tx.proposta.create({
        data: {
          editalId: edital.id,
          proponenteId: session.sub,
          titulo: parsed.data.titulo,
          resumo: parsed.data.resumo,
          linhaTematica: parsed.data.linhaTematica,
          modalidade: edital.modalidade, // Herdado do edital
          duracaoMeses: parsed.data.duracaoMeses,
          problema: parsed.data.problema,
          publicoAlvo: parsed.data.publicoAlvo,
          propostaValor: parsed.data.propostaValor,
          solucao: parsed.data.solucao,
          metodologia: parsed.data.metodologia,
          viabilidade: parsed.data.viabilidade,
          riscos: parsed.data.riscos,
          indicadores: parsed.data.indicadores,
          orcamentoRateio: parsed.data.orcamentoRateio,
          paginaPublicaPlano: parsed.data.paginaPublicaPlano,
          ipConcorda: parsed.data.ipConcorda,
          cronogramaJson: parsed.data.cronograma, // Legado, backup
          pdfPropostaUrl: parsed.data.pdfPropostaUrl || null,
          aiAnalysisJson: parsed.data.aiAnalysisJson || null,
          status: "SUBMETIDA",
          
          marcos: {
            create: parsed.data.cronograma.map((c) => ({
              mes: c.mes,
              entregavel: c.entregavel,
              evidenciaEsperada: c.evidencia,
              criterioAceitacao: c.criterioAceitacao,
              status: "PENDENTE",
            })),
          },
          
          equipe: {
            create: parsed.data.equipe.map((eq) => ({
              cpf: eq.cpf,
              nome: eq.nome,
              dataNasc: eq.dataNasc ? new Date(eq.dataNasc) : undefined,
              vinculoEstudantil: eq.vinculoEstudantil,
              ehMenor: eq.ehMenor,
              responsavelLegal: eq.responsavelLegal,
              cpfResponsavel: eq.cpfResponsavel,
              percentualRateio: eq.percentualRateio,
            })),
          },
        },
      });

      await logAudit({
        userId: session.sub,
        action: "PROPOSTA_SUBMETIDA",
        entityType: "Proposta",
        entityId: p.id,
      });

      return p;
    });

    return NextResponse.json({ ok: true, id: result.id });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
