export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { ipDaRequisicao, permitir } from "@/lib/rate-limit";
import { CATEGORIAS, ESTAGIOS } from "@/constants/sharktank";
import {
  FOTO_MAX_BYTES,
  detectarImagem,
  inscricoesEmpresasAbertas,
  invalidarCacheSharkTank,
  normalizarWhatsapp,
} from "@/lib/sharktank";

const txt = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const erro = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  if (!permitir(`st-emp:${ipDaRequisicao(req)}`, 6, 10 * 60_000)) {
    return erro("Muitas tentativas. Aguarde alguns minutos.", 429);
  }
  if (!inscricoesEmpresasAbertas()) return erro("As inscrições de startups para o pitch já encerraram.", 403);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return erro("Envio inválido.");
  }
  if (txt(form.get("website"))) return NextResponse.json({ ok: true, id: "", nome: "" });

  const cpf = onlyDigits(txt(form.get("cpf")));
  if (!isValidCPF(cpf)) return erro("CPF inválido.");
  if (txt(form.get("compromisso")) !== "true") return erro("Marque o compromisso de apresentar no dia do evento.");

  const nomeStartup = txt(form.get("startupNome")).replace(/\s+/g, " ");
  const pitch = txt(form.get("pitch")).replace(/\s+/g, " ");
  const descricao = txt(form.get("descricao"));
  const categoria = txt(form.get("categoria"));
  const estagio = txt(form.get("estagio")) || null;
  const cidade = txt(form.get("cidade")).slice(0, 120) || null;
  let link = txt(form.get("link")) || null;

  if (nomeStartup.length < 2 || nomeStartup.length > 120) return erro("Dê um nome para sua startup (até 120 caracteres).");
  if (pitch.length < 10 || pitch.length > 180) return erro("A frase de impacto precisa ter entre 10 e 180 caracteres.");
  if (descricao.length < 40 || descricao.length > 2000) return erro("Explique sua ideia com pelo menos 40 caracteres (máx. 2000).");
  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return erro("Escolha uma categoria.");
  if (estagio && !(ESTAGIOS as readonly string[]).includes(estagio)) return erro("Estágio inválido.");
  if (link) {
    if (!/^https?:\/\//i.test(link)) link = `https://${link}`;
    try {
      const u = new URL(link);
      if (!["http:", "https:"].includes(u.protocol) || link.length > 500) throw new Error();
    } catch {
      return erro("O link informado não parece válido.");
    }
  }

  // Responsável: usa o cadastro municipal quando existir.
  const mun = await prisma.municipe
    .findFirst({ where: { cpf }, select: { nome: true, telefone: true, apagado: true } })
    .catch(() => null);
  const ehMunicipe = !!mun && (!mun.apagado || mun.apagado === "0");
  const responsavelNome = txt(form.get("nome")).replace(/\s+/g, " ") || (ehMunicipe ? mun!.nome : "");
  if (responsavelNome.length < 3) return erro("Informe o nome do responsável.");
  let whatsapp = normalizarWhatsapp(txt(form.get("whatsapp")));
  if (!whatsapp && txt(form.get("usarWhatsappCadastro")) === "true" && ehMunicipe) whatsapp = normalizarWhatsapp(mun!.telefone);
  if (!whatsapp) return erro("Informe um WhatsApp com DDD para a organização falar com você.");

  let foto: Buffer | null = null;
  let fotoMime: string | null = null;
  const arquivo = form.get("foto");
  if (arquivo && typeof arquivo !== "string" && arquivo.size > 0) {
    if (arquivo.size > FOTO_MAX_BYTES) return erro("A foto ficou grande demais (máx. 2 MB).");
    foto = Buffer.from(await arquivo.arrayBuffer());
    fotoMime = detectarImagem(foto);
    if (!fotoMime) return erro("A foto precisa ser JPG, PNG ou WEBP.");
  }

  try {
    const doMesmoCpf = await prisma.sharkStartup.count({ where: { responsavelCpf: cpf } });
    if (doMesmoCpf >= 3) return erro("Este CPF já cadastrou 3 startups. Fale com a organização.");

    const nova = await prisma.sharkStartup.create({
      data: {
        nome: nomeStartup, pitch, descricao, categoria, estagio, cidade, link,
        foto, fotoMime,
        responsavelCpf: cpf, responsavelNome, responsavelWhatsapp: whatsapp,
      },
      select: { id: true, nome: true },
    });
    invalidarCacheSharkTank();
    return NextResponse.json({ ok: true, id: nova.id, nome: nova.nome });
  } catch (err) {
    console.error("[sharktank] empresa:", err);
    return erro("Não foi possível concluir agora. Tente de novo.", 500);
  }
}
