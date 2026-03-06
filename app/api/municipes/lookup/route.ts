import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCPF, onlyDigits } from "@/lib/cpf";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cpf = onlyDigits(url.searchParams.get("cpf") || "");

  if (!isValidCPF(cpf)) {
    return NextResponse.json({ ok: false, message: "CPF inválido." }, { status: 400 });
  }

  const mun = await prisma.municipe.findFirst({
    where: { cpf },
    select: { nome: true, telefone: true, data_nasc: true, rg: true, apagado: true, apagado_em: true },
  });

  if (!mun || (mun.apagado && mun.apagado !== "0")) {
    return NextResponse.json({ ok: false, message: "CPF não consta no cadastro municipal." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      nome: mun.nome,
      telefone: mun.telefone,
      data_nasc: mun.data_nasc ? mun.data_nasc.toISOString().slice(0, 10) : null,
      rg: mun.rg,
    },
  });
}
