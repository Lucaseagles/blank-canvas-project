import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = readFileSync(
  new URL("../../docs/finance/sprint-281-migration-release-manifest.md", import.meta.url),
  "utf8",
);

const entries = [
  ["20261118010100", "9112cde0f23e9533d8474c0f5e0d078ee74efa8b", "cb6f075d01f2678cb26cdaf6108917e0f6981b2e"],
  ["20261118020100", "55424355ac076f6000698b51f44fe428ef06cec2", "cb6f075d01f2678cb26cdaf6108917e0f6981b2e"],
  ["20261118020200", "9889eb959a671934cdb388f0607b8bae506abea8", "cb6f075d01f2678cb26cdaf6108917e0f6981b2e"],
  ["20261118030000", "b2507e2edf8b17b72147b9a451b165f3a0d270cf", "93bd26463a1e8a79ac156f76145bd60ef2946833"],
  ["20261118040000", "dd8638420715077f669399a7ca1a342b61198f87", "fcf46c5074e838910c6db522c16f81e7e620093d"],
  ["20261118050000", "c6ea039aa22b23cbaaf374c1a47747af2861c49c", "f79c30deb268abc694d5b338183166797b934646"],
  ["20261118060000", "600e721561cd3f39491590da195edf450b8cc469", "3fee1f3b97c1ac2eb5fa699ab6f0956705d32ebf"],
  ["20261118070000", "14047ffe201a74e4b86ac0dfdab24a549327866b", "0173129599a6037b914270e5b07dda26f17b9179"],
  ["20261119000100", "726be6dd94eb84ece7ba4065bc8fd7159beee94d", "98d9c2bb4b9644615f273f16cb9025502c667d51"],
];

test("release manifest pins all nine recent migration identities and source commits", () => {
  for (const [version, blob, commit] of entries) {
    assert.ok(manifest.includes(version), `missing version ${version}`);
    assert.ok(manifest.includes(blob), `missing Git blob identity for ${version}`);
    assert.ok(manifest.includes(commit), `missing source commit for ${version}`);
  }
});

test("release manifest never equates missing version prefixes with pending migrations", () => {
  assert.match(manifest, /não prova que o DDL não foi aplicado sob outra versão/);
  assert.match(manifest, /Um prefixo ausente não prova que o DDL não foi aplicado sob outra versão/i);
  assert.doesNotMatch(manifest, /189 migrations pendentes/i);
  assert.match(manifest, /Inconclusiva/);
  assert.match(manifest, /Bloqueada/);
});

test("production release remains explicitly gated behind disposable rehearsal and approval", () => {
  assert.match(manifest, /banco descartável/);
  assert.match(manifest, /autorização explícita do responsável/);
  assert.match(manifest, /Não executar `db push`, `migration repair`, SQL manual ou replay em produção/);
  assert.match(manifest, /Git blob SHA-1/);
  assert.match(manifest, /SHA-256 do conteúdo deve ser calculado/);
});
