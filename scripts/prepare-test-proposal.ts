import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Encontrar o usuário Natan Foleto pelo CPF
  const user = await prisma.user.findUnique({
    where: { cpf: "48092926816" },
  });

  if (!user) {
    console.error("❌ Usuário Natan Foleto (CPF: 48092926816) não encontrado.");
    console.log("Por favor, cadastre-se na plataforma primeiro antes de rodar este script.");
    process.exit(1);
  }

  // 2. Encontrar o primeiro edital disponível
  const edital = await prisma.edital.findFirst();
  if (!edital) {
    console.error("❌ Nenhum edital encontrado no banco de dados. Por favor, rode 'npm run db:seed' primeiro.");
    process.exit(1);
  }

  // 3. Limpar propostas antigas de teste do Natan para evitar acúmulo
  await prisma.proposta.deleteMany({
    where: {
      proponenteId: user.id,
      titulo: "Projeto Piloto ProInova - Natan Foleto",
    },
  });

  // 4. Criar uma nova proposta em execução com marcos (milestones)
  const proposta = await prisma.proposta.create({
    data: {
      titulo: "Projeto Piloto ProInova - Natan Foleto",
      resumo: "Este projeto de teste foi gerado automaticamente para validar o fluxo de Marcos e Evidências.",
      linhaTematica: "Tecnologia e Inovação",
      modalidade: "GERAL",
      duracaoMeses: 3,
      problema: "<p>Problema a ser resolvido pelo projeto piloto.</p>",
      publicoAlvo: "<p>Público-alvo beneficiado.</p>",
      propostaValor: "<p>Diferenciais da solução.</p>",
      solucao: "<p>Escopo da solução proposta.</p>",
      metodologia: "<p>Metodologia detalhada de execução.</p>",
      viabilidade: "<p>Viabilidade de implantação técnica e econômica.</p>",
      riscos: "<p>Matriz de riscos identificados.</p>",
      indicadores: "<p>Indicadores de impacto e monitoramento.</p>",
      orcamentoRateio: "<p>Rateio detalhado de bolsas e insumos.</p>",
      paginaPublicaPlano: "<p>Plano de publicação de resultados na transparência.</p>",
      cronogramaJson: [],
      ipConcorda: true,
      status: "EM_EXECUCAO",
      editalId: edital.id,
      proponenteId: user.id,
      
      // Criação dos marcos mensais
      marcos: {
        create: [
          {
            mes: 1,
            entregavel: "Estruturação inicial da plataforma e setup de ambientes.",
            evidenciaEsperada: "Link do repositório Git público ou telas da arquitetura.",
            criterioAceitacao: "O repositório deve conter o código inicial funcional.",
            status: "PENDENTE",
          },
          {
            mes: 2,
            entregavel: "Desenvolvimento do módulo de gerenciamento de dados.",
            evidenciaEsperada: "Link de demonstração do front-end funcional.",
            criterioAceitacao: "Permitir inserção e listagem de dados corretos.",
            status: "PENDENTE",
          },
          {
            mes: 3,
            entregavel: "Implantação de APIs de auditoria e segurança.",
            evidenciaEsperada: "Relatório técnico em PDF e homologação no servidor.",
            criterioAceitacao: "Os logs de auditoria devem rastrear alterações em tempo real.",
            status: "PENDENTE",
          },
        ],
      },
      
      // Cria o proponente na equipe com 100% de rateio
      equipe: {
        create: [
          {
            cpf: user.cpf,
            nome: user.nome,
            dataNasc: user.dataNasc,
            percentualRateio: 100,
            ehMenor: false,
          },
        ],
      },
    },
  });

  console.log("🚀 Proposta de Teste criada com sucesso para o Natan Foleto!");
  console.log("---------------------------------------------------------");
  console.log("ID da Proposta:", proposta.id);
  console.log("Status:", proposta.status);
  console.log("CPF do Proponente:", user.cpf);
  console.log("---------------------------------------------------------");
  console.log("Agora você pode acessar http://localhost:3000/painel e verá o botão '🚀 Marcos e Evidências' no card do projeto!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao preparar proposta de teste:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
