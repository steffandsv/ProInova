export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/propostas/draft
 * Returns all RASCUNHO proposals for the authenticated user.
 */
export async function GET(req: Request) {
  try {
    const session = requireAuth(req);
    const drafts = await prisma.proposta.findMany({
      where: { proponenteId: session.sub, status: "RASCUNHO" },
      select: {
        id: true,
        titulo: true,
        status: true,
        modalidade: true,
        createdAt: true,
        updatedAt: true,
        duracaoMeses: true,
        aiAnalysisJson: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ ok: true, data: drafts });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/propostas/draft
 * Creates a new draft proposal with partial data.
 * Only editalId is required; all text fields default to empty strings.
 */
export async function POST(req: Request) {
  try {
    const session = requireAuth(req);
    const body = await req.json().catch(() => ({}));

    const editalId = body.editalId;
    if (!editalId) {
      return NextResponse.json({ message: "editalId é obrigatório." }, { status: 400 });
    }

    const edital = await prisma.edital.findUnique({ where: { id: editalId } });
    if (!edital || edital.status !== "ABERTO") {
      return NextResponse.json({ message: "Edital não encontrado ou não está aberto." }, { status: 400 });
    }

    const draft = await prisma.proposta.create({
      data: {
        editalId: edital.id,
        proponenteId: session.sub,
        titulo: body.titulo || "",
        resumo: body.resumo || "",
        linhaTematica: body.linhaTematica || "",
        modalidade: edital.modalidade,
        duracaoMeses: body.duracaoMeses || 4,
        problema: body.problema || "",
        publicoAlvo: body.publicoAlvo || "",
        propostaValor: body.propostaValor || "",
        solucao: body.solucao || "",
        metodologia: body.metodologia || "",
        viabilidade: body.viabilidade || "",
        riscos: body.riscos || "",
        indicadores: body.indicadores || "",
        orcamentoRateio: body.orcamentoRateio || "",
        paginaPublicaPlano: body.paginaPublicaPlano || "",
        ipConcorda: body.ipConcorda || false,
        cronogramaJson: body.cronograma || [],
        aiAnalysisJson: body.aiAnalysisJson || null,
        status: "RASCUNHO",
      },
    });

    // Save equipe if provided
    if (body.equipe && Array.isArray(body.equipe) && body.equipe.length > 0) {
      await prisma.equipeMembro.createMany({
        data: body.equipe.map((eq: any) => ({
          propostaId: draft.id,
          cpf: eq.cpf || "",
          nome: eq.nome || "",
          dataNasc: eq.dataNasc ? new Date(eq.dataNasc) : undefined,
          vinculoEstudantil: eq.vinculoEstudantil || null,
          ehMenor: eq.ehMenor || false,
          responsavelLegal: eq.responsavelLegal || null,
          cpfResponsavel: eq.cpfResponsavel || null,
          percentualRateio: eq.percentualRateio || 0,
        })),
      });
    }

    await logAudit({
      userId: session.sub,
      action: "RASCUNHO_CRIADO",
      entityType: "Proposta",
      entityId: draft.id,
    });

    return NextResponse.json({ ok: true, id: draft.id });
  } catch (err: any) {
    console.error("[Draft POST]", err);
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
