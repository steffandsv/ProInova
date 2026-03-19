export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCPF, onlyDigits } from "@/lib/cpf";

export async function GET() {
  const total = await prisma.inscricaoLancamento.count();
  return NextResponse.json({ ok: true, total });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cpf = onlyDigits(body.cpf || "");
    const nome = (body.nome || "").trim();
    const idade = body.idade != null ? Number(body.idade) : null;

    if (!isValidCPF(cpf)) {
      return NextResponse.json({ ok: false, message: "CPF inválido." }, { status: 400 });
    }
    if (!nome || nome.length < 2) {
      return NextResponse.json({ ok: false, message: "Nome é obrigatório." }, { status: 400 });
    }

    // Check if already registered
    const existing = await prisma.inscricaoLancamento.findUnique({ where: { cpf } });
    if (existing) {
      return NextResponse.json({ ok: false, message: "Você já está inscrito! Nos vemos lá. 🚀" }, { status: 409 });
    }

    await prisma.inscricaoLancamento.create({
      data: { cpf, nome, idade },
    });

    const total = await prisma.inscricaoLancamento.count();
    return NextResponse.json({ ok: true, total });
  } catch (err: any) {
    console.error("Erro ao inscrever:", err);
    return NextResponse.json({ ok: false, message: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
