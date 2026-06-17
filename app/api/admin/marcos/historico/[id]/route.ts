export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT: Admin edita comentário/nota de um registro de histórico de marco
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    if (!["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { comentario, nota } = await request.json();

    // Buscar o registro de histórico
    const log = await prisma.marcoHistorico.findUnique({
      where: { id: params.id },
    });

    if (!log) {
      return NextResponse.json({ error: "Registro de histórico não encontrado" }, { status: 404 });
    }

    if (!["VALIDACAO", "SOLICITACAO_AJUSTE", "REJEICAO", "ANULACAO"].includes(log.acao)) {
      return NextResponse.json({ error: "Apenas registros de avaliação administrativa podem ser modificados." }, { status: 400 });
    }

    const parsedNota = nota !== undefined && nota !== null ? parseFloat(nota) : null;

    // Atualizar o histórico
    const updatedLog = await prisma.marcoHistorico.update({
      where: { id: params.id },
      data: {
        comentario,
        nota: parsedNota,
      },
    });

    // Se for o histórico mais recente desse marco, atualizar o marco pai
    const latestLog = await prisma.marcoHistorico.findFirst({
      where: { marcoId: log.marcoId },
      orderBy: { createdAt: "desc" },
    });

    if (latestLog && latestLog.id === log.id) {
      await prisma.marco.update({
        where: { id: log.marcoId },
        data: {
          nota: parsedNota !== null ? parsedNota : 10.0,
          comentarioCoordenacao: comentario,
        },
      });
    }

    return NextResponse.json({ ok: true, data: updatedLog });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Admin remove um registro de histórico de marco e sincroniza o status do marco pai
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    if (!["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Buscar o registro de histórico antes de deletar
    const log = await prisma.marcoHistorico.findUnique({
      where: { id: params.id },
    });

    if (!log) {
      return NextResponse.json({ error: "Registro de histórico não encontrado" }, { status: 404 });
    }

    if (!["VALIDACAO", "SOLICITACAO_AJUSTE", "REJEICAO", "ANULACAO"].includes(log.acao)) {
      return NextResponse.json({ error: "Apenas registros de avaliação administrativa podem ser removidos." }, { status: 400 });
    }

    // Deletar o registro de histórico
    await prisma.marcoHistorico.delete({
      where: { id: params.id },
    });

    // Buscar os registros restantes desse marco
    const remainingLogs = await prisma.marcoHistorico.findMany({
      where: { marcoId: log.marcoId },
      orderBy: { createdAt: "desc" },
    });

    if (remainingLogs.length > 0) {
      const currentLatest = remainingLogs[0];
      await prisma.marco.update({
        where: { id: log.marcoId },
        data: {
          status: currentLatest.statusNovo,
          nota: currentLatest.nota !== null ? currentLatest.nota : 10.0,
          comentarioCoordenacao: ["VALIDACAO", "SOLICITACAO_AJUSTE", "REJEICAO"].includes(currentLatest.acao)
            ? currentLatest.comentario
            : null,
        },
      });
    } else {
      // Se não sobrou nenhum histórico, reseta o marco para PENDENTE
      await prisma.marco.update({
        where: { id: log.marcoId },
        data: {
          status: "PENDENTE",
          nota: 10.0,
          comentarioCoordenacao: null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
