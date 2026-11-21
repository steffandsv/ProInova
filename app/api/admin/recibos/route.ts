export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: última entrega validada de cada projeto homologado ou em execução,
// com a marca de quando o recibo daquele mês já foi baixado (pela trilha de auditoria).
export async function GET(request: Request) {
  try {
    const session = requireAuth(request);
    if (session.role !== "ADMIN") {
      return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    }

    const propostas = await prisma.proposta.findMany({
      where: { status: { in: ["HOMOLOGADA", "EM_EXECUCAO"] }, marcos: { some: { status: "VALIDADO" } } },
      select: {
        id: true,
        titulo: true,
        status: true,
        proponente: { select: { nome: true } },
        edital: { select: { config: { select: { tetoMensal: true } } } },
        _count: { select: { equipe: true } },
        marcos: {
          where: { status: "VALIDADO" },
          orderBy: { mes: "desc" },
          take: 1,
          select: { id: true, mes: true, nota: true, validadoEm: true },
        },
      },
      orderBy: { titulo: "asc" },
    });

    const marcoIds = propostas.map((p) => p.marcos[0].id);
    const downloads = await prisma.auditLog.findMany({
      where: { entityType: "Marco", action: "RECEIPT_GENERATED", entityId: { in: marcoIds } },
      select: { entityId: true, createdAt: true, user: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
    });
    const porMarco = new Map<string, { em: Date; por: string | null; vezes: number }>();
    for (const d of downloads) {
      const atual = porMarco.get(d.entityId);
      if (atual) atual.vezes += 1;
      else porMarco.set(d.entityId, { em: d.createdAt, por: d.user?.nome ?? null, vezes: 1 });
    }

    const data = propostas.map((p) => {
      const marco = p.marcos[0];
      const teto = p.edital?.config?.tetoMensal ?? 1000;
      return {
        propostaId: p.id,
        titulo: p.titulo,
        status: p.status,
        proponente: p.proponente.nome,
        integrantes: p._count.equipe,
        marco: { id: marco.id, mes: marco.mes, nota: marco.nota, validadoEm: marco.validadoEm },
        valor: teto * (typeof marco.nota === "number" ? marco.nota / 10 : 1),
        baixado: porMarco.get(marco.id) ?? null,
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    console.error("[RecibosLista]", error);
    return NextResponse.json({ message: "Não foi possível carregar as entregas." }, { status: 500 });
  }
}
