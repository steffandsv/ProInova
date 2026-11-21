export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { generateReceiptPdf } from "@/lib/pdf/generateReceipt";
import { nomeArquivoRecibo, participantesDoMarco, urlDaLei, valorDoMarco } from "@/lib/recibos";

export async function GET(
  request: Request,
  { params }: { params: { id: string; entregaId: string } }
) {
  try {
    // 1. Validar autenticação
    const session = requireAuth(request);

    // 2. Buscar entrega (marco), proposta, equipe e edital
    const marco = await prisma.marco.findUnique({
      where: { id: params.entregaId },
      include: {
        proposta: {
          include: {
            proponente: { select: { id: true, nome: true, cpf: true } },
            equipe: {
              select: { id: true, nome: true, cpf: true, percentualRateio: true },
            },
            edital: {
              include: { config: true },
            },
          },
        },
      },
    });

    if (!marco || marco.propostaId !== params.id) {
      return NextResponse.json(
        { error: "Entrega mensal não encontrada ou não pertence ao projeto especificado." },
        { status: 404 }
      );
    }

    // 3. Verificar se a entrega está aprovada
    if (marco.status !== "VALIDADO") {
      return NextResponse.json(
        { error: "Não é permitido gerar recibo para entregas que não estejam no status Validado (aprovado)." },
        { status: 400 }
      );
    }

    // 4. Segurança / Autorização
    // Apenas administradores do sistema podem acessar os recibos
    const isAdmin = session.role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Sem permissão para gerar o recibo deste projeto." },
        { status: 403 }
      );
    }

    // 5. Buscar valor calculado no sistema
    const valorComNota = valorDoMarco(marco);

    // Obter o membroId opcional dos query params
    const { searchParams } = new URL(request.url);
    const membroId = searchParams.get("membroId");

    // Calcular valores individuais de rateio
    let equipeMembros = marco.proposta.equipe;
    if (membroId) {
      equipeMembros = equipeMembros.filter((eq) => eq.id === membroId);
      if (equipeMembros.length === 0) {
        return NextResponse.json(
          { error: "Integrante da equipe especificado não encontrado neste projeto." },
          { status: 404 }
        );
      }
    }

    const participantes = participantesDoMarco(marco, equipeMembros);

    // 6. Configurar URL absoluta da lei para os cliques no PDF
    const absoluteLeiUrl = urlDaLei(request);

    // 7. Gerar PDF
    const pdfBuffer = await generateReceiptPdf(
      {
        projetoNome: marco.proposta.titulo,
        mes: marco.mes,
        nota: marco.nota,
        valorMensalTotal: valorComNota,
        validadoEm: marco.validadoEm,
        createdAt: marco.createdAt,
        participantes,
      },
      absoluteLeiUrl
    );

    // 8. Registrar evento na auditoria
    await logAudit({
      userId: session.userId,
      action: "RECEIPT_GENERATED",
      entityType: "Marco",
      entityId: marco.id,
      before: null,
      after: {
        mes: marco.mes,
        valorTotal: valorComNota,
        participantesCount: participantes.length,
      },
      ip: request.headers.get("x-forwarded-for") || undefined,
    });

    // 9. Retornar stream para download imediato
    const sanitizedFilename = nomeArquivoRecibo(participantes.map((p) => p.nome), marco);
    return new Response(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizedFilename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error: any) {
    if (error.message === "No session") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[ReceiptAPI] Error generating receipt:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
