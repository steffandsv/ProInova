export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AvaliacaoEtapa } from "@prisma/client";

/**
 * POST /api/admin/propostas/[id]/parecer
 * Adds a formal opinion (parecer) to any proposal without changing its status.
 * Primarily used for CANCELADA proposals where the admin wants to leave a record.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth(request);

    const allowedRoles = ["ADMIN", "PREFEITO", "TRIAGEM", "EDUCACAO", "CMAA"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { parecerTexto } = body;

    if (!parecerTexto?.trim()) {
      return NextResponse.json({ error: "O texto do parecer é obrigatório." }, { status: 400 });
    }

    const proposta = await prisma.proposta.findUnique({ where: { id: params.id } });
    if (!proposta) {
      return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
    }

    let etapa: AvaliacaoEtapa = "TRIAGEM";
    if (session.role === "EDUCACAO") etapa = "EDUCACAO";
    else if (session.role === "CMAA") etapa = "CMAA";
    else if (session.role === "PREFEITO") etapa = "PREFEITO";

    await prisma.$transaction(async (tx: any) => {
      await tx.avaliacao.create({
        data: {
          propostaId: params.id,
          avaliadorId: session.userId,
          etapa,
          parecer: parecerTexto.trim(),
          notaJson: [],
          aprovado: false,
        },
      });

      await logAudit(
        {
          userId: session.userId,
          action: "PARECER_REGISTRADO",
          entityType: "Proposta",
          entityId: params.id,
          after: { status: proposta.status, parecerTexto },
          ip: request.headers.get("x-forwarded-for") || undefined,
        },
        tx
      );
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "No session") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
