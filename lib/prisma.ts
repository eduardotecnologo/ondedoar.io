import { PrismaClient } from '@prisma/client'

// Impede que o TypeScript reclame da propriedade global
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Se já existir uma instância global, usa ela. Se não, cria uma nova.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma