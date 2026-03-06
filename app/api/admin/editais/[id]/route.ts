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

const EditalUpdateSchema = z.object({
  titulo: z.string().min(5),
  descricao: z.string().min(10),
  modalidade: z.enum(["EDUCACAO", "GERAL"]),
  status: z.enum(["RASCUNHO", "ABERTO", "ENCERRADO"]),
  abreEm: z.string().datetime(),
  fechaEm: z.string().datetime(),
  config: EditalConfigSchema,
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth();
    requireRole(session, "ADMIN");

    const edital = await prisma.edital.findUnique({
      where: { id: params.id },
      include: { config: true },
    });

    if (!edital) return NextResponse.json({ message: "Não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true, data: edital });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 401 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth();
    requireRole(session, "ADMIN");

    const body = await req.json().catch(() => ({}));
    const parsed = EditalUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { config, ...editalData } = parsed.data;

    const edital = await prisma.edital.update({
      where: { id: params.id },
      data: {
        ...editalData,
        abreEm: new Date(editalData.abreEm),
        fechaEm: new Date(editalData.fechaEm),
        config: {
          upsert: {
            create: {
              linhasTematicas: config.linhasTematicas,
              pesosMatrizJson: config.pesosMatrizJson as any,
              tetoMensal: config.tetoMensal,
              duracaoMaxMeses: config.duracaoMaxMeses,
            },
            update: {
              linhasTematicas: config.linhasTematicas,
              pesosMatrizJson: config.pesosMatrizJson as any,
              tetoMensal: config.tetoMensal,
              duracaoMaxMeses: config.duracaoMaxMeses,
            },
          },
        },
      },
    });

    return NextResponse.json({ ok: true, data: edital });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth();
    requireRole(session, "ADMIN");

    await prisma.edital.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ message: "Não é possível excluir (possui propostas vinculadas) ou registro não existe." }, { status: 400 });
  }
}
