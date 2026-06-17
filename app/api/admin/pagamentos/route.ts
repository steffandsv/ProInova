export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: lista marcos validados aptos para pagamento
export async function GET(request: Request) {
  try {
    const session = requireAuth(request);
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format"); // "csv" para exportação

    const marcosValidados = await prisma.marco.findMany({
      where: { status: "VALIDADO" },
      include: {
        proposta: {
          include: {
            proponente: { select: { nome: true, cpf: true } },
            equipe: {
              select: { nome: true, cpf: true, percentualRateio: true },
            },
            edital: {
              include: { config: true },
            },
          },
        },
      },
      orderBy: [{ proposta: { titulo: "asc" } }, { mes: "asc" }],
    });

    // Calcular valor por marco
    const lote = marcosValidados.map((m) => {
      const teto = m.proposta.edital?.config?.tetoMensal || 1000;
      const notaMultiplier = typeof m.nota === "number" ? m.nota / 10 : 1.0;
      const valorComNota = teto * notaMultiplier;
      return {
        marcoId: m.id,
        mes: m.mes,
        entregavel: m.entregavel,
        validadoEm: m.validadoEm,
        propostaId: m.proposta.id,
        propostaTitulo: m.proposta.titulo,
        modalidade: m.proposta.modalidade,
        proponente: m.proposta.proponente.nome,
        cpfProponente: m.proposta.proponente.cpf,
        nota: m.nota,
        valorMensal: valorComNota,
        rateio: m.proposta.equipe.map((eq) => ({
          nome: eq.nome,
          cpf: eq.cpf,
          percentual: eq.percentualRateio,
          valor: (valorComNota * eq.percentualRateio) / 100,
        })),
      };
    });

    // Exportação CSV
    if (format === "csv") {
      const lines = [
        "Marco ID;Mês;Proposta;Proponente;CPF;Modalidade;Nota;Valor Mensal;Membro;CPF Membro;% Rateio;Valor Rateio;Validado Em",
      ];
      for (const item of lote) {
        for (const r of item.rateio) {
          lines.push(
            `${item.marcoId};${item.mes};${item.propostaTitulo};${item.proponente};${item.cpfProponente};${item.modalidade};${item.nota ?? 10};${item.valorMensal.toFixed(2)};${r.nome};${r.cpf};${r.percentual}%;${r.valor.toFixed(2)};${item.validadoEm ? new Date(item.validadoEm).toLocaleDateString("pt-BR") : ""}`
          );
        }
      }
      const csv = lines.join("\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="lote_pagamento_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      totalMarcos: lote.length,
      valorTotal: lote.reduce((acc: number, l) => acc + l.valorMensal, 0),
      data: lote,
    });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
