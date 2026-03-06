import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { z } from "zod";

const EditalConfigSchema = z.object({
  linhasTematicas: z.array(z.string()),
  pesosMatrizJson: z.array(z.object({ criterio: z.string(), peso: z.number() })),
  tetoMensal: z.number().min(0),
  duracaoMaxMeses: z.number().int().min(1).max(12),
});

const EditalCreateSchema = z.object({
  titulo: z.string().min(5),
  descricao: z.string().min(10),
  modalidade: z.enum(["EDUCACAO", "GERAL"]),
  status: z.enum(["RASCUNHO", "ABERTO", "ENCERRADO"]),
  abreEm: z.string().datetime(),
  fechaEm: z.string().datetime(),
  config: EditalConfigSchema,
});

export async function GET() {
  try {
    const session = requireAuth();
    requireRole(session, "ADMIN");

    const editais = await prisma.edital.findMany({
      include: { config: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, data: editais });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = requireAuth();
    requireRole(session, "ADMIN");

    const body = await req.json().catch(() => ({}));
    const parsed = EditalCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { config, ...editalData } = parsed.data;

    const edital = await prisma.edital.create({
      data: {
        ...editalData,
        abreEm: new Date(editalData.abreEm),
        fechaEm: new Date(editalData.fechaEm),
        config: {
          create: {
            linhasTematicas: config.linhasTematicas,
            pesosMatrizJson: config.pesosMatrizJson as any,
            tetoMensal: config.tetoMensal,
            duracaoMaxMeses: config.duracaoMaxMeses,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, data: edital }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
