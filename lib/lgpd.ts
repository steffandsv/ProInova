/**
 * LGPD utilities: redaction of sensitive data for public views.
 */

type PublicMembro = {
  nome: string;
  ehMenor: boolean;
  vinculoEstudantil?: string | null;
};

/**
 * Redact minor's data for public display (Art. 19 V).
 * Shows only initials + "Menor de idade" label.
 */
export function redactMinorData(membro: PublicMembro): PublicMembro {
  if (!membro.ehMenor) return membro;
  const initials = membro.nome
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + ".")
    .join(" ");
  return {
    ...membro,
    nome: initials + " (menor de idade)",
    vinculoEstudantil: membro.vinculoEstudantil ? "Estudante" : null,
  };
}

/**
 * Sanitize a proposta object for public view (Art. 19, parágrafo único).
 * Removes internal fields and sensitive data.
 */
export function sanitizeForPublic<T extends Record<string, unknown>>(
  data: T,
  sigiloso: boolean
): Partial<T> {
  // Always remove these fields from public views
  const alwaysRemove = [
    "passwordHash", "cpf", "cpfResponsavel", "ip",
    "cronogramaJson", "beforeJson", "afterJson",
  ];

  // Additional fields to remove when project is in stealth mode
  const stealthRemove = [
    "solucao", "metodologia", "viabilidade",
  ];

  const keysToRemove = new Set([
    ...alwaysRemove,
    ...(sigiloso ? stealthRemove : []),
  ]);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!keysToRemove.has(key)) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
