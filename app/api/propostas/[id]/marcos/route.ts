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

    if (!["HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO"].includes(marco.proposta.status)) {
      return NextResponse.json({ message: "Proposta não está autorizada para envio de evidências" }, { status: 400 });
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

// PUT: proponente edita uma evidência existente
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { evidenciaId, tipo, url, descricao, publica } = body;

    if (!evidenciaId || !tipo || !descricao) {
      return NextResponse.json({ message: "evidenciaId, tipo e descricao são obrigatórios" }, { status: 400 });
    }

    // Busca a evidência e valida a árvore de propriedade e status do projeto
    const evidencia = await prisma.evidencia.findUnique({
      where: { id: evidenciaId },
      include: {
        marco: {
          include: {
            proposta: {
              select: { proponenteId: true, status: true }
            }
          }
        }
      }
    });

    if (!evidencia) {
      return NextResponse.json({ message: "Evidência não encontrada" }, { status: 404 });
    }

    // Verifica propriedade da proposta
    if (evidencia.marco.proposta.proponenteId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verifica status da proposta
    if (!["HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO"].includes(evidencia.marco.proposta.status)) {
      return NextResponse.json({ message: "Proposta não está em fase autorizada para alteração" }, { status: 400 });
    }

    // Verifica status do marco (não pode ser validado)
    if (evidencia.marco.status === "VALIDADO") {
      return NextResponse.json({ message: "Não é possível editar evidência de um marco já validado" }, { status: 400 });
    }

    await prisma.$transaction(async (tx: any) => {
      // Atualizar evidência
      await tx.evidencia.update({
        where: { id: evidenciaId },
        data: {
          tipo,
          url: url || null,
          descricao,
          publica: publica ?? true,
        },
      });

      // Se o marco estiver como REJEITADO ou AJUSTE_SOLICITADO, muda para SUBMETIDO
      if (["REJEITADO", "AJUSTE_SOLICITADO"].includes(evidencia.marco.status)) {
        await tx.marco.update({
          where: { id: evidencia.marcoId },
          data: { status: "SUBMETIDO" }
        });
      }

      await logAudit({
        userId: session.userId,
        action: "EVIDENCIA_EDITADA",
        entityType: "Evidencia",
        entityId: evidenciaId,
        before: { tipo: evidencia.tipo, url: evidencia.url, descricao: evidencia.descricao, publica: evidencia.publica },
        after: { tipo, url, descricao, publica },
        ip: request.headers.get("x-forwarded-for") || undefined,
      }, tx);
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: proponente deleta/anula uma evidência enviada
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { evidenciaId } = body;

    if (!evidenciaId) {
      return NextResponse.json({ message: "evidenciaId é obrigatório" }, { status: 400 });
    }

    // Busca a evidência e valida a árvore de propriedade e status do projeto
    const evidencia = await prisma.evidencia.findUnique({
      where: { id: evidenciaId },
      include: {
        marco: {
          include: {
            proposta: {
              select: { proponenteId: true, status: true }
            }
          }
        }
      }
    });

    if (!evidencia) {
      return NextResponse.json({ message: "Evidência não encontrada" }, { status: 404 });
    }

    // Verifica propriedade da proposta
    if (evidencia.marco.proposta.proponenteId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verifica status da proposta
    if (!["HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO"].includes(evidencia.marco.proposta.status)) {
      return NextResponse.json({ message: "Proposta não está em fase autorizada para exclusão" }, { status: 400 });
    }

    // Verifica status do marco (não pode ser validado)
    if (evidencia.marco.status === "VALIDADO") {
      return NextResponse.json({ message: "Não é possível anular evidência de um marco já validado" }, { status: 400 });
    }

    await prisma.$transaction(async (tx: any) => {
      // Deletar a evidência
      await tx.evidencia.delete({
        where: { id: evidenciaId },
      });

      // Conta quantas evidências restam para o marco
      const countRemaining = await tx.evidencia.count({
        where: { marcoId: evidencia.marcoId },
      });

      // Se não restar nenhuma evidência, o marco volta a ser PENDENTE
      if (countRemaining === 0) {
        await tx.marco.update({
          where: { id: evidencia.marcoId },
          data: { status: "PENDENTE" },
        });
      }

      await logAudit({
        userId: session.userId,
        action: "EVIDENCIA_REMOVIDA",
        entityType: "Evidencia",
        entityId: evidenciaId,
        before: { tipo: evidencia.tipo, url: evidencia.url, descricao: evidencia.descricao, publica: evidencia.publica },
        after: null,
        ip: request.headers.get("x-forwarded-for") || undefined,
      }, tx);
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
