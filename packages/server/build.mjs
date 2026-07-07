import { build } from "esbuild";

// Bundles server + its workspace-local deps (db/shared/plugin-claude-code,
// whose "main" points straight at TS source) into one file so the packaged
// desktop app doesn't need tsx/TypeScript at runtime. True npm dependencies
// stay external and resolve from a plain node_modules shipped alongside —
// @prisma/client in particular is not meant to be bundled (it loads its
// query engine binary from a computed node_modules path at runtime).
await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "dist/index.mjs",
  logLevel: "info",
  external: ["@prisma/client", "fastify", "@fastify/cors", "@fastify/websocket"],
});
