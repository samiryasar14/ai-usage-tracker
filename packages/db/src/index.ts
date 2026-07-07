// @prisma/client is a CommonJS package. Named imports from it (`import {
// PrismaClient} from "@prisma/client"`) rely on Node's static CJS/ESM interop
// analysis to detect exports, which is inconsistent across Node versions —
// it works under a recent system Node but throws `SyntaxError: Named export
// 'PrismaClient' not found` under the older Node bundled with Electron 33.
// The default-import-then-destructure form works everywhere since it reads
// the real module.exports object at runtime instead of relying on static
// analysis.
import PrismaPkg from "@prisma/client";

const { PrismaClient, Prisma } = PrismaPkg;
export { Prisma };
export type * from "@prisma/client";

let client: InstanceType<typeof PrismaClient> | undefined;

export function getDb(): InstanceType<typeof PrismaClient> {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}
