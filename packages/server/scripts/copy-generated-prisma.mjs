// `pnpm deploy` builds its output node_modules purely from the lockfile's
// dependency graph, but `.prisma/client` (the schema-specific generated
// client + query engine) is produced by a separate `prisma generate` step
// and isn't a real npm dependency — so it never gets copied. Without it,
// @prisma/client's default.js fails at runtime with
// "Cannot find module '.prisma/client/default'". This locates the real
// generated output next to wherever @prisma/client actually resolves from
// (inside pnpm's content-addressable store) and copies it into the deploy
// output so the packaged app can find it.
import { createRequire } from "node:module";
import { existsSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

const prismaClientEntry = require.resolve("@prisma/client");
// .../node_modules/@prisma/client/default.js -> .../node_modules (@prisma is a scope, so up 3)
const nodeModulesDir = dirname(dirname(dirname(prismaClientEntry)));
const generatedClientDir = join(nodeModulesDir, ".prisma", "client");

if (!existsSync(generatedClientDir)) {
  throw new Error(
    `Could not find generated Prisma client at ${generatedClientDir}. Run "pnpm db:generate" first.`,
  );
}

const deployTarget = join("deploy", "node_modules", ".prisma", "client");
cpSync(generatedClientDir, deployTarget, { recursive: true });
console.log(`Copied generated Prisma client to ${deployTarget}`);
