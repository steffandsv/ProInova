export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Público – sem auth – Art. 20
export async function GET() {
  try {
    const projetos = await prisma.proposta.findMany({
      where: {
        status: { in: ["EM_EXECUCAO", "CONCLUIDA"] },
      },
      select: {
        id: true,
        titulo: true,
        resumo: true,
        modalidade: true,
        status: true,
        duracaoMeses: true,
        linhaTematica: true,
        createdAt: true,
        sigiloso: true,
        proponente: { select: { nome: true } },
        edital: { select: { titulo: true } },
        _count: { select: { marcos: true } },
        marcos: {
          where: { status: "VALIDADO" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = projetos.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      resumo: p.sigiloso ? "Projeto sob sigilo (Art. 19 §único)" : p.resumo,
      modalidade: p.modalidade,
      status: p.status,
      linhaTematica: p.linhaTematica,
      duracaoMeses: p.duracaoMeses,
      proponente: p.proponente.nome,
      edital: p.edital.titulo,
      totalMarcos: p._count.marcos,
      marcosValidados: p.marcos.length,
      progresso: p._count.marcos > 0 ? Math.round((p.marcos.length / p._count.marcos) * 100) : 0,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
