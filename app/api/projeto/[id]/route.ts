export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sanitizeForPublic, redactMinorData } from "@/lib/lgpd";

// Público – sem auth
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const proposta = await prisma.proposta.findUnique({
      where: { id: params.id },
      include: {
        proponente: { select: { nome: true } },
        edital: { select: { titulo: true, modalidade: true } },
        equipe: { select: { nome: true, ehMenor: true, vinculoEstudantil: true } },
        marcos: {
          include: {
            evidencias: { where: { publica: true }, orderBy: { createdAt: "desc" } },
          },
          orderBy: { mes: "asc" },
        },
      },
    });

    if (!proposta) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    // Apenas propostas EM_EXECUCAO ou CONCLUIDA são públicas
    if (!["EM_EXECUCAO", "CONCLUIDA"].includes(proposta.status)) {
      return NextResponse.json({ error: "Projeto ainda não está em fase pública" }, { status: 404 });
    }

    // Sanitizar dados públicos + redatar menores
    const equipeSafe = proposta.equipe.map((m) => redactMinorData(m));
    const propostaSafe = sanitizeForPublic(proposta);

    return NextResponse.json({
      ok: true,
      data: {
        ...propostaSafe,
        equipe: equipeSafe,
        marcos: proposta.marcos,
        proponente: proposta.proponente,
        edital: proposta.edital,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
