export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireAuth, signSession, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// POST: o usuário troca a própria senha (inclusive a provisória gerada pelo admin)
export async function POST(request: Request) {
  try {
    const session = requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const senhaAtual = (body?.senhaAtual || "").toString();
    const novaSenha = (body?.novaSenha || "").toString();

    if (novaSenha.length < 8) {
      return NextResponse.json({ message: "A nova senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    }
    if (novaSenha === senhaAtual) {
      return NextResponse.json({ message: "A nova senha precisa ser diferente da atual." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ message: "Conta não encontrada." }, { status: 404 });

    if (!(await verifyPassword(senhaAtual, user.passwordHash))) {
      return NextResponse.json({ message: "A senha atual não confere." }, { status: 400 });
    }

    const passwordHash = await hashPassword(novaSenha);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false },
      });
      await logAudit(
        {
          userId: user.id,
          action: "SENHA_ALTERADA",
          entityType: "User",
          entityId: user.id,
          after: { eraProvisoria: user.mustChangePassword },
          ip: request.headers.get("x-forwarded-for") || undefined,
        },
        tx
      );
    });

    // Sessão nova, já sem a marca de senha provisória
    const token = signSession({ sub: user.id, role: user.role, cpf: user.cpf, nome: user.nome, mustChangePassword: false });
    const response = NextResponse.json({ ok: true });
    response.cookies.set("proinova_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 365 days
    });
    return response;
  } catch (error: any) {
    if (error.message === "No session") {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }
    console.error("[TrocarSenha]", error);
    return NextResponse.json({ message: "Não foi possível trocar a senha." }, { status: 500 });
  }
}
