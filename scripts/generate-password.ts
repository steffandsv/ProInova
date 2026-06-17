import bcrypt from "bcryptjs";

async function main() {
  const password = "";
  const pepper = "mabus_proinova_pepper_28394";

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password + pepper, salt);

  console.log("🔐 Hash gerado com sucesso para a senha 'Natan@550':");
  console.log(hash);
}

main().catch((e) => {
  console.error("❌ Erro ao gerar hash:", e);
  process.exit(1);
});
