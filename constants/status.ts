/**
 * Centralized status and action label/color/icon mappings.
 * Import from here instead of re-defining locally.
 */

// ─── Proposta Status ────────────────────────────────────────────────────────

export const statusLabelMap: Record<string, string> = {
  RASCUNHO: "Rascunho",
  SUBMETIDA: "Submetida",
  EM_TRIAGEM: "Em triagem",
  PARECER_EDUCACAO: "Parecer da educação",
  AVALIACAO_CMAA: "Avaliação CMAA",
  CLASSIFICADA: "Classificada",
  HOMOLOGADA: "Homologada",
  TERMO_OUTORGA: "Termo de outorga",
  EM_EXECUCAO: "Em execução",
  SUSPENSA: "Suspensa",
  EM_AJUSTE: "Em ajuste",
  CANCELADA: "Cancelada",
  CONCLUIDA: "Concluída",
};

/** CSS-var colours (for screen rendering) */
export const statusColors: Record<string, string> = {
  RASCUNHO: "var(--muted)",
  SUBMETIDA: "var(--accent)",
  EM_TRIAGEM: "var(--warn)",
  PARECER_EDUCACAO: "var(--warn)",
  AVALIACAO_CMAA: "var(--warn)",
  CLASSIFICADA: "var(--good)",
  HOMOLOGADA: "var(--good)",
  TERMO_OUTORGA: "var(--accent)",
  EM_EXECUCAO: "var(--good)",
  SUSPENSA: "var(--bad)",
  EM_AJUSTE: "var(--warn)",
  CANCELADA: "var(--bad)",
  CONCLUIDA: "var(--good)",
};

/** Hex colours (for print/PDF rendering where CSS vars are not supported) */
export const statusColorsPrint: Record<string, string> = {
  RASCUNHO: "#999",
  SUBMETIDA: "#7c5cff",
  EM_TRIAGEM: "#f59e0b",
  PARECER_EDUCACAO: "#f59e0b",
  AVALIACAO_CMAA: "#f59e0b",
  CLASSIFICADA: "#22c55e",
  HOMOLOGADA: "#22c55e",
  TERMO_OUTORGA: "#7c5cff",
  EM_EXECUCAO: "#22c55e",
  SUSPENSA: "#ef4444",
  EM_AJUSTE: "#f59e0b",
  CANCELADA: "#ef4444",
  CONCLUIDA: "#22c55e",
};

// ─── Marco Status ────────────────────────────────────────────────────────────

export const marcoStatusLabelMap: Record<string, string> = {
  PENDENTE: "Pendente",
  SUBMETIDO: "Submetido",
  VALIDADO: "Validado",
  AJUSTE_SOLICITADO: "Ajuste solicitado",
  REJEITADO: "Rejeitado",
};

export const marcoStatusColors: Record<string, string> = {
  PENDENTE: "var(--muted)",
  SUBMETIDO: "var(--accent)",
  VALIDADO: "var(--good)",
  AJUSTE_SOLICITADO: "var(--warn)",
  REJEITADO: "var(--bad)",
};

export const marcoStatusIcons: Record<string, string> = {
  PENDENTE: "⏳",
  SUBMETIDO: "📤",
  VALIDADO: "✅",
  AJUSTE_SOLICITADO: "🔄",
  REJEITADO: "❌",
};

// ─── Marco Histórico – Ação ──────────────────────────────────────────────────

export const marcoAcaoLabelMap: Record<string, string> = {
  SUBMISSAO: "Submissão",
  REENVIO: "Reenvio",
  EDICAO: "Edição",
  REMOCAO: "Remoção",
  VALIDACAO: "Validação",
  SOLICITACAO_AJUSTE: "Solicitação de ajuste",
  REJEICAO: "Rejeição",
  ANULACAO: "Anulação",
};
