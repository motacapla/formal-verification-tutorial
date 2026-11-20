import { test } from "node:test";
import assert from "node:assert/strict";
import { runDiffTests } from "./targets.ts";

test("正しい実装では全関数で TS と Lean が一致する", async () => {
  const results = await runDiffTests({ buggy: false, numRuns: 200 });
  assert.deepEqual(results.map((r) => [r.name, r.ok]), [
    ["sum", true], ["reverse", true], ["sort", true], ["midNaive", true], ["midSafe", true],
  ]);
});

test("バグ入りソートは差分テストで検出され、縮小された反例が得られる", async () => {
  const results = await runDiffTests({ buggy: true, numRuns: 200 });
  const sort = results.find((r) => r.name === "sort")!;
  assert.equal(sort.ok, false);
  // 縮小された反例は「2要素で、先頭が大きい」配列になる
  const [xs] = sort.counterexample as [number[]];
  assert.equal(xs.length, 2);
  assert.ok(xs[0] > xs[1]);
});
