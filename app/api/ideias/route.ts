export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCPF, onlyDigits } from "@/lib/cpf";

/* ── GET — list all ideas ─────────────────────────────────────────────── */
export async function GET() {
  const ideias = await prisma.ideia.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nomeAutor: true,
      titulo: true,
      descricao: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, data: ideias });
}

/* ── POST — submit a new idea ─────────────────────────────────────────── */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cpf = onlyDigits(body.cpf || "");
    const titulo = (body.titulo || "").trim();
    const descricao = (body.descricao || "").trim();

    if (!isValidCPF(cpf)) {
      return NextResponse.json({ ok: false, message: "CPF inválido." }, { status: 400 });
    }
    if (!titulo || titulo.length < 5) {
      return NextResponse.json({ ok: false, message: "Título deve ter pelo menos 5 caracteres." }, { status: 400 });
    }
    if (!descricao || descricao.length < 10) {
      return NextResponse.json({ ok: false, message: "Descrição deve ter pelo menos 10 caracteres." }, { status: 400 });
    }

    // Look up citizen in the legacy Municipe table
    const mun = await prisma.municipe.findFirst({
      where: { cpf },
      select: { nome: true, apagado: true },
    });

    if (!mun || (mun.apagado && mun.apagado !== "0")) {
      return NextResponse.json(
        { ok: false, message: "CPF não consta no cadastro municipal. Procure a Secretaria de Administração." },
        { status: 404 }
      );
    }

    const ideia = await prisma.ideia.create({
      data: {
        cpf,
        nomeAutor: mun.nome,
        titulo,
        descricao,
      },
    });

    return NextResponse.json({ ok: true, data: { id: ideia.id, nomeAutor: mun.nome } }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/ideias]", err);
    return NextResponse.json({ ok: false, message: "Erro interno." }, { status: 500 });
  }
}
