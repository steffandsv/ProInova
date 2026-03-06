export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { isValidCPF, onlyDigits } from "@/lib/cpf";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const cpf = onlyDigits(body?.cpf || "");
  const email = (body?.email || "").toString().trim().toLowerCase();
  const senha = (body?.senha || "").toString();

  if (!isValidCPF(cpf)) return NextResponse.json({ message: "CPF inválido." }, { status: 400 });
  if (senha.length < 8) return NextResponse.json({ message: "Senha fraca (mínimo 8 caracteres)." }, { status: 400 });

  const mun = await prisma.municipe.findFirst({
    where: { cpf },
    select: { nome: true, telefone: true, data_nasc: true, rg: true, apagado: true },
  });
  if (!mun || (mun.apagado && mun.apagado !== "0")) return NextResponse.json({ message: "CPF não habilitado para cadastro." }, { status: 403 });

  const existing = await prisma.user.findUnique({ where: { cpf } });
  if (existing) return NextResponse.json({ message: "Já existe conta para este CPF." }, { status: 409 });

  const passwordHash = await hashPassword(senha);
  const user = await prisma.user.create({
    data: {
      cpf,
      nome: mun.nome,
      telefone: mun.telefone,
      email: email || null,
      dataNasc: mun.data_nasc ? mun.data_nasc : null,
      rg: mun.rg,
      passwordHash,
    },
  });

  const token = signSession({ sub: user.id, role: user.role, cpf: user.cpf, nome: user.nome });
  setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
