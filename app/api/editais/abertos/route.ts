import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const editais = await prisma.edital.findMany({
      where: { status: "ABERTO" },
      orderBy: { abreEm: "desc" },
    });
    return NextResponse.json({ ok: true, data: editais });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
