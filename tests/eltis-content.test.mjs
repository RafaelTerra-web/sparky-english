import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bank = readFileSync(new URL("../src/lib/eltis-bank.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../src/app/api/mock-tests/eltis/route.ts", import.meta.url), "utf8");

test("ELTiS practice contains 24 unique authored items with balanced sections", () => {
  const ids = [...bank.matchAll(/(?:listen|read)\("(el-[lr]\d{2})"/g)].map((match) => match[1]);
  assert.equal(ids.length, 24);
  assert.equal(new Set(ids).size, 24);
  assert.equal(ids.filter((id) => id.startsWith("el-l")).length, 12);
  assert.equal(ids.filter((id) => id.startsWith("el-r")).length, 12);
  assert.match(bank, /import "server-only"/);
});

test("public ELTiS item projection omits protected assessment fields", () => {
  const projection = bank.slice(bank.indexOf("export const publicEltisItem"));
  assert.doesNotMatch(projection, /answer:\s*item\.answer/);
  assert.doesNotMatch(projection, /explanation:\s*item\.explanation/);
  assert.doesNotMatch(projection, /transcript:\s*item\.transcript/);
  assert.match(route, /seal\(/);
  assert.match(route, /mock:eltis:/);
});
