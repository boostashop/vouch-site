import { PrismaClient } from "@prisma/client"

// Single Prisma client shared by the bot process (separate from the Next.js app).
export const prisma = new PrismaClient()
