import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";
import { isValidCPF, onlyDigits } from "@/lib/cpf";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const cpf = onlyDigits(body?.cpf || "");
  const senha = (body?.senha || "").toString();

  if (!isValidCPF(cpf)) return NextResponse.json({ message: "CPF inválido." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { cpf } });
  if (!user) return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 });

  const ok = await verifyPassword(senha, user.passwordHash);
  if (!ok) return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 });

  const token = signSession({ sub: user.id, role: user.role, cpf: user.cpf, nome: user.nome });
  setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
