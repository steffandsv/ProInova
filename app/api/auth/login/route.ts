export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, verifyPassword } from "@/lib/auth";
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

  // Set cookie directly on the response (cookies() from next/headers is unreliable in POST handlers)
  const response = NextResponse.json({ ok: true });
  response.cookies.set("proinova_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 365 days
  });

  return response;
}
