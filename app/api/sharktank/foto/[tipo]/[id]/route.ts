export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const PAPEIS_ADMIN = ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"];

function ehAdmin(req: Request) {
  try {
    return PAPEIS_ADMIN.includes(requireAuth(req).role);
  } catch {
    return false;
  }
}

/** Serve as fotos guardadas no banco (sobrevivem a qualquer novo deploy do contêiner). */
export async function GET(req: Request, { params }: { params: { tipo: string; id: string } }) {
  let foto: Buffer | Uint8Array | null = null;
  let mime: string | null = null;
  let publica = false;

  if (params.tipo === "vip") {
    const v = await prisma.sharkVip.findUnique({ where: { id: params.id }, select: { foto: true, fotoMime: true, ativo: true } }).catch(() => null);
    foto = v?.foto ?? null;
    mime = v?.fotoMime ?? null;
    publica = !!v?.ativo;
  } else if (params.tipo === "startup") {
    const s = await prisma.sharkStartup
      .findUnique({ where: { id: params.id }, select: { foto: true, fotoMime: true, status: true, propostaId: true } })
      .catch(() => null);
    foto = s?.foto ?? null;
    mime = s?.fotoMime ?? null;
    publica = !!s && (s.status === "APROVADA" || (!!s.propostaId && s.status !== "OCULTA"));
  }

  if (!foto || !mime || (!publica && !ehAdmin(req))) return new Response("Não encontrada", { status: 404 });

  return new Response(new Uint8Array(foto), {
    headers: {
      "Content-Type": mime,
      // a URL muda (?v=) sempre que a foto é trocada, então dá para guardar por muito tempo
      "Cache-Control": publica ? "public, max-age=31536000, immutable" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
