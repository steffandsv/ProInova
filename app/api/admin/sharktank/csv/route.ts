export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

const cel = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Lista de visitantes em CSV (abre direto no Excel, separado por ponto e vírgula). */
export async function GET(req: Request) {
  try {
    requireRole(requireAuth(req), "ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO");
  } catch (err: any) {
    return new Response(err?.message === "No session" ? "Não autenticado." : "Sem permissão.", { status: err?.message === "No session" ? 401 : 403 });
  }
  const linhas = await prisma.sharkVisitante.findMany({ orderBy: { id: "asc" } });
  const cab = ["Ingresso", "Nome", "CPF", "WhatsApp", "De Jaborandi", "Lista de espera", "Origem", "Inscrito em"];
  const corpo = linhas.map((v) =>
    [
      v.id, v.nome, v.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"), v.whatsapp || "",
      v.municipe ? "Sim" : "Não", v.listaEspera ? "Sim" : "Não", v.origem || "",
      v.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    ].map(cel).join(";"),
  );
  const csv = "﻿" + [cab.join(";"), ...corpo].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sharktank-visitantes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
