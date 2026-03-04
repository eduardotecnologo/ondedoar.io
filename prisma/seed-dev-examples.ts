/**
 * Script de dados de exemplo para desenvolvimento local.
 * NÃO executar em produção.
 *
 * Uso: npx tsx prisma/seed-dev-examples.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Busca as categorias necessárias
  const catTransporte = await prisma.tipoDoacao.findFirst({
    where: { nome: { equals: "TRANSPORTE", mode: "insensitive" } },
  });
  const catHigiene = await prisma.tipoDoacao.findFirst({
    where: { nome: { equals: "HIGIENE/LIMPEZA", mode: "insensitive" } },
  });

  if (!catTransporte) {
    console.error(
      "❌ Categoria TRANSPORTE não encontrada. Rode o seed primeiro: npx prisma db seed",
    );
    process.exit(1);
  }
  if (!catHigiene) {
    console.error(
      "❌ Categoria HIGIENE/LIMPEZA não encontrada. Rode o seed primeiro: npx prisma db seed",
    );
    process.exit(1);
  }

  // ──────────────────────────────────────────────────────────────
  // Ponto de exemplo: TRANSPORTE
  // ──────────────────────────────────────────────────────────────
  const pontoTransporte = await prisma.pontoColeta.upsert({
    where: {
      // upsert pelo nome único de teste
      id: "00000000-0000-0000-0000-000000000001",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      nome: "[TESTE] Veículo disponível – João Silva",
      descricao:
        "Carro disponível para transporte de doações e desabrigados na região central.",
      endereco: "Av. Ipiranga",
      numero: "100",
      cidade: "Porto Alegre",
      estado: "RS",
      cep: "90160-093",
      telefone: "(51) 99999-0001",
      whatsapp: "(51) 99999-0001",
      status_doacao: "ATIVO",
      latitude: -30.0346,
      longitude: -51.2177,
      ponto_categorias: {
        create: [{ categoria_id: catTransporte.id }],
      },
    },
    update: {
      nome: "[TESTE] Veículo disponível – João Silva",
      descricao:
        "Carro disponível para transporte de doações e desabrigados na região central.",
      status_doacao: "ATIVO",
    },
  });

  // Salva campos extras de transporte via raw SQL (colunas fora do schema Prisma)
  await prisma.$executeRaw`
    UPDATE pontos_coleta
    SET transporte_tipo_veiculo = 'PEQUENO',
        transporte_disponivel_em = ${new Date("2026-03-05T09:00:00-03:00")}
    WHERE id = ${pontoTransporte.id}::uuid
  `;

  console.log(
    `✅ Ponto TRANSPORTE criado: ${pontoTransporte.nome} (${pontoTransporte.id})`,
  );

  // ──────────────────────────────────────────────────────────────
  // Ponto de exemplo: HIGIENE/LIMPEZA
  // ──────────────────────────────────────────────────────────────
  const pontoHigiene = await prisma.pontoColeta.upsert({
    where: {
      id: "00000000-0000-0000-0000-000000000002",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      nome: "[TESTE] Ponto de Higiene – Igreja São Paulo",
      descricao:
        "Aceita sabonetes, shampoo, papel higiênico, desinfetante e materiais de limpeza em geral.",
      endereco: "Rua da Consolação",
      numero: "250",
      cidade: "Porto Alegre",
      estado: "RS",
      cep: "90050-002",
      telefone: "(51) 99999-0002",
      whatsapp: "(51) 99999-0002",
      status_doacao: "RECEBENDO",
      latitude: -30.032,
      longitude: -51.2178,
      ponto_categorias: {
        create: [{ categoria_id: catHigiene.id }],
      },
    },
    update: {
      nome: "[TESTE] Ponto de Higiene – Igreja São Paulo",
      descricao:
        "Aceita sabonetes, shampoo, papel higiênico, desinfetante e materiais de limpeza em geral.",
      status_doacao: "RECEBENDO",
    },
  });

  console.log(
    `✅ Ponto HIGIENE/LIMPEZA criado: ${pontoHigiene.nome} (${pontoHigiene.id})`,
  );
  console.log("\n📍 Abra http://localhost:3000 para ver os pontos no mapa.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
