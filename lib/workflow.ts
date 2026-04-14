import { PropostaStatus, Role } from "@prisma/client";

/**
 * Mapeamento de transições de status permitidas por role.
 * Cada entrada define: statusAtual → statusNovo, roles que podem executar.
 */
type TransitionRule = {
  from: PropostaStatus;
  to: PropostaStatus;
  roles: Role[];
  requiresEducacao?: boolean; // transição só se aplica a modalidade EDUCACAO
};

export const WORKFLOW_TRANSITIONS: TransitionRule[] = [
  // Proponente submete
  { from: "RASCUNHO", to: "SUBMETIDA", roles: ["PROPONENTE"] },

  // Triagem (Comunicação/Gov Digital)
  { from: "SUBMETIDA", to: "EM_TRIAGEM", roles: ["TRIAGEM", "ADMIN"] },
  { from: "EM_TRIAGEM", to: "PARECER_EDUCACAO", roles: ["TRIAGEM", "ADMIN"], requiresEducacao: true },
  { from: "EM_TRIAGEM", to: "AVALIACAO_CMAA", roles: ["TRIAGEM", "ADMIN"] }, // se não for educação

  // Parecer Educação (apenas quando modalidade = EDUCACAO)
  { from: "PARECER_EDUCACAO", to: "AVALIACAO_CMAA", roles: ["EDUCACAO", "ADMIN"] },

  // CMAA avalia e classifica
  { from: "AVALIACAO_CMAA", to: "CLASSIFICADA", roles: ["CMAA", "ADMIN"] },

  // Prefeito homologa
  { from: "CLASSIFICADA", to: "HOMOLOGADA", roles: ["PREFEITO", "ADMIN"] },

  // Termo de outorga
  { from: "HOMOLOGADA", to: "TERMO_OUTORGA", roles: ["ADMIN"] },

  // Início de execução
  { from: "TERMO_OUTORGA", to: "EM_EXECUCAO", roles: ["ADMIN"] },

  // Conclusão
  { from: "EM_EXECUCAO", to: "CONCLUIDA", roles: ["ADMIN"] },

  // Suspensão / cancelamento (Art. 14 III) – qualquer etapa ativa
  { from: "EM_TRIAGEM", to: "SUSPENSA", roles: ["TRIAGEM", "ADMIN"] },
  { from: "PARECER_EDUCACAO", to: "SUSPENSA", roles: ["EDUCACAO", "ADMIN"] },
  { from: "AVALIACAO_CMAA", to: "SUSPENSA", roles: ["CMAA", "ADMIN"] },
  { from: "EM_EXECUCAO", to: "SUSPENSA", roles: ["ADMIN"] },
  { from: "SUSPENSA", to: "EM_EXECUCAO", roles: ["ADMIN"] },
  { from: "SUSPENSA", to: "CANCELADA", roles: ["ADMIN"] },
  { from: "EM_EXECUCAO", to: "CANCELADA", roles: ["ADMIN"] },

  // Devolução para ajustes (por qualquer avaliador)
  { from: "EM_TRIAGEM", to: "SUBMETIDA", roles: ["TRIAGEM", "ADMIN"] },
  { from: "PARECER_EDUCACAO", to: "EM_TRIAGEM", roles: ["EDUCACAO", "ADMIN"] },
  { from: "AVALIACAO_CMAA", to: "EM_TRIAGEM", roles: ["CMAA", "ADMIN"] },

  // --- Atalhos Diretos (Fast-paths) para ADMIN ---
  { from: "SUBMETIDA", to: "HOMOLOGADA", roles: ["ADMIN"] },
  { from: "EM_TRIAGEM", to: "HOMOLOGADA", roles: ["ADMIN"] },
  { from: "PARECER_EDUCACAO", to: "HOMOLOGADA", roles: ["ADMIN"] },
  { from: "AVALIACAO_CMAA", to: "HOMOLOGADA", roles: ["ADMIN"] },

  { from: "SUBMETIDA", to: "CANCELADA", roles: ["ADMIN"] },
  { from: "EM_TRIAGEM", to: "CANCELADA", roles: ["ADMIN"] },
  { from: "PARECER_EDUCACAO", to: "CANCELADA", roles: ["ADMIN"] },
  { from: "AVALIACAO_CMAA", to: "CANCELADA", roles: ["ADMIN"] },
  { from: "CLASSIFICADA", to: "CANCELADA", roles: ["ADMIN"] },
];

export function findTransition(
  from: PropostaStatus,
  to: PropostaStatus,
  userRole: Role,
  modalidade?: string
): TransitionRule | null {
  return WORKFLOW_TRANSITIONS.find((t) => {
    if (t.from !== from || t.to !== to) return false;
    if (!t.roles.includes(userRole)) return false;
    if (t.requiresEducacao && modalidade !== "EDUCACAO") return false;
    if (t.from === "EM_TRIAGEM" && t.to === "AVALIACAO_CMAA" && modalidade === "EDUCACAO") return false;
    return true;
  }) || null;
}

export function getAvailableTransitions(
  currentStatus: PropostaStatus,
  userRole: Role,
  modalidade?: string
): TransitionRule[] {
  return WORKFLOW_TRANSITIONS.filter((t) => {
    if (t.from !== currentStatus) return false;
    if (!t.roles.includes(userRole)) return false;
    if (t.requiresEducacao && modalidade !== "EDUCACAO") return false;
    if (t.from === "EM_TRIAGEM" && t.to === "AVALIACAO_CMAA" && modalidade === "EDUCACAO") return false;
    return true;
  });
}
