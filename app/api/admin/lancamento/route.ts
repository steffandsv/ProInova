export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = requireAuth(req);
    requireRole(session, "ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO");

    const inscricoes = await prisma.inscricaoLancamento.findMany({
      orderBy: { createdAt: "desc" },
    });

    const total = inscricoes.length;

    return NextResponse.json({ ok: true, total, data: inscricoes });
  } catch (err: any) {
    if (err.message === "No session") {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }
    if (err.message?.includes("permissão")) {
      return NextResponse.json({ message: err.message }, { status: 403 });
    }
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}
