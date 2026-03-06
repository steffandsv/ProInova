export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

type RouteContext = { params: { id: string } };

/**
 * GET /api/propostas/draft/[id]
 * Returns full draft data for restoring the form state.
 */
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const session = requireAuth(req);
    const draft = await prisma.proposta.findFirst({
      where: { id: params.id, proponenteId: session.sub, status: "RASCUNHO" },
      include: { equipe: true },
    });
    if (!draft) {
      return NextResponse.json({ message: "Rascunho não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: draft });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
  }
}

/**
 * PUT /api/propostas/draft/[id]
 * Updates an existing draft with partial data.
 */
export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const session = requireAuth(req);
    const body = await req.json().catch(() => ({}));

    // Verify ownership and status
    const existing = await prisma.proposta.findFirst({
      where: { id: params.id, proponenteId: session.sub },
    });
    if (!existing) {
      return NextResponse.json({ message: "Rascunho não encontrado." }, { status: 404 });
    }
    if (existing.status !== "RASCUNHO") {
      return NextResponse.json({ message: "Proposta já foi submetida e não pode ser editada como rascunho." }, { status: 400 });
    }

    // Build update data (only set fields that are present in the body)
    const updateData: any = { updatedAt: new Date() };
    const textFields = [
      "titulo", "resumo", "linhaTematica", "problema", "publicoAlvo",
      "propostaValor", "solucao", "metodologia", "viabilidade", "riscos",
      "indicadores", "orcamentoRateio", "paginaPublicaPlano",
    ];
    for (const f of textFields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    if (body.duracaoMeses !== undefined) updateData.duracaoMeses = body.duracaoMeses;
    if (body.ipConcorda !== undefined) updateData.ipConcorda = body.ipConcorda;
    if (body.cronograma !== undefined) updateData.cronogramaJson = body.cronograma;
    if (body.aiAnalysisJson !== undefined) updateData.aiAnalysisJson = body.aiAnalysisJson;

    await prisma.proposta.update({
      where: { id: params.id },
      data: updateData,
    });

    // Upsert equipe if provided
    if (body.equipe && Array.isArray(body.equipe)) {
      // Delete old members and recreate (simplest approach for drafts)
      await prisma.equipeMembro.deleteMany({ where: { propostaId: params.id } });
      if (body.equipe.length > 0) {
        await prisma.equipeMembro.createMany({
          data: body.equipe.map((eq: any) => ({
            propostaId: params.id,
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
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Draft PUT]", err);
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}

/**
 * DELETE /api/propostas/draft/[id]
 * Deletes a draft proposal.
 */
export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const session = requireAuth(req);
    const existing = await prisma.proposta.findFirst({
      where: { id: params.id, proponenteId: session.sub, status: "RASCUNHO" },
    });
    if (!existing) {
      return NextResponse.json({ message: "Rascunho não encontrado." }, { status: 404 });
    }
    await prisma.proposta.delete({ where: { id: params.id } });
    await logAudit({
      userId: session.sub,
      action: "RASCUNHO_EXCLUIDO",
      entityType: "Proposta",
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
