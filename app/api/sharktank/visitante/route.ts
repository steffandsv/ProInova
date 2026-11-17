export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { ipDaRequisicao, permitir } from "@/lib/rate-limit";
import { CAPACIDADE_VISITANTES } from "@/constants/sharktank";
import { contarVisitantes, invalidarCacheSharkTank, normalizarWhatsapp, tituloNome } from "@/lib/sharktank";

function resposta(v: { id: number; nome: string; listaEspera: boolean }, jaInscrito: boolean) {
  return NextResponse.json({
    ok: true,
    numero: v.id,
    nome: tituloNome(v.nome),
    primeiroNome: tituloNome(v.nome).split(" ")[0],
    listaEspera: v.listaEspera,
    jaInscrito,
  });
}

export async function POST(req: Request) {
  if (!permitir(`st-vis:${ipDaRequisicao(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ ok: false, message: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));

  // Campo invisível: se veio preenchido, é robô. Responde "ok" sem gravar.
  if (body.website) return NextResponse.json({ ok: true, numero: 0, nome: "", primeiroNome: "", listaEspera: false, jaInscrito: false });

  const cpf = onlyDigits(String(body.cpf || ""));
  if (!isValidCPF(cpf)) return NextResponse.json({ ok: false, message: "CPF inválido." }, { status: 400 });
  if (body.compromisso !== true) {
    return NextResponse.json({ ok: false, message: "Marque o compromisso de presença para confirmar." }, { status: 400 });
  }

  try {
    const existente = await prisma.sharkVisitante.findUnique({ where: { cpf } });
    if (existente) return resposta(existente, true);

    const mun = await prisma.municipe
      .findFirst({ where: { cpf }, select: { nome: true, telefone: true, apagado: true } })
      .catch(() => null);
    const ehMunicipe = !!mun && (!mun.apagado || mun.apagado === "0");

    const nome = String(body.nome || "").trim().replace(/\s+/g, " ") || (ehMunicipe ? mun!.nome : "");
    if (nome.length < 3 || nome.length > 255) {
      return NextResponse.json({ ok: false, message: "Informe seu nome completo." }, { status: 400 });
    }

    let whatsapp = normalizarWhatsapp(body.whatsapp);
    if (!whatsapp && body.usarWhatsappCadastro && ehMunicipe) whatsapp = normalizarWhatsapp(mun!.telefone);
    if (!whatsapp) {
      return NextResponse.json({ ok: false, message: "Informe um WhatsApp com DDD." }, { status: 400 });
    }

    const total = await contarVisitantes();
    const origem = String(body.origem || "").replace(/[^\w\-.]/g, "").slice(0, 60) || null;

    const novo = await prisma.sharkVisitante.create({
      data: { cpf, nome, whatsapp, municipe: ehMunicipe, listaEspera: total >= CAPACIDADE_VISITANTES, origem },
    });
    invalidarCacheSharkTank();
    return resposta(novo, false);
  } catch (err: any) {
    if (err?.code === "P2002") {
      const existente = await prisma.sharkVisitante.findUnique({ where: { cpf } });
      if (existente) return resposta(existente, true);
    }
    console.error("[sharktank] visitante:", err);
    return NextResponse.json({ ok: false, message: "Não foi possível concluir agora. Tente de novo." }, { status: 500 });
  }
}
