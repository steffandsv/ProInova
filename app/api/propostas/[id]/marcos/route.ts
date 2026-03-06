export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// GET: lista marcos + evidências da proposta do proponente
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    const proposta = await prisma.proposta.findUnique({
      where: { id: params.id },
      select: { proponenteId: true, status: true, titulo: true, duracaoMeses: true },
    });

    if (!proposta) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }

    // Proponente só vê a própria; admin/triagem vê qualquer
    if (proposta.proponenteId !== session.userId && !["ADMIN", "TRIAGEM", "CMAA"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const marcos = await prisma.marco.findMany({
      where: { propostaId: params.id },
      include: { evidencias: { orderBy: { createdAt: "desc" } } },
      orderBy: { mes: "asc" },
    });

    return NextResponse.json({ ok: true, proposta, data: marcos });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: proponente submete evidência para um marco
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { marcoId, tipo, url, descricao, publica } = body;

    if (!marcoId || !tipo || !descricao) {
      return NextResponse.json({ message: "marcoId, tipo e descricao são obrigatórios" }, { status: 400 });
    }

    // Verifica que o marco pertence à proposta do proponente
    const marco = await prisma.marco.findUnique({
      where: { id: marcoId },
      include: { proposta: { select: { proponenteId: true, status: true } } },
    });

    if (!marco) {
      return NextResponse.json({ message: "Marco não encontrado" }, { status: 404 });
    }

    if (marco.proposta.proponenteId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (marco.proposta.status !== "EM_EXECUCAO") {
      return NextResponse.json({ message: "Proposta não está em execução" }, { status: 400 });
    }

    if (!["PENDENTE", "AJUSTE_SOLICITADO"].includes(marco.status)) {
      return NextResponse.json({ message: "Este marco não aceita novas evidências no status atual" }, { status: 400 });
    }

    await prisma.$transaction(async (tx: any) => {
      // Criar evidência
      await tx.evidencia.create({
        data: {
          marcoId,
          tipo,
          url: url || null,
          descricao,
          publica: publica ?? true,
        },
      });

      // Atualizar status do marco para SUBMETIDO
      await tx.marco.update({
        where: { id: marcoId },
        data: { status: "SUBMETIDO" },
      });

      await logAudit({
        userId: session.userId,
        action: "EVIDENCIA_SUBMETIDA",
        entityType: "Marco",
        entityId: marcoId,
        after: { tipo, descricao },
        ip: request.headers.get("x-forwarded-for") || undefined,
      }, tx);
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
