import { prisma } from "@/lib/prisma";
import { redactMinorData } from "@/lib/lgpd";
import {
  CAPACIDADE_VISITANTES,
  CATEGORIAS,
  CURADORIA_PROINOVA,
  MOSTRAR_INSCRITOS_A_PARTIR_DE,
  PRAZO_EMPRESAS_ISO,
  VAGAS_PITCH_EXTRAS,
  VIPS_PADRAO,
} from "@/constants/sharktank";
import type { SharkData, SharkStats, StartupCard, VipCard } from "@/lib/sharktank-types";

/**
 * Projetos do ProInova que entram no tanque: aprovados (homologados em diante)
 * e com pelo menos uma entrega mensal já validada pela coordenação.
 */
const STATUS_APROVADOS = ["HOMOLOGADA", "TERMO_OUTORGA", "EM_EXECUCAO", "CONCLUIDA"] as const;

const CONECTORES = new Set(["de", "da", "do", "das", "dos", "e", "di", "du"]);

export function tituloNome(nome: string): string {
  return nome
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i > 0 && CONECTORES.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

const ENTIDADES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

/** Remove HTML do editor rico e normaliza espaços. */
export function textoLimpo(html: string | null | undefined): string {
  return (html || "")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#?\w+);/g, (m, e) => ENTIDADES[e] ?? m)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

function cortar(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  const fim = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf(" "));
  return corte.slice(0, fim > max * 0.6 ? fim : max).replace(/[,;:\s]+$/, "") + "…";
}

function primeiraFrase(texto: string, max = 140): string {
  const m = texto.match(/^(.{30,}?[.!?])(\s|$)/s);
  return cortar((m ? m[1] : texto).replace(/\s+/g, " "), max);
}

function nomeCurto(titulo: string): string {
  const t = titulo.trim().replace(/\s+/g, " ");
  if (t.length <= 42) return t;
  const parte = t.split(/[:\-–—|]/)[0].trim();
  return parte.length >= 4 && parte.length <= 42 ? parte : cortar(t, 42);
}

function categoriaValida(c: string | null | undefined): string {
  return c && (CATEGORIAS as readonly string[]).includes(c) ? c : "Outro";
}

export function fotoUrl(tipo: "startup" | "vip", id: string, atualizado: Date): string {
  return `/api/sharktank/foto/${tipo}/${id}?v=${atualizado.getTime()}`;
}

/* ───────────────────────── leitura (com cache curto) ───────────────────────── */

type Cache<T> = { valor: T; expira: number } | null;
let cacheVitrine: Cache<{ startups: StartupCard[]; vips: VipCard[] }> = null;
let cacheStats: Cache<SharkStats> = null;

/** Chame depois de qualquer escrita para a página refletir na hora. */
export function invalidarCacheSharkTank() {
  cacheVitrine = null;
  cacheStats = null;
}

export type ProinovaAdmin = { card: StartupCard; propostaId: string; oculta: boolean; overrideId: string | null };

async function carregarProinova(): Promise<StartupCard[]> {
  return (await listarProinova()).filter((x) => !x.oculta).map((x) => x.card);
}

/** Todos os projetos aprovados com entrega validada, inclusive os ocultados pela organização. */
export async function listarProinova(): Promise<ProinovaAdmin[]> {
  const propostas = await prisma.proposta.findMany({
    where: {
      status: { in: [...STATUS_APROVADOS] },
      marcos: { some: { status: "VALIDADO" } },
    },
    select: {
      id: true,
      titulo: true,
      resumo: true,
      problema: true,
      propostaValor: true,
      modalidade: true,
      sigiloso: true,
      equipe: { select: { nome: true, ehMenor: true } },
      marcos: { select: { status: true } },
    },
  });

  let overrides: { propostaId: string | null; id: string; pitch: string; status: string; fotoMime: string | null; updatedAt: Date }[] = [];
  try {
    overrides = await prisma.sharkStartup.findMany({
      where: { propostaId: { in: propostas.map((p) => p.id) } },
      select: { id: true, propostaId: true, pitch: true, status: true, fotoMime: true, updatedAt: true },
    });
  } catch {
    /* tabelas do evento ainda não criadas: segue sem sobrescritas */
  }
  const porProposta = new Map(overrides.map((o) => [o.propostaId, o]));

  return propostas
    .map((p) => {
      const cur = CURADORIA_PROINOVA[p.id];
      const ov = porProposta.get(p.id);
      const resumo = textoLimpo(p.resumo);
      const validados = p.marcos.filter((m) => m.status === "VALIDADO").length;
      const fundadores = p.equipe.map((m) => (m.ehMenor ? redactMinorData({ nome: m.nome, ehMenor: true }).nome : tituloNome(m.nome)));
      const card: StartupCard = {
        id: `p_${p.id}`,
        origem: "PROINOVA" as const,
        nome: cur?.nome || nomeCurto(p.titulo),
        pitch: (ov?.pitch && ov.pitch.trim()) || cur?.pitch || primeiraFrase(textoLimpo(p.propostaValor) || resumo),
        descricao: cortar(resumo, 900),
        problema: p.sigiloso ? null : cortar(textoLimpo(p.problema), 420) || null,
        categoria: cur?.categoria || (p.modalidade === "EDUCACAO" ? "Educação" : "Governo Digital"),
        estagio: null,
        cidade: "Jaborandi/SP",
        fundadores,
        fotoUrl: ov?.fotoMime ? fotoUrl("startup", ov.id, ov.updatedAt) : null,
        link: null,
        paginaPublica: `/projeto/${p.id}`,
        progresso: { validados, total: p.marcos.length },
      };
      return { card, propostaId: p.id, oculta: ov?.status === "OCULTA", overrideId: ov?.id ?? null };
    })
    .sort(({ card: a }, { card: b }) => {
      const pa = a.progresso!, pb = b.progresso!;
      return pb.validados - pa.validados || pb.validados / pb.total - pa.validados / pa.total || a.nome.localeCompare(b.nome);
    });
}

async function carregarInscritas(): Promise<StartupCard[]> {
  const linhas = await prisma.sharkStartup.findMany({
    where: { status: "APROVADA", propostaId: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, nome: true, pitch: true, descricao: true, categoria: true, estagio: true,
      cidade: true, link: true, fotoMime: true, responsavelNome: true, updatedAt: true,
    },
  });
  return linhas.map((s) => ({
    id: `s_${s.id}`,
    origem: "INSCRITA" as const,
    nome: s.nome,
    pitch: s.pitch,
    descricao: s.descricao,
    problema: null,
    categoria: categoriaValida(s.categoria),
    estagio: s.estagio,
    cidade: s.cidade || "Região de Jaborandi",
    fundadores: s.responsavelNome ? [tituloNome(s.responsavelNome)] : [],
    fotoUrl: s.fotoMime ? fotoUrl("startup", s.id, s.updatedAt) : null,
    link: s.link,
    paginaPublica: null,
    progresso: null,
  }));
}

async function carregarVips(): Promise<VipCard[]> {
  try {
    const vips = await prisma.sharkVip.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
      select: { id: true, nome: true, cargo: true, cidade: true, fotoMime: true, updatedAt: true },
    });
    const total = await prisma.sharkVip.count();
    if (total > 0) {
      return vips.map((v) => ({
        id: v.id, nome: v.nome, cargo: v.cargo, cidade: v.cidade,
        fotoUrl: v.fotoMime ? fotoUrl("vip", v.id, v.updatedAt) : null,
      }));
    }
  } catch {
    /* sem tabela ainda */
  }
  return VIPS_PADRAO.map((v, i) => ({ id: `padrao-${i}`, ...v, fotoUrl: null }));
}

async function carregarVitrine() {
  if (cacheVitrine && cacheVitrine.expira > Date.now()) return cacheVitrine.valor;
  const [proinova, inscritas, vips] = await Promise.all([
    carregarProinova().catch((e) => { console.error("[sharktank] proinova:", e?.message); return [] as StartupCard[]; }),
    carregarInscritas().catch(() => [] as StartupCard[]),
    carregarVips(),
  ]);
  const valor = { startups: [...proinova, ...inscritas], vips };
  cacheVitrine = { valor, expira: Date.now() + 60_000 };
  return valor;
}

export async function contarVisitantes(): Promise<number> {
  try {
    return await prisma.sharkVisitante.count();
  } catch {
    return 0;
  }
}

export async function contarStartupsInscritas(): Promise<number> {
  try {
    return await prisma.sharkStartup.count({ where: { propostaId: null, status: { not: "OCULTA" } } });
  } catch {
    return 0;
  }
}

export function inscricoesEmpresasAbertas(agora = new Date()): boolean {
  return agora.getTime() <= new Date(PRAZO_EMPRESAS_ISO).getTime();
}

export async function getSharkStats(startups?: StartupCard[]): Promise<SharkStats> {
  if (cacheStats && cacheStats.expira > Date.now() && !startups) return cacheStats.valor;
  const lista = startups || (await carregarVitrine()).startups;
  const [visitantes, inscritas] = await Promise.all([contarVisitantes(), contarStartupsInscritas()]);
  const stats: SharkStats = {
    visitantes,
    capacidade: CAPACIDADE_VISITANTES,
    vagasRestantes: Math.max(0, CAPACIDADE_VISITANTES - visitantes),
    mostrarInscritos: visitantes >= MOSTRAR_INSCRITOS_A_PARTIR_DE,
    startups: lista.length,
    entregasValidadas: lista.reduce((s, x) => s + (x.progresso?.validados || 0), 0),
    vagasPitchRestantes: Math.max(0, VAGAS_PITCH_EXTRAS - inscritas),
    inscricoesEmpresasAbertas: inscricoesEmpresasAbertas(),
  };
  cacheStats = { valor: stats, expira: Date.now() + 10_000 };
  return stats;
}

export async function getSharkData(): Promise<SharkData> {
  const vitrine = await carregarVitrine();
  const stats = await getSharkStats(vitrine.startups);
  return { ...vitrine, stats };
}

/* ───────────────────────── utilidades de entrada ───────────────────────── */

/** Mantém só dígitos e tira o 55 do Brasil. Retorna null se não parecer um celular/fixo com DDD. */
export function normalizarWhatsapp(raw: string | null | undefined): string | null {
  let d = (raw || "").replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2);
  if (d.length < 10 || d.length > 11) return null;
  return d;
}

export function mascararTelefone(d: string): string {
  const ddd = d.slice(0, 2);
  const fim = d.slice(-4);
  return `(${ddd}) ${d.length === 11 ? "•••••" : "••••"}-${fim}`;
}

/** Confere a assinatura do arquivo de imagem (não confia no tipo informado pelo navegador). */
export function detectarImagem(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export const FOTO_MAX_BYTES = 2 * 1024 * 1024;
