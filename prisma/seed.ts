import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tipos: { nome: string; icone: string }[] = [
    { nome: "ROUPAS", icone: "👕" },
    { nome: "ALIMENTOS", icone: "🍎" },
    { nome: "DOCUMENTOS", icone: "📄" },
    { nome: "COLCHOES", icone: "🛏️" },
    { nome: "REMEDIOS", icone: "💊" },
    { nome: "MOVEIS", icone: "🪑" },
    { nome: "ABRIGO ANIMAIS", icone: "🐶🐱" },
    { nome: "ABRIGO", icone: "🏠" },
    { nome: "VOLUNTARIO", icone: "🤝" },
    { nome: "FRAUDAS", icone: "👶" },
    { nome: "AGUA", icone: "💧" },
  ];

  for (const tipo of tipos) {
    await prisma.tipoDoacao.upsert({
      where: { nome: tipo.nome },
      update: { icone: tipo.icone },
      create: { nome: tipo.nome, icone: tipo.icone },
    });
  }

  console.log(
    "✅ Tipos de doação criados:",
    tipos.map((t) => t.nome),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
