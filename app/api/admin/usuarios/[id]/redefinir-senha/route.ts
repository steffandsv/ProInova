export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { gerarSenhaProvisoria, hashPassword, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// POST: o ADMIN gera uma senha provisória; a pessoa precisa trocá-la no próximo login.
// A senha volta só nesta resposta e não é gravada em lugar nenhum além do hash.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth(request);
    if (session.role !== "ADMIN") {
      return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, nome: true } });
    if (!user) return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });

    const senhaProvisoria = gerarSenhaProvisoria();
    const passwordHash = await hashPassword(senhaProvisoria);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: true },
      });
      await logAudit(
        {
          userId: session.userId,
          action: "SENHA_REDEFINIDA",
          entityType: "User",
          entityId: user.id,
          after: { mustChangePassword: true },
          ip: request.headers.get("x-forwarded-for") || undefined,
        },
        tx
      );
    });

    return NextResponse.json({ ok: true, nome: user.nome, senhaProvisoria });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    console.error("[RedefinirSenha]", error);
    return NextResponse.json({ message: "Não foi possível redefinir a senha." }, { status: 500 });
  }
}
