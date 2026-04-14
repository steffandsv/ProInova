export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Público – sem auth – Art. 20
export async function GET() {
  try {
    const projetos = await prisma.proposta.findMany({
      where: {
        status: { in: ["CLASSIFICADA", "HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO", "CONCLUIDA", "SUSPENSA", "CANCELADA"] },
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
        problema: true,
        propostaValor: true,
        indicadores: true,
        historicoEquipe: true,
        aiScore: true,
        aiFeedback: true,
        _count: { select: { marcos: true } },
        marcos: {
          where: { status: "VALIDADO" },
          select: { id: true },
        },
        avaliacoes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { parecer: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const result = projetos.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      sigiloso: p.sigiloso,
      resumo: p.sigiloso ? "Projeto sob sigilo (Art. 19 §único)" : p.resumo,
      problema: p.sigiloso ? "Informação protegida" : p.problema,
      propostaValor: p.sigiloso ? "Informação protegida" : p.propostaValor,
      indicadores: p.sigiloso ? "Informação protegida" : p.indicadores,
      historicoEquipe: p.sigiloso ? "Informação protegida" : p.historicoEquipe,
      aiScore: p.aiScore,
      aiFeedback: p.sigiloso ? "Feedback oculto" : p.aiFeedback,
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
      parecer: p.avaliacoes[0]?.parecer || null,
    }));

    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
