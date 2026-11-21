export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { generateReceiptPdf } from "@/lib/pdf/generateReceipt";
import { nomeArquivoRecibo, participantesDoMarco, slug, urlDaLei, valorDoMarco } from "@/lib/recibos";
import { criarZip } from "@/lib/zip";

const MAX_MARCOS = 100;

// POST: gera um ZIP com um PDF por integrante para cada entrega escolhida,
// numa pasta por projeto, e registra cada entrega como baixada.
export async function POST(request: Request) {
  try {
    const session = requireAuth(request);
    if (session.role !== "ADMIN") {
      return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const marcoIds: string[] = Array.isArray(body?.marcoIds) ? [...new Set<string>(body.marcoIds.filter((x: unknown) => typeof x === "string"))] : [];
    if (marcoIds.length === 0) {
      return NextResponse.json({ message: "Escolha pelo menos uma entrega." }, { status: 400 });
    }
    if (marcoIds.length > MAX_MARCOS) {
      return NextResponse.json({ message: `Escolha no máximo ${MAX_MARCOS} entregas por vez.` }, { status: 400 });
    }

    const marcos = await prisma.marco.findMany({
      where: { id: { in: marcoIds } },
      include: {
        proposta: {
          include: {
            equipe: { select: { id: true, nome: true, cpf: true, percentualRateio: true } },
            edital: { include: { config: true } },
          },
        },
      },
    });

    if (marcos.length !== marcoIds.length) {
      return NextResponse.json({ message: "Alguma entrega escolhida não existe mais. Recarregue a lista." }, { status: 404 });
    }
    const naoValidado = marcos.find((m) => m.status !== "VALIDADO");
    if (naoValidado) {
      return NextResponse.json({ message: `A entrega do mês ${naoValidado.mes} de "${naoValidado.proposta.titulo}" não está validada.` }, { status: 400 });
    }

    const leiUrl = urlDaLei(request);
    const arquivos: { nome: string; dados: Buffer }[] = [];
    const usados = new Set<string>();

    for (const marco of marcos) {
      const pasta = `${slug(marco.proposta.titulo)}_mes${marco.mes}`;
      const membros = marco.proposta.equipe.length > 0 ? marco.proposta.equipe.map((eq) => [eq]) : [[]];

      for (const grupo of membros) {
        const participantes = participantesDoMarco(marco, grupo);
        const pdf = await generateReceiptPdf(
          {
            projetoNome: marco.proposta.titulo,
            mes: marco.mes,
            nota: marco.nota,
            valorMensalTotal: valorDoMarco(marco),
            validadoEm: marco.validadoEm,
            createdAt: marco.createdAt,
            participantes,
          },
          leiUrl
        );

        const base = `${pasta}/${nomeArquivoRecibo(participantes.map((p) => p.nome), marco)}`;
        let nome = base;
        for (let n = 2; usados.has(nome); n++) nome = base.replace(/\.pdf$/, `_${n}.pdf`);
        usados.add(nome);
        arquivos.push({ nome, dados: pdf });
      }
    }

    const zip = criarZip(arquivos);

    for (const marco of marcos) {
      await logAudit({
        userId: session.userId,
        action: "RECEIPT_GENERATED",
        entityType: "Marco",
        entityId: marco.id,
        before: null,
        after: { mes: marco.mes, valorTotal: valorDoMarco(marco), participantesCount: marco.proposta.equipe.length, lote: true },
        ip: request.headers.get("x-forwarded-for") || undefined,
      });
    }

    const hoje = new Date().toISOString().slice(0, 10);
    return new Response(zip as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="recibos_${hoje}.zip"`,
        "Content-Length": String(zip.length),
      },
    });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    console.error("[RecibosLote]", error);
    return NextResponse.json({ message: "Não foi possível gerar os recibos." }, { status: 500 });
  }
}
