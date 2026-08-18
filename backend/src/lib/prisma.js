import "dotenv/config";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

const pool = globalForPrisma.pgPool || new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // max connections in pool
  min: 2,                     // keep 2 connections warm
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 5000, // timeout if no connection available in 5s
  allowExitOnIdle: false,
});

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
