export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: lista as contas da plataforma (só ADMIN), sem o hash da senha
export async function GET(request: Request) {
  try {
    const session = requireAuth(request);
    if (session.role !== "ADMIN") {
      return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    }

    const usuarios = await prisma.user.findMany({
      select: { id: true, nome: true, cpf: true, email: true, role: true, createdAt: true, mustChangePassword: true },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ ok: true, data: usuarios });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    console.error("[AdminUsuarios]", error);
    return NextResponse.json({ message: "Não foi possível carregar os usuários." }, { status: 500 });
  }
}
