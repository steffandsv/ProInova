/**
 * Limite simples de requisições por IP, em memória (o app roda em um único contêiner).
 * Protege as rotas públicas do evento contra robôs e varredura de CPFs.
 */
const janelas = new Map<string, { inicio: number; total: number }>();

export function ipDaRequisicao(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0] : req.headers.get("x-real-ip") || "local").trim();
}

/** Retorna true se a requisição pode seguir. */
export function permitir(chave: string, limite: number, janelaMs: number): boolean {
  const agora = Date.now();
  const atual = janelas.get(chave);
  if (!atual || agora - atual.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, total: 1 });
    if (janelas.size > 5000) {
      for (const [k, v] of janelas) if (agora - v.inicio > janelaMs) janelas.delete(k);
    }
    return true;
  }
  atual.total += 1;
  return atual.total <= limite;
}
