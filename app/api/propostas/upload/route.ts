export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "propostas");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  try {
    requireAuth(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ message: "Apenas arquivos PDF são permitidos." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ message: "O arquivo excede o limite de 10 MB." }, { status: 400 });
    }

    // Ensure upload dir exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const uniqueName = `${crypto.randomUUID()}.pdf`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    await writeFile(filePath, buffer);

    const url = `/uploads/propostas/${uniqueName}`;
    return NextResponse.json({ ok: true, url });
  } catch (err: any) {
    if (err.message === "No session") {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.json({ message: err.message || "Erro interno." }, { status: 500 });
  }
}
