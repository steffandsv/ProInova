export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { findTransition, getAvailableTransitions } from "@/lib/workflow";
import { PropostaStatus, Role, AvaliacaoEtapa } from "@prisma/client";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth(request);
    const propostaId = params.id;
    const body = await request.json();

    const { nextStatus, parecerTexto, notaFinal, aprovado } = body;

    const proposta = await prisma.proposta.findUnique({
      where: { id: propostaId }
    });

    if (!proposta) {
      return NextResponse.json({ message: "Proposta não encontrada" }, { status: 404 });
    }

    // 1) Verify Transition
    const currentStatus = proposta.status;
    const targetStatus = nextStatus as PropostaStatus;
    const userRole = session.role as Role;

    const possibleTrans = findTransition(currentStatus, targetStatus, userRole, proposta.modalidade);

    if (!possibleTrans) {
      const allowed = getAvailableTransitions(currentStatus, userRole, proposta.modalidade);
      return NextResponse.json({ 
        message: "Transição inválida ou não permitida para o seu perfil.", 
        allowed: allowed.map((a: any) => a.to) 
      }, { status: 403 });
    }

    // 2) If Valid, we might need to save an Avaliacao object
    let avaliacaoId: string | undefined;

    await prisma.$transaction(async (tx: any) => {
      // Create Avaliacao if provided
      if (parecerTexto || notaFinal !== undefined) {
        // Determine etapa based on current status
        let etapa: AvaliacaoEtapa = "TRIAGEM";
        if (currentStatus === "PARECER_EDUCACAO") etapa = "EDUCACAO";
        else if (currentStatus === "AVALIACAO_CMAA") etapa = "CMAA";
        else if (currentStatus === "CLASSIFICADA" && targetStatus === "HOMOLOGADA") etapa = "PREFEITO";

        const evalRecord = await tx.avaliacao.create({
          data: {
            propostaId: proposta.id,
            avaliadorId: session.userId,
            etapa,
            parecer: parecerTexto || "",
            notaJson: body.notaJson || [],
            notaFinal: notaFinal !== undefined ? notaFinal : null,
            aprovado: aprovado ?? true,
          }
        });
        avaliacaoId = evalRecord.id;
      }

      // 3) Update Proposta Status
      await tx.proposta.update({
        where: { id: proposta.id },
        data: { status: targetStatus }
      });

      // 4) Audit Log
      await logAudit(
        {
          userId: session.userId,
          action: `WORKFLOW_${targetStatus}`,
          entityType: "Proposta",
          entityId: proposta.id,
          before: { status: currentStatus },
          after: { status: targetStatus, avaliacaoId, aprovado, notaFinal },
          ip: request.headers.get("x-forwarded-for") || undefined
        },
        tx
      );
    });

    return NextResponse.json({ ok: true, status: targetStatus });

  } catch (error: any) {
    if (error.message === "No session") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
