#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "src", "lib");
async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return /\.(?:ts|tsx|js|mjs)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [fullPath] : [];
  }));
  return nested.flat();
}

/**
 * Heuristic inventory only: direct Supabase .from(...).<mutator>(...) candidates
 * and RPC calls. It deliberately does not infer authorization or audit coverage.
 */
export function inspectMutationCandidates(source, file = "<memory>") {
  const directDml = [];
  const rpcCalls = [];
  const chainPattern = /\.from\(\s*["'`]([^"'`]+)["'`]\s*\)([^;]{0,600})/g;
  for (const match of source.matchAll(chainPattern)) {
    const operationMatch = match[2].match(/\.\s*(insert|update|upsert|delete)\s*\(/i);
    if (!operationMatch) continue;
    const offset = match.index ?? 0;
    directDml.push({
      file,
      line: source.slice(0, offset).split("\n").length,
      table: match[1],
      operation: operationMatch[1].toLowerCase(),
    });
  }

  const rpcPattern = /\.rpc\(\s*["'`]([^"'`]+)["'`]/g;
  for (const match of source.matchAll(rpcPattern)) {
    const offset = match.index ?? 0;
    rpcCalls.push({
      file,
      line: source.slice(0, offset).split("\n").length,
      function: match[1],
    });
  }
  return { directDml, rpcCalls };
}

export async function buildAdminMutationInventory(root = SOURCE_ROOT) {
  const files = (await collectFiles(root)).sort();
  const directDml = [];
  const rpcCalls = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(ROOT, file).split(path.sep).join("/");
    const result = inspectMutationCandidates(source, relative);
    directDml.push(...result.directDml);
    rpcCalls.push(...result.rpcCalls);
  }
  return {
    generatedAt: new Date().toISOString(),
    scope: "src/lib/**/*.{ts,tsx,js,mjs} excluding test files",
    limitations: [
      "Static heuristic, not an AST or runtime proof.",
      "Does not infer whether a mutation is administrative, authorized, audited, or reachable.",
      "Does not resolve indirect helpers, dynamic table names, SQL inside migrations, triggers, RLS, or grants.",
      "Every candidate requires manual review against server functions, migrations, database grants, and tests.",
    ],
    summary: {
      filesScanned: files.length,
      directDmlCandidates: directDml.length,
      rpcCallSites: rpcCalls.length,
    },
    directDml,
    rpcCalls,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const inventory = await buildAdminMutationInventory();
    process.stdout.write(JSON.stringify(inventory, null, 2) + "\n");
  } catch (error) {
    process.stderr.write(`Administrative mutation inventory failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
