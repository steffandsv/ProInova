export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PropostaStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = requireAuth(request);
    if (!["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PropostaStatus | null;
    const editalId = searchParams.get("editalId");

    const where: any = {};
    if (status) where.status = status;
    if (editalId) where.editalId = editalId;

    // Se não for ADMIN puro, as permissões filtram o que o cara vê?
    // Ex: Role EDUCACAO só vê o que tá em PARECER_EDUCACAO ou algo assim?
    // Vamos trazer tudo por enquanto e o frontend filtra as ABAS, facilita a visualização.

    const propostas = await prisma.proposta.findMany({
      where,
      include: {
        proponente: {
          select: { nome: true, cpf: true, email: true },
        },
        edital: {
          select: { titulo: true, modalidade: true },
        },
        _count: {
          select: { equipe: true, marcos: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: propostas });
  } catch (error: any) {
    if (error.message === "No session") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
