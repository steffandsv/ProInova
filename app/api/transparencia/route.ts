export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Público – sem auth – Art. 20
export async function GET() {
  try {
    const projetos = await prisma.proposta.findMany({
      where: {
        status: { in: ["SUBMETIDA", "EM_TRIAGEM", "PARECER_EDUCACAO", "AVALIACAO_CMAA", "CLASSIFICADA", "HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO", "CONCLUIDA", "SUSPENSA", "CANCELADA"] },
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
        aiAnalysisJson: true,
        equipe: { select: { nome: true, vinculoEstudantil: true } },
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

    const result = projetos.map((p) => {
      const ai = p.aiAnalysisJson as any;
      const equipeTxt = p.equipe?.map(e => `${e.nome} (${e.vinculoEstudantil || 'Membro'})`).join(", ") || "Só Proponente";
      const formatFeedback = ai?.thoughts ? ai.thoughts.map((t:any) => `${t.emoji} [${t.score}/10] ${t.category}\n${t.comment}`).join('\n\n') : (ai?.verdict || "Sem análise");
      const parecerRecente = p.avaliacoes[0]?.parecer || null;
      const isDiligencia = parecerRecente?.includes("[DILIGÊNCIA SOLICITADA]") || false;

      return {
        id: p.id,
        titulo: p.titulo,
        sigiloso: p.sigiloso,
        resumo: p.sigiloso ? "Projeto sob sigilo (Art. 19 §único)" : p.resumo,
        problema: p.sigiloso ? "Informação protegida" : p.problema,
        propostaValor: p.sigiloso ? "Informação protegida" : p.propostaValor,
        indicadores: p.sigiloso ? "Informação protegida" : p.indicadores,
        historicoEquipe: p.sigiloso ? "Informação protegida" : equipeTxt,
        aiScore: ai?.overallScore || 0,
        aiFeedback: p.sigiloso ? "Feedback oculto" : formatFeedback,
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
        parecer: parecerRecente,
        isDiligencia,
      };
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
