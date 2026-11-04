/**
 * Seed de DESENVOLVIMENTO: apaga tudo e recria dados fictícios em todos os status,
 * para ver as telas com conteúdo. Só roda contra banco local (localhost/127.0.0.1).
 *
 * Rode com: npm run db:seed-dev
 *
 * Acesso de teste (todos os usuários usam a mesma senha, só neste banco local):
 *   senha: proinova-dev-2026
 *   admin: CPF impresso no fim da execução (perfil ADMIN)
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient, PropostaStatus, MarcoStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const SENHA_TESTE = "proinova-dev-2026";

const url = process.env.DATABASE_URL || "";
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
  console.error("❌ seed-dev recusado: DATABASE_URL não aponta para um banco local.");
  process.exit(1);
}

const prisma = new PrismaClient();

/* CPF válido e determinístico a partir de um número base de 9 dígitos */
function gerarCpf(base: number): string {
  const d = String(base).padStart(9, "0").split("").map(Number);
  const dv = (nums: number[], fator: number) => {
    const soma = nums.reduce((acc, n, i) => acc + n * (fator - i), 0);
    const mod = (soma * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  const d1 = dv(d, 10);
  const d2 = dv([...d, d1], 11);
  return [...d, d1, d2].join("");
}

const html = (...paragrafos: string[]) => paragrafos.map((p) => `<p>${p}</p>`).join("");

const PESOS = [
  { criterio: "Relevância do Problema (0-10)", peso: 2 },
  { criterio: "Impacto da Solução (0-10)", peso: 3 },
  { criterio: "Metodologia e Entregas (0-10)", peso: 2 },
  { criterio: "Viabilidade (0-10)", peso: 2 },
  { criterio: "Indicadores e Custos (0-10)", peso: 1 },
];

function analiseIa(score: number) {
  const categorias = [
    ["🎯", "Viabilidade da Equipe e Técnica"],
    ["⏱️", "Tempo vs. Complexidade"],
    ["⚖️", "Adequação à Lei Municipal"],
    ["🏛️", "Relevância para o Município"],
    ["📊", "Qualidade Técnica"],
    ["💡", "Inovação e Impacto"],
  ];
  return {
    overallScore: score,
    verdict: score >= 7 ? "APROVAÇÃO PROVÁVEL" : score >= 5 ? "COM RESSALVAS" : "NECESSITA REVISÃO",
    fieldHints: { problema: "✅ Problema bem delimitado para a escala de Jaborandi." },
    thoughts: categorias.map(([emoji, category], i) => ({
      emoji,
      category,
      score: Math.max(0, Math.min(10, Math.round((score + (i % 3) - 1) * 10) / 10)),
      comment: "✅ Ponto forte: entregas mensais claras. ⚠️ Melhoria: detalhar os indicadores de cada mês.",
    })),
  };
}

const PESSOAS = [
  { nome: "Coordenação ProInova (teste)", nasc: "1985-04-12", role: "ADMIN" as Role },
  { nome: "Equipe de Triagem (teste)", nasc: "1990-08-03", role: "TRIAGEM" as Role },
  { nome: "Mariana Alves Costa", nasc: "1998-02-20", role: "PROPONENTE" as Role },
  { nome: "Pedro Henrique Souza", nasc: "2001-11-05", role: "PROPONENTE" as Role },
  { nome: "Ana Clara Ribeiro", nasc: "1995-06-17", role: "PROPONENTE" as Role },
  { nome: "Lucas Martins Ferreira", nasc: "1989-09-30", role: "PROPONENTE" as Role },
  { nome: "Beatriz Lima Santos", nasc: "2003-01-14", role: "PROPONENTE" as Role },
];

const MEMBROS_EXTRAS = [
  { nome: "Gabriel Oliveira Rocha", nasc: "2010-05-22" }, // menor
  { nome: "Sofia Pereira Gomes", nasc: "2011-03-09" }, // menor
  { nome: "Rafael Carvalho Dias", nasc: "1997-12-01" },
];

type PropostaSeed = {
  titulo: string;
  status: PropostaStatus;
  dono: number; // índice em PESSOAS
  edital: "edu" | "geral";
  meses: number;
  ia?: number;
  extras?: number[]; // índices em MEMBROS_EXTRAS
  marcos?: MarcoStatus[]; // status dos primeiros meses
};

const PROPOSTAS: PropostaSeed[] = [
  { titulo: "Horta Inteligente na Escola", status: "RASCUNHO", dono: 2, edital: "edu", meses: 6 },
  { titulo: "Mapa Digital das Trilhas Rurais", status: "RASCUNHO", dono: 3, edital: "edu", meses: 4 },
  { titulo: "Agenda Online da Saúde", status: "SUBMETIDA", dono: 4, edital: "edu", meses: 8, ia: 7.8 },
  { titulo: "Robótica Educacional com Sucata", status: "SUBMETIDA", dono: 6, edital: "edu", meses: 6, ia: 6.4, extras: [0] },
  { titulo: "Coleta Seletiva Gamificada", status: "EM_TRIAGEM", dono: 5, edital: "edu", meses: 6, ia: 7.1 },
  { titulo: "Biblioteca Comunitária Digital", status: "PARECER_EDUCACAO", dono: 2, edital: "edu", meses: 10, ia: 8.2, extras: [1] },
  { titulo: "Sensores de Umidade para Pequenos Produtores", status: "AVALIACAO_CMAA", dono: 3, edital: "edu", meses: 12, ia: 8.9 },
  { titulo: "Ônibus Escolar em Tempo Real", status: "CLASSIFICADA", dono: 4, edital: "edu", meses: 6, ia: 7.5 },
  { titulo: "Atas de Reunião com IA Local", status: "HOMOLOGADA", dono: 5, edital: "edu", meses: 6, ia: 8.6, marcos: ["VALIDADO", "VALIDADO", "SUBMETIDO"] },
  { titulo: "Frequência Escolar por QR Code", status: "HOMOLOGADA", dono: 6, edital: "edu", meses: 8, ia: 8.1, extras: [0, 2], marcos: ["VALIDADO", "AJUSTE_SOLICITADO"] },
  { titulo: "Feira do Produtor Online", status: "HOMOLOGADA", dono: 2, edital: "edu", meses: 6, ia: 7.2, marcos: ["SUBMETIDO"] },
  { titulo: "Ouvidoria por WhatsApp", status: "EM_EXECUCAO", dono: 3, edital: "geral", meses: 6, ia: 7.9, marcos: ["VALIDADO", "VALIDADO", "VALIDADO", "SUBMETIDO"] },
  { titulo: "Inventário Patrimonial com Etiquetas", status: "EM_AJUSTE", dono: 4, edital: "edu", meses: 6, ia: 5.8 },
  { titulo: "Aplicativo de Turismo Rural", status: "CANCELADA", dono: 5, edital: "geral", meses: 6, ia: 4.6 },
  { titulo: "Drones para Mapeamento de Estradas", status: "SUSPENSA", dono: 6, edital: "geral", meses: 8, ia: 6.9 },
  { titulo: "Laboratório Maker Itinerante", status: "CONCLUIDA", dono: 2, edital: "geral", meses: 3, ia: 8.4, marcos: ["VALIDADO", "VALIDADO", "VALIDADO"] },
];

const NOTAS = [10, 8.5, 9, 10, 7.5];

async function limpar() {
  await prisma.auditLog.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.termoOutorga.deleteMany();
  await prisma.evidencia.deleteMany();
  await prisma.marcoHistorico.deleteMany();
  await prisma.marco.deleteMany();
  await prisma.equipeMembro.deleteMany();
  await prisma.proposta.deleteMany();
  await prisma.editalConfig.deleteMany();
  await prisma.edital.deleteMany();
  await prisma.user.deleteMany();
  await prisma.municipe.deleteMany();
  await prisma.ideia.deleteMany();
  await prisma.inscricaoLancamento.deleteMany();
}

async function main() {
  await limpar();

  const pepper = process.env.PASSWORD_PEPPER || "";
  const passwordHash = await bcrypt.hash(SENHA_TESTE + pepper, 10);

  // Munícipes e usuários
  const pessoas = PESSOAS.map((p, i) => ({ ...p, cpf: gerarCpf(123456700 + i) }));
  const extras = MEMBROS_EXTRAS.map((p, i) => ({ ...p, cpf: gerarCpf(223456700 + i) }));
  await prisma.municipe.createMany({
    data: [...pessoas, ...extras].map((p, i) => ({
      id: 1000 + i,
      cpf: p.cpf,
      nome: p.nome,
      telefone: `1799${String(1000000 + i * 7919).slice(0, 7)}`,
      data_nasc: new Date(`${p.nasc}T12:00:00Z`),
      rg: String(400000000 + i * 1234),
    })),
  });
  const users = [];
  for (const p of pessoas) {
    users.push(
      await prisma.user.create({
        data: {
          cpf: p.cpf,
          nome: p.nome,
          email: `${p.nome.split(" ")[0].toLowerCase()}.${p.cpf.slice(-4)}@exemplo.test`,
          dataNasc: new Date(`${p.nasc}T12:00:00Z`),
          role: p.role,
          passwordHash,
        },
      })
    );
  }
  const admin = users[0];

  // Editais
  const agora = new Date();
  const dias = (n: number) => new Date(agora.getTime() + n * 86_400_000);
  const editalEdu = await prisma.edital.create({
    data: {
      titulo: "PROINOVA EDUCAÇÃO 01/27 (teste)",
      descricao: "Edital de teste da modalidade Educação para desenvolvimento local.",
      modalidade: "EDUCACAO",
      status: "ABERTO",
      abreEm: dias(-20),
      fechaEm: dias(40),
      config: {
        create: {
          linhasTematicas: ["Educação", "Gestão Pública", "Agro e Meio Ambiente", "Saúde"],
          pesosMatrizJson: PESOS,
          tetoMensal: 1000,
          duracaoMaxMeses: 12,
          ignorarPrazosMarcos: true,
        },
      },
    },
  });
  const editalGeral = await prisma.edital.create({
    data: {
      titulo: "PROINOVA GERAL 02/26 (teste)",
      descricao: "Edital de teste da modalidade Geral, já encerrado.",
      modalidade: "GERAL",
      status: "ENCERRADO",
      abreEm: dias(-200),
      fechaEm: dias(-140),
      config: {
        create: {
          linhasTematicas: ["Gestão Pública", "Turismo", "Infraestrutura"],
          pesosMatrizJson: PESOS,
          tetoMensal: 1000,
          duracaoMaxMeses: 12,
          ignorarPrazosMarcos: true,
        },
      },
    },
  });

  // Propostas
  for (const [idx, s] of PROPOSTAS.entries()) {
    const dono = pessoas[s.dono];
    const user = users[s.dono];
    const edital = s.edital === "edu" ? editalEdu : editalGeral;
    const criadaEm = dias(-60 + idx * 3);
    const membros = [
      { cpf: dono.cpf, nome: dono.nome, nasc: dono.nasc, menor: false },
      ...(s.extras || []).map((i) => ({
        cpf: extras[i].cpf,
        nome: extras[i].nome,
        nasc: extras[i].nasc,
        menor: new Date(extras[i].nasc) > dias(-18 * 365),
      })),
    ];
    const pct = Math.floor(100 / membros.length);

    const proposta = await prisma.proposta.create({
      data: {
        editalId: edital.id,
        proponenteId: user.id,
        titulo: s.titulo,
        resumo: `${s.titulo}: projeto de inovação pública pensado para a realidade de Jaborandi, com entregas mensais verificáveis e benefício direto aos munícipes.`,
        linhaTematica: s.edital === "edu" ? "Educação" : "Gestão Pública",
        modalidade: edital.modalidade,
        duracaoMeses: s.meses,
        problema: html("Hoje o processo é manual e depende de papel, o que gera atrasos e retrabalho.", "Isso afeta principalmente as famílias da zona rural."),
        publicoAlvo: html("Estudantes, famílias e servidores da rede municipal."),
        propostaValor: html("Economia de tempo, transparência e dados para decisão."),
        solucao: html("Uma aplicação web simples, usada no celular, com painel para a Prefeitura."),
        metodologia: html("Ciclos mensais com protótipo, teste com usuários reais e ajuste."),
        viabilidade: html("A equipe usa a infraestrutura do C.TECH e ferramentas gratuitas."),
        riscos: html("Baixa adesão inicial; mitigado com oficinas nas escolas."),
        indicadores: html("Número de usuários ativos e tempo médio de atendimento."),
        orcamentoRateio: html("Bolsa dividida igualmente entre os membros da equipe."),
        paginaPublicaPlano: html("Atualização mensal com fotos, entregas e indicadores."),
        ipConcorda: s.status !== "RASCUNHO",
        cronogramaJson: [],
        aiAnalysisJson: s.ia ? analiseIa(s.ia) : undefined,
        status: s.status,
        createdAt: criadaEm,
        equipe: {
          create: membros.map((m, i) => ({
            cpf: m.cpf,
            nome: m.nome,
            dataNasc: new Date(`${m.nasc}T12:00:00Z`),
            vinculoEstudantil: m.menor ? "Aluno da rede municipal" : null,
            ehMenor: m.menor,
            responsavelLegal: m.menor ? "Responsável Legal (teste)" : null,
            cpfResponsavel: m.menor ? gerarCpf(323456700 + i) : null,
            percentualRateio: i === 0 ? 100 - pct * (membros.length - 1) : pct,
          })),
        },
        marcos: {
          create: Array.from({ length: s.meses }, (_, m) => ({
            mes: m + 1,
            entregavel: `Entrega do mês ${m + 1}: ${m === 0 ? "protótipo navegável" : m === s.meses - 1 ? "versão final e relatório" : "nova funcionalidade testada"}`,
            evidenciaEsperada: "Link do protótipo e fotos do teste com usuários.",
            criterioAceitacao: "Funcionalidade disponível e validada por pelo menos 5 usuários.",
            status: s.marcos?.[m] ?? "PENDENTE",
            nota: s.marcos?.[m] === "VALIDADO" ? NOTAS[m % NOTAS.length] : 10,
            validadoEm: s.marcos?.[m] === "VALIDADO" ? dias(-30 + m * 7) : null,
            comentarioCoordenacao: s.marcos?.[m] === "AJUSTE_SOLICITADO" ? "Faltou o link do protótipo publicado." : null,
          })),
        },
      },
      include: { marcos: true },
    });

    // Evidências e histórico dos marcos já enviados
    for (const marco of proposta.marcos.filter((m) => m.status !== "PENDENTE")) {
      await prisma.evidencia.create({
        data: { marcoId: marco.id, tipo: "LINK", url: "https://exemplo.test/prototipo", descricao: `Protótipo do mês ${marco.mes} publicado e testado.` },
      });
      await prisma.marcoHistorico.create({
        data: { marcoId: marco.id, autorId: user.id, autorNome: user.nome, acao: "SUBMISSAO", statusAnterior: "PENDENTE", statusNovo: "SUBMETIDO", comentario: "Evidência de entrega enviada." },
      });
      if (marco.status !== "SUBMETIDO") {
        await prisma.marcoHistorico.create({
          data: {
            marcoId: marco.id,
            autorId: admin.id,
            autorNome: "Coordenação",
            acao: marco.status === "VALIDADO" ? "VALIDACAO" : "SOLICITACAO_AJUSTE",
            statusAnterior: "SUBMETIDO",
            statusNovo: marco.status,
            nota: marco.status === "VALIDADO" ? marco.nota : null,
            comentario: marco.comentarioCoordenacao,
          },
        });
      }
    }

    // Pareceres e trilha de auditoria das etapas já percorridas
    if (!["RASCUNHO", "SUBMETIDA"].includes(s.status)) {
      await prisma.avaliacao.create({
        data: { propostaId: proposta.id, avaliadorId: admin.id, etapa: "TRIAGEM", parecer: "Proposta admissível. Atende aos Arts. 5º e 6º da Lei.", notaJson: [], aprovado: true, decididoEm: dias(-20) },
      });
      await prisma.auditLog.create({
        data: { userId: admin.id, action: `WORKFLOW_${s.status}`, entityType: "Proposta", entityId: proposta.id, beforeJson: { status: "SUBMETIDA" }, afterJson: { status: s.status } },
      });
    }
    if (s.status === "EM_EXECUCAO") {
      await prisma.termoOutorga.create({ data: { propostaId: proposta.id, dadosJson: {}, assinado: true, assinadoEm: dias(-40) } });
    }
  }

  // Ideias e inscrições do lançamento
  const ideias = [
    "Wi-Fi gratuito na praça central",
    "Aplicativo para agendar castração de animais",
    "Painel com o horário dos ônibus na rodoviária",
    "Banco de sementes crioulas digital",
    "Mutirão online de reparos em escolas",
    "Calendário único de eventos da cidade",
  ];
  await prisma.ideia.createMany({
    data: ideias.map((titulo, i) => ({
      cpf: pessoas[2 + (i % 5)].cpf,
      nomeAutor: pessoas[2 + (i % 5)].nome,
      titulo,
      descricao: `${titulo}: ideia enviada por um munícipe para inspirar projetos do ProInova.`,
      createdAt: dias(-i * 4),
    })),
  });
  await prisma.inscricaoLancamento.createMany({
    data: [...pessoas.slice(2), ...extras].map((p, i) => ({
      cpf: p.cpf,
      nome: p.nome,
      idade: agora.getFullYear() - new Date(p.nasc).getFullYear(),
      createdAt: dias(-230 + i),
    })),
  });

  console.log("🌱 Seed de desenvolvimento concluído.");
  console.log(`   Propostas: ${PROPOSTAS.length} | Editais: 2 | Ideias: ${ideias.length}`);
  console.log(`   Admin (ADMIN): CPF ${pessoas[0].cpf}`);
  console.log(`   Proponente: CPF ${pessoas[2].cpf}`);
  console.log("   Senha de todos: a constante SENHA_TESTE deste arquivo.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed de desenvolvimento:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
