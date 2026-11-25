export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, type SessionPayload } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { CATEGORIA_COR, VIPS_PADRAO } from "@/constants/proinovaday";
import {
  FOTO_MAX_BYTES,
  detectarImagem,
  fotoUrl,
  invalidarCacheProInovaDay,
  listarProinova,
} from "@/lib/proinovaday";

const PAPEIS = ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"];

function sessaoAdmin(req: Request): SessionPayload {
  const s = requireAuth(req);
  requireRole(s, ...PAPEIS);
  return s;
}

function falha(err: any) {
  if (err?.message === "No session") return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  if (err?.message?.includes("permissão")) return NextResponse.json({ message: err.message }, { status: 403 });
  if (err?.status) return NextResponse.json({ message: err.message }, { status: err.status });
  console.error("[admin/proinovaday]", err);
  return NextResponse.json({ message: "Erro interno." }, { status: 500 });
}

class Erro400 extends Error {
  status = 400;
}

async function lerFoto(form: FormData): Promise<{ foto: Buffer; fotoMime: string } | null> {
  const arq = form.get("foto");
  if (!arq || typeof arq === "string" || arq.size === 0) return null;
  if (arq.size > FOTO_MAX_BYTES) throw new Erro400("Foto grande demais (máx. 2 MB).");
  const foto = Buffer.from(await arq.arrayBuffer());
  const fotoMime = detectarImagem(foto);
  if (!fotoMime) throw new Erro400("A foto precisa ser JPG, PNG ou WEBP.");
  return { foto, fotoMime };
}

const txt = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};

/** Painel do ProInova Day: visitantes, startups inscritas, vitrine do ProInova e convidados VIP. */
export async function GET(req: Request) {
  try {
    sessaoAdmin(req);

    // primeira visita ao painel: cria os VIPs padrão para a organização só trocar as fotos
    if ((await prisma.proInovaDayVip.count()) === 0) {
      // ids fixos + skipDuplicates: duas abas abrindo o painel ao mesmo tempo não duplicam
      await prisma.proInovaDayVip.createMany({ data: VIPS_PADRAO.map((v, i) => ({ id: `vip-padrao-${i + 1}`, ...v, ordem: i + 1 })), skipDuplicates: true });
      invalidarCacheProInovaDay();
    }

    const [visitantes, startups, vips, proinova] = await Promise.all([
      prisma.proInovaDayVisitante.findMany({ orderBy: { id: "desc" } }),
      prisma.proInovaDayStartup.findMany({
        where: { propostaId: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, status: true, nome: true, pitch: true, descricao: true, categoria: true, estagio: true, cidade: true, link: true,
          fotoMime: true, responsavelNome: true, responsavelCpf: true, responsavelWhatsapp: true, createdAt: true, updatedAt: true,
        },
      }),
      prisma.proInovaDayVip.findMany({
        orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
        select: { id: true, nome: true, cargo: true, cidade: true, ordem: true, ativo: true, fotoMime: true, updatedAt: true },
      }),
      listarProinova(),
    ]);

    return NextResponse.json({
      ok: true,
      visitantes,
      startups: startups.map(({ fotoMime, updatedAt, ...s }) => ({ ...s, fotoUrl: fotoMime ? fotoUrl("startup", s.id, updatedAt) : null })),
      vips: vips.map(({ fotoMime, updatedAt, ...v }) => ({ ...v, fotoUrl: fotoMime ? fotoUrl("vip", v.id, updatedAt) : null })),
      proinova: proinova.map((p) => ({ propostaId: p.propostaId, oculta: p.oculta, nome: p.card.nome, categoria: p.card.categoria, pitch: p.card.pitch, fotoUrl: p.card.fotoUrl, progresso: p.card.progresso })),
    });
  } catch (err) {
    return falha(err);
  }
}

/**
 * Ações do painel (multipart/form-data, campo "acao"):
 * startup-status · startup-excluir · proinova-foto · proinova-visivel · vip-salvar · vip-excluir
 */
export async function POST(req: Request) {
  try {
    const sessao = sessaoAdmin(req);
    const form = await req.formData();
    const acao = txt(form, "acao");
    const audit = (action: string, entityType: string, entityId: string, after?: unknown) =>
      logAudit({ userId: sessao.userId, action, entityType, entityId, after });

    if (acao === "startup-status") {
      const id = txt(form, "id");
      const status = txt(form, "status");
      if (!["PENDENTE", "APROVADA", "OCULTA"].includes(status)) throw new Erro400("Status inválido.");
      await prisma.proInovaDayStartup.update({ where: { id }, data: { status: status as any } });
      await audit("PROINOVADAY_STARTUP_STATUS", "ProInovaDayStartup", id, { status });
    } else if (acao === "startup-excluir") {
      const id = txt(form, "id");
      await prisma.proInovaDayStartup.delete({ where: { id } });
      await audit("PROINOVADAY_STARTUP_EXCLUIDA", "ProInovaDayStartup", id);
    } else if (acao === "proinova-foto" || acao === "proinova-visivel") {
      const propostaId = txt(form, "propostaId");
      const card = (await listarProinova()).find((p) => p.propostaId === propostaId);
      if (!card) throw new Erro400("Projeto não está no tanque.");
      const dados: Record<string, unknown> = {};
      if (acao === "proinova-foto") {
        if (txt(form, "remover") === "true") Object.assign(dados, { foto: null, fotoMime: null });
        else {
          const f = await lerFoto(form);
          if (!f) throw new Erro400("Envie uma foto.");
          Object.assign(dados, f);
        }
      } else {
        dados.status = txt(form, "visivel") === "true" ? "APROVADA" : "OCULTA";
      }
      await prisma.proInovaDayStartup.upsert({
        where: { propostaId },
        update: dados,
        create: {
          propostaId, status: "APROVADA", nome: card.card.nome.slice(0, 120), pitch: "", descricao: "",
          categoria: CATEGORIA_COR[card.card.categoria] ? card.card.categoria : "Outro", ...dados,
        },
      });
      await audit(acao === "proinova-foto" ? "PROINOVADAY_PROINOVA_FOTO" : "PROINOVADAY_PROINOVA_VISIBILIDADE", "Proposta", propostaId, { status: dados.status });
    } else if (acao === "vip-salvar") {
      const id = txt(form, "id");
      const nome = txt(form, "nome");
      const cargo = txt(form, "cargo");
      if (nome.length < 2 || nome.length > 120) throw new Erro400("Informe o nome do convidado.");
      if (cargo.length < 2 || cargo.length > 160) throw new Erro400("Informe o cargo do convidado.");
      const dados: Record<string, unknown> = {
        nome, cargo,
        cidade: txt(form, "cidade").slice(0, 120) || null,
        ordem: Number(txt(form, "ordem")) || 0,
        ativo: txt(form, "ativo") !== "false",
      };
      if (txt(form, "removerFoto") === "true") Object.assign(dados, { foto: null, fotoMime: null });
      const f = await lerFoto(form);
      if (f) Object.assign(dados, f);
      const vip = id
        ? await prisma.proInovaDayVip.update({ where: { id }, data: dados, select: { id: true } })
        : await prisma.proInovaDayVip.create({ data: dados as any, select: { id: true } });
      await audit("PROINOVADAY_VIP_SALVO", "ProInovaDayVip", vip.id, { nome, cargo });
    } else if (acao === "vip-excluir") {
      const id = txt(form, "id");
      await prisma.proInovaDayVip.delete({ where: { id } });
      await audit("PROINOVADAY_VIP_EXCLUIDO", "ProInovaDayVip", id);
    } else {
      throw new Erro400("Ação desconhecida.");
    }

    invalidarCacheProInovaDay();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return falha(err);
  }
}
