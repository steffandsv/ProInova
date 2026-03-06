import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = readSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      user: {
        userId: session.sub,
        nome: session.nome,
        cpf: session.cpf,
        role: session.role,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
}
