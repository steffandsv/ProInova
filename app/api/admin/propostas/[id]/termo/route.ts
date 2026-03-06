export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const proposta = await prisma.proposta.findUnique({
      where: { id: params.id }
    });

    if (!proposta || proposta.status !== "HOMOLOGADA") {
      return NextResponse.json({ message: "Proposta não encontrada ou não está HOMOLOGADA" }, { status: 400 });
    }

    const body = await request.json();
    const { urlDocumento } = body;

    await prisma.$transaction(async (tx) => {
      // 1) Criar o termo de outorga
      await tx.termoOutorga.create({
        data: {
          propostaId: proposta.id,
          dadosJson: {}, // podemos salvar um snapshot de dados, mas não é estritamente necessário no MVP
          assinado: true,
          assinadoEm: new Date(),
          urlDocumento: urlDocumento || null,
        }
      });

      // 2) Atualizar status para EM_EXECUCAO
      await tx.proposta.update({
        where: { id: proposta.id },
        data: { status: "EM_EXECUCAO" }
      });

      // 3) Audit
      await logAudit(
        {
          userId: session.userId,
          action: "WORKFLOW_EM_EXECUCAO",
          entityType: "Proposta",
          entityId: proposta.id,
          before: { status: "HOMOLOGADA" },
          after: { status: "EM_EXECUCAO", termo: true },
          ip: request.headers.get("x-forwarded-for") || undefined
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
