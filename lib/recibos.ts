/**
 * Regras do recibo mensal, usadas pelo download individual e pelo download em lote.
 */

type MembroRecibo = { id: string; nome: string; cpf: string; percentualRateio: number };

export type MarcoParaRecibo = {
  mes: number;
  nota: number;
  validadoEm: Date | null;
  createdAt: Date;
  proposta: {
    titulo: string;
    equipe: MembroRecibo[];
    edital: { config: { tetoMensal: number } | null } | null;
  };
};

/** Valor do mês: teto do edital multiplicado pela nota (nota 10 = 100%). */
export function valorDoMarco(marco: MarcoParaRecibo): number {
  const teto = marco.proposta.edital?.config?.tetoMensal ?? 1000;
  const multiplicador = typeof marco.nota === "number" ? marco.nota / 10 : 1.0;
  return teto * multiplicador;
}

export function participantesDoMarco(marco: MarcoParaRecibo, membros: MembroRecibo[] = marco.proposta.equipe) {
  const valorMensalTotal = valorDoMarco(marco);
  return membros.map((eq) => ({
    nome: eq.nome,
    cpf: eq.cpf,
    percentual: eq.percentualRateio,
    valor: (valorMensalTotal * eq.percentualRateio) / 100,
  }));
}

export function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** recibo_<nomes>_<DD-MM-AAAA>.pdf, com a data da validação (ou hoje). */
export function nomeArquivoRecibo(nomes: string[], marco: Pick<MarcoParaRecibo, "validadoEm">): string {
  const nomesSlug = nomes.length > 0 ? nomes.map(slug).join("_") : "proponente";
  const dateRef = marco.validadoEm || new Date();
  const dia = String(dateRef.getDate()).padStart(2, "0");
  const mes = String(dateRef.getMonth() + 1).padStart(2, "0");
  return `recibo_${nomesSlug}_${dia}-${mes}-${dateRef.getFullYear()}.pdf`;
}

/** Endereço absoluto da lei, para o link clicável dentro do PDF. */
export function urlDaLei(request: Request): string {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}/LEI.pdf`;
}
