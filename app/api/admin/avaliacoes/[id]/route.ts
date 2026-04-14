import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth(request);
    if (!["ADMIN", "PREFEITO"].includes(session.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { parecer } = body;

    if (!parecer || typeof parecer !== "string") {
      return NextResponse.json({ error: "Parecer é obrigatório." }, { status: 400 });
    }

    const updated = await prisma.avaliacao.update({
      where: { id: params.id },
      data: { parecer },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
