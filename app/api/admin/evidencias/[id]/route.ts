export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// PATCH: coordenação altera status público da evidência
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth(request);
    if (!["ADMIN", "TRIAGEM"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { publica } = body;

    if (typeof publica !== "boolean") {
      return NextResponse.json({ message: "O campo 'publica' deve ser um boolean." }, { status: 400 });
    }

    const evidencia = await prisma.evidencia.findUnique({
      where: { id: params.id },
    });

    if (!evidencia) {
      return NextResponse.json({ message: "Evidência não encontrada." }, { status: 404 });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.evidencia.update({
        where: { id: params.id },
        data: { publica },
      });

      await logAudit({
        userId: session.userId,
        action: `EVIDENCIA_PUBLICADA_${publica.toString().toUpperCase()}`,
        entityType: "Evidencia",
        entityId: params.id,
        before: { publica: evidencia.publica },
        after: { publica },
        ip: request.headers.get("x-forwarded-for") || undefined,
      }, tx);
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "No session") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
