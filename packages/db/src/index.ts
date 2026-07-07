import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

let client: PrismaClient | undefined;

export function getDb(): PrismaClient {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}
