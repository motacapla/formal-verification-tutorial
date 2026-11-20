import { test, after } from "node:test";
import assert from "node:assert/strict";
import { Oracle } from "./oracle.ts";

const oracle = new Oracle();
after(() => oracle.close());

test("sum を Lean で計算できる", async () => {
  assert.deepEqual(await oracle.query({ fn: "sum", args: [10] }), { ok: 55 });
});
test("sort を Lean で計算できる", async () => {
  assert.deepEqual(await oracle.query({ fn: "sort", args: [[3, -1, 2]] }), { ok: [-1, 2, 3] });
});
test("midNaive の 32bit オーバーフローも Lean と同じ", async () => {
  assert.deepEqual(await oracle.query({ fn: "midNaive", args: [1172860967, 1369542665] }), { ok: -876281832 });
});
test("不正な JSON 行にはエラーを返し、その後も応答し続ける", async () => {
  const r = (await oracle.queryRaw("not json")) as { error?: string };
  assert.equal(typeof r.error, "string");
  assert.deepEqual(await oracle.query({ fn: "sum", args: [3] }), { ok: 6 });
});
test("未知の関数名にはエラーを返す", async () => {
  const r = (await oracle.query({ fn: "nope", args: [] })) as { error?: string };
  assert.match(r.error ?? "", /unknown fn/);
});
