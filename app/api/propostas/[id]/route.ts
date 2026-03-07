export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/propostas/[id]
 * Returns full proposal data for the authenticated proponent (owner).
 * Also accessible by admins.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth(req);

    const proposta = await prisma.proposta.findUnique({
      where: { id: params.id },
      include: {
        edital: {
          select: { titulo: true, modalidade: true },
        },
        equipe: true,
        marcos: {
          orderBy: { mes: "asc" },
        },
        avaliacoes: {
          include: {
            avaliador: { select: { nome: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!proposta) {
      return NextResponse.json({ ok: false, error: "Proposta não encontrada." }, { status: 404 });
    }

    // Only allow the owner or admins to view
    const isOwner = proposta.proponenteId === session.sub;
    const isAdmin = ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"].includes(session.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
    }

    return NextResponse.json({ ok: true, data: proposta });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
  }
}
