export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { ipDaRequisicao, permitir } from "@/lib/rate-limit";
import { mascararTelefone, normalizarWhatsapp, tituloNome } from "@/lib/proinovaday";

/**
 * Consulta rápida de CPF para o formulário do ProInova Day.
 * Devolve só o necessário para preencher a tela: o nome e o WhatsApp MASCARADO
 * (o número completo nunca sai do servidor; a inscrição usa o do cadastro direto no banco).
 */
export async function POST(req: Request) {
  if (!permitir(`st-cpf:${ipDaRequisicao(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ ok: false, message: "Muitas consultas. Aguarde alguns minutos." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const cpf = onlyDigits(String(body.cpf || ""));
  if (!isValidCPF(cpf)) {
    return NextResponse.json({ ok: false, message: "Esse CPF não é válido. Confere os números?" }, { status: 400 });
  }

  let jaInscrito: { id: number; nome: string } | null = null;
  try {
    jaInscrito = await prisma.proInovaDayVisitante.findUnique({ where: { cpf }, select: { id: true, nome: true } });
  } catch {
    /* tabela ainda não criada */
  }

  const mun = await prisma.municipe
    .findFirst({ where: { cpf }, select: { nome: true, telefone: true, apagado: true } })
    .catch(() => null);
  const ativo = mun && (!mun.apagado || mun.apagado === "0");
  const tel = ativo ? normalizarWhatsapp(mun!.telefone) : null;

  return NextResponse.json({
    ok: true,
    municipe: !!ativo,
    nome: ativo ? tituloNome(mun!.nome) : null,
    whatsappMascarado: tel ? mascararTelefone(tel) : null,
    jaInscrito: !!jaInscrito,
    numero: jaInscrito?.id ?? null,
    primeiroNome: jaInscrito ? tituloNome(jaInscrito.nome).split(" ")[0] : null,
    nomeInscrito: jaInscrito ? tituloNome(jaInscrito.nome) : null,
  });
}
