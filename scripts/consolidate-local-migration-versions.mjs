import { readdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const directory = path.resolve("supabase/migrations");
const known = {
  "20260902000002": [
    "20260902000002_sprint34_secure_hub_platforms.sql",
    "20260902000002_sprint34_secure_hub_platform_registry.sql",
  ],
  "20260903000000": [
    "20260903000000_sprint36_worker_truthfulness.sql",
    "20260903000000_sprint37_categories_filters.sql",
  ],
  "20260911000000": [
    "20260911000000_sprint31_strategy_orchestrator.sql",
    "20260911000000_sprint40_opportunity_engine.sql",
  ],
  "20261114060000": [
    "20261114060000_rubi_creator_fit_review.sql",
    "20261114060000_rubi_partner_manual_reconciliation_evidence.sql",
  ],
  "20261114070000": [
    "20261114070000_rubi_b2b_tier_integrity.sql",
    "20261114070000_rubi_product_inline_atomic_audit.sql",
  ],
  "20261114080000": [
    "20261114080000_rubi_bulk_product_status_atomic.sql",
    "20261114080000_rubi_onboarding_quiz_atomic.sql",
  ],
  "20261114090000": [
    "20261114090000_rubi_movement_controlled_ab.sql",
    "20261114090000_rubi_scheduled_post_decision_atomic.sql",
  ],
};

const files = (await readdir(directory)).filter((name) => /^\d{14}_.+\.sql$/.test(name));
const groups = new Map();
for (const name of files) {
  const version = name.slice(0, 14);
  const group = groups.get(version) ?? [];
  group.push(name);
  groups.set(version, group);
}
for (const [version, group] of groups) {
  if (group.length < 2) continue;
  const expected = known[version];
  if (!expected || [...group].sort().join("\n") !== [...expected].sort().join("\n")) {
    throw new Error(`Unreviewed duplicate migration version ${version}: ${group.join(", ")}`);
  }
  const ordered = expected.filter((name) => group.includes(name));
  const mergedName = `${version}_local_consolidated.sql`;
  const sections = [];
  for (const name of ordered) {
    sections.push(`-- BEGIN original migration: ${name}\n${await readFile(path.join(directory, name), "utf8")}\n-- END original migration: ${name}`);
  }
  await writeFile(path.join(directory, mergedName), sections.join("\n\n"), "utf8");
  for (const name of group) await unlink(path.join(directory, name));
  process.stdout.write(`Consolidated ${version}: ${ordered.join(" -> ")}\n`);
}
