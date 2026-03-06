/**
 * Seed simples: cria 1 edital ABERTO para testar envio de propostas.
 * Rode com: node scripts/seed-edital.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const now = new Date();
  const abreEm = new Date(now.getTime() - 1000 * 60 * 60);
  const fechaEm = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

  const edital = await prisma.edital.create({
    data: {
      titulo: "Edital ProInova (Seed)",
      descricao: "Edital de teste para desenvolvimento da plataforma.",
      modalidade: "GERAL",
      status: "ABERTO",
      abreEm,
      fechaEm,
    },
  });

  console.log("Edital criado:", edital.id);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
