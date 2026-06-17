import { loadEnvConfig } from "@next/env";
// Carrega as variáveis de ambiente do arquivo .env nativamente usando o Next.js
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const dataNasc = new Date("1999-07-10T00:00:00.000Z"); // 10/07/1999

  const municipe = await prisma.municipe.upsert({
    where: { id: 1 },
    update: {
      cpf: "48092926816",
      nome: "Natan Foleto",
      telefone: "17992424418",
      email: "natanfoleto2015@hotmail.com",
      data_nasc: dataNasc,
      rg: "429423202",
      apagado: null,
    },
    create: {
      id: 1,
      cpf: "48092926816",
      nome: "Natan Foleto",
      telefone: "17992424418",
      email: "natanfoleto2015@hotmail.com",
      data_nasc: dataNasc,
      rg: "429423202",
      apagado: null,
    },
  });

  console.log("👤 Munícipe cadastrado/atualizado com sucesso:", municipe.nome);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao cadastrar munícipe:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
