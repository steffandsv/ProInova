/** Tipos compartilhados entre servidor e telas do ProInova Day (sem imports de servidor). */

/** A estrutura única de vitrine: serve tanto para projetos do ProInova quanto para startups cadastradas no site. */
export type StartupCard = {
  id: string;
  origem: "PROINOVA" | "INSCRITA";
  nome: string;
  /** Frase de impacto (até ~140 caracteres) */
  pitch: string;
  /** A ideia explicada */
  descricao: string;
  /** O problema que resolve (quando houver) */
  problema: string | null;
  categoria: string;
  estagio: string | null;
  cidade: string;
  fundadores: string[];
  fotoUrl: string | null;
  link: string | null;
  /** Página pública do projeto no ProInova */
  paginaPublica: string | null;
  /** Entregas mensais validadas pela coordenação (só ProInova) */
  progresso: { validados: number; total: number } | null;
};

export type VipCard = {
  id: string;
  nome: string;
  cargo: string;
  cidade: string | null;
  fotoUrl: string | null;
};

export type ProInovaDayStats = {
  visitantes: number;
  capacidade: number;
  vagasRestantes: number;
  mostrarInscritos: boolean;
  startups: number;
  entregasValidadas: number;
  vagasPitchRestantes: number;
  inscricoesEmpresasAbertas: boolean;
};

export type ProInovaDayData = {
  startups: StartupCard[];
  vips: VipCard[];
  stats: ProInovaDayStats;
};
