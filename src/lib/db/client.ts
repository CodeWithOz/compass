import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create connection pool with settings optimized for local dev
const pool = globalForPrisma.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Small pool for local dev
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

globalForPrisma.prisma = prisma
globalForPrisma.pool = pool
