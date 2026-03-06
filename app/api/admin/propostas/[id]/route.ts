import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAvailableTransitions } from "@/lib/workflow";
import { Role } from "@prisma/client";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth(request);
    if (!["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const proposta = await prisma.proposta.findUnique({
      where: { id: params.id },
      include: {
        proponente: {
          select: { nome: true, cpf: true, email: true },
        },
        edital: {
          include: { config: true },
        },
        equipe: true,
        marcos: {
          orderBy: { mes: "asc" }
        },
        avaliacoes: {
          include: {
            avaliador: { select: { nome: true, email: true } }
          },
          orderBy: { createdAt: "desc" }
        },
      },
    });

    if (!proposta) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // AuditLog is NOT a direct relation on Proposta — query separately
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "Proposta",
        entityId: params.id,
        action: { startsWith: "WORKFLOW_" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Determine available transitions for the current user
    const userRole = session.role as Role;
    const availableTransitions = getAvailableTransitions(proposta.status, userRole, proposta.modalidade);

    return NextResponse.json({ 
      ok: true, 
      data: {
        ...proposta,
        AuditLog: auditLogs,
        availableTransitions
      }
    });
  } catch (error: any) {
    if (error.message === "No session") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
