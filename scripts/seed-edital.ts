import { loadEnvConfig } from "@next/env";
// Carrega as variáveis de ambiente do arquivo .env nativamente usando o Next.js
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const abreEm = new Date(now.getTime() - 1000 * 60 * 60); // Aberto 1 hora atrás
  const fechaEm = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30); // Vence em 30 dias

  // Deleta editais de teste anteriores para evitar duplicidade em execuções repetidas
  await prisma.edital.deleteMany({
    where: {
      titulo: {
        in: ["Edital ProInova (Seed)", "Edital ProInova (Seed TS)"],
      },
    },
  });

  const edital = await prisma.edital.create({
    data: {
      titulo: "Edital ProInova (Seed TS)",
      descricao: "Edital de teste em TypeScript para desenvolvimento da plataforma.",
      modalidade: "GERAL",
      status: "ABERTO",
      abreEm,
      fechaEm,
    },
  });

  console.log("🌱 Edital criado com sucesso via TS seed:", edital.id);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao rodar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
