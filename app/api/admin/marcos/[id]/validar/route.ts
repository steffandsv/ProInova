export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// POST: coordenação valida, solicita ajuste, ou rejeita marco
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    if (!["ADMIN", "TRIAGEM"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { novoStatus, comentario } = body;

    if (!["VALIDADO", "AJUSTE_SOLICITADO", "REJEITADO"].includes(novoStatus)) {
      return NextResponse.json({ message: "Status inválido. Use VALIDADO, AJUSTE_SOLICITADO ou REJEITADO." }, { status: 400 });
    }

    const marco = await prisma.marco.findUnique({
      where: { id: params.id },
      include: { proposta: { select: { id: true, status: true } } },
    });

    if (!marco) {
      return NextResponse.json({ message: "Marco não encontrado" }, { status: 404 });
    }

    if (marco.status !== "SUBMETIDO") {
      return NextResponse.json({ message: "O marco precisa estar com status SUBMETIDO para ser validado" }, { status: 400 });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.marco.update({
        where: { id: params.id },
        data: {
          status: novoStatus,
          comentarioCoordenacao: comentario || null,
          validadoEm: novoStatus === "VALIDADO" ? new Date() : null,
        },
      });

      await logAudit({
        userId: session.userId,
        action: `MARCO_${novoStatus}`,
        entityType: "Marco",
        entityId: params.id,
        before: { status: marco.status },
        after: { status: novoStatus, comentario },
        ip: request.headers.get("x-forwarded-for") || undefined,
      }, tx);
    });

    return NextResponse.json({ ok: true, status: novoStatus });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
