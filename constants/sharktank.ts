/**
 * SharkTank Jaborandi — configuração do evento.
 * Tudo que a organização pode precisar ajustar fica aqui (datas, vagas, textos).
 */

export const EVENTO = {
  nome: "SharkTank Jaborandi",
  /** 28/11/2026 (sábado), 9h no horário de Brasília */
  inicioISO: "2026-11-28T09:00:00-03:00",
  /** Horário estimado de término (usado no convite de calendário) */
  fimISO: "2026-11-28T12:00:00-03:00",
  dataExtenso: "Sábado, 28 de novembro de 2026",
  dataCurta: "28.11",
  hora: "9h",
  local: "C.TECH",
  localNome: "C.TECH — Centro Tecnológico de Jaborandi",
  endereco: "R. Inácio Máximo Diniz Junqueira, 527",
  cidade: "Jaborandi/SP",
  cep: "14775-015",
  enderecoCompleto: "R. Inácio Máximo Diniz Junqueira, 527 — Jaborandi/SP, 14775-015",
  descricaoCalendario:
    "SharkTank Jaborandi: startups do ProInova e empresas da região apresentam suas ideias ao vivo para prefeitos e lideranças da região. Chegue com antecedência!",
};

/** Lugares no auditório para visitantes. Depois disso, as inscrições entram em lista de espera. */
export const CAPACIDADE_VISITANTES = 200;

/** Vagas de pitch para empresas/startups de fora do ProInova (cadastradas pelo site). */
export const VAGAS_PITCH_EXTRAS = 10;

/** Prazo para empresas se inscreverem para o pitch. */
export const PRAZO_EMPRESAS_ISO = "2026-11-25T23:59:59-03:00";
export const PRAZO_EMPRESAS_TEXTO = "25/11";

/** O contador público de inscritos só aparece a partir deste número (prova social real, sem inflar). */
export const MOSTRAR_INSCRITOS_A_PARTIR_DE = 15;

/** Convidados mostrados enquanto a organização não cadastrar os VIPs no admin. */
export const VIPS_PADRAO = [
  { nome: "Silvio Vaz", cargo: "Prefeito", cidade: "Jaborandi" },
  { nome: "Rafael", cargo: "Coordenador Regional", cidade: "Sebrae-SP" },
  { nome: "Rafael Furlini", cargo: "Prefeito", cidade: "Terra Roxa" },
];

export const CATEGORIAS = [
  "Educação",
  "Governo Digital",
  "Inteligência Artificial",
  "Economia Local",
  "Turismo",
  "Sustentabilidade",
  "Comunicação",
  "Saúde",
  "Agro",
  "Cidade Inteligente",
  "Outro",
] as const;

export const ESTAGIOS = ["Ideia", "Protótipo", "Já funciona", "Já vende"] as const;

/** Paleta de cada categoria (usada na arte de capa gerada e nas tags). */
export const CATEGORIA_COR: Record<string, [string, string]> = {
  "Educação": ["#22d3ee", "#6366f1"],
  "Governo Digital": ["#38bdf8", "#0ea5e9"],
  "Inteligência Artificial": ["#a78bfa", "#ec4899"],
  "Economia Local": ["#fbbf24", "#f97316"],
  "Turismo": ["#34d399", "#06b6d4"],
  "Sustentabilidade": ["#4ade80", "#14b8a6"],
  "Comunicação": ["#f472b6", "#f59e0b"],
  "Saúde": ["#fb7185", "#f43f5e"],
  "Agro": ["#a3e635", "#22c55e"],
  "Cidade Inteligente": ["#60a5fa", "#22d3ee"],
  "Outro": ["#94a3b8", "#38bdf8"],
};

/**
 * Curadoria da vitrine dos projetos do ProInova (por id da proposta).
 * Projetos aprovados que não estiverem aqui aparecem com nome e frase gerados do próprio cadastro.
 */
export const CURADORIA_PROINOVA: Record<string, { nome?: string; pitch: string; categoria: string }> = {
  cmmov8xf9000413mo1sjjs65s: {
    pitch: "O super app que coloca a prefeitura inteira no bolso do cidadão.",
    categoria: "Cidade Inteligente",
  },
  cmmxp8pjp0005ivj8rtmiru79: {
    pitch: "Inteligência artificial que traz grandes personagens da história para conversar com os alunos.",
    categoria: "Inteligência Artificial",
  },
  cmmz1zjzu00agivj89dw2j2jt: {
    pitch: "Um game que ensina as crianças a separar o lixo do jeito certo — jogando.",
    categoria: "Sustentabilidade",
  },
  cmmz8ah9p00hvivj8qmnntb3p: {
    pitch: "Comunicação interativa para cada aviso da prefeitura chegar em quem precisa.",
    categoria: "Governo Digital",
  },
  cmn1qdsa000v9ivj8am5i38bq: {
    nome: "Pedi Jaborandi",
    pitch: "Delivery da cidade sem taxa: do comércio local direto para o WhatsApp.",
    categoria: "Economia Local",
  },
  cmn7yxdk50051r1z6oh5719l9: {
    nome: "Jabô Turismo Digital",
    pitch: "O guia turístico oficial que coloca Jaborandi no mapa — na palma da mão.",
    categoria: "Turismo",
  },
  cmnamknvd00g6r1z61e8nhcjd: {
    pitch: "Jornal hiperlocal feito por alunos: a vacina de Jaborandi contra as fake news.",
    categoria: "Comunicação",
  },
  cmndpd9bk00jvr1z6f6ip4oif: {
    nome: "Frota Preventiva",
    pitch: "Manutenção preventiva por km para os 97 veículos da prefeitura: menos oficina, mais economia.",
    categoria: "Governo Digital",
  },
  cmnhwvzip001osirne4ybhpjl: {
    pitch: "Um banco virtual dentro da escola: educação financeira na prática, com moeda própria.",
    categoria: "Educação",
  },
  cmnhwxqkt0026sirnxvhtgdu0: {
    nome: "Vozes da Comunidade",
    pitch: "Estúdio de podcast na escola: alunos produzindo informação de utilidade pública.",
    categoria: "Comunicação",
  },
  cmnzh0j5c000120dw3aq0lqws: {
    pitch: "Um \"Jarvis\" gratuito que prepara os estudantes de Jaborandi para o ENEM.",
    categoria: "Inteligência Artificial",
  },
  cmvr2c7yv00f912bxwgs4st7u: {
    pitch: "A família sabe da falta no mesmo dia: evasão escolar combatida na primeira semana.",
    categoria: "Educação",
  },
  cmvr2s12b00gr12bxnemgiz6v: {
    nome: "Relatoria",
    pitch: "Ata de reunião pronta em minutos, com IA — e sem o áudio sair da prefeitura.",
    categoria: "Governo Digital",
  },
  cmvr3dnk700j412bxab90534o: {
    pitch: "Marketplace que leva o mel, os doces e o artesanato da região para o Brasil inteiro.",
    categoria: "Economia Local",
  },
};
