import { test } from "node:test";
import assert from "node:assert/strict";
import { midNaive, midSafe, INT32_MAX } from "./ch4_midpoint.ts";

test("小さい値ではどちらも同じ", () => {
  assert.equal(midNaive(2, 10), 6);
  assert.equal(midSafe(2, 10), 6);
});
test("naive は 32bit 上限付近でオーバーフローして負になる", () => {
  assert.ok(midNaive(INT32_MAX - 1, INT32_MAX) < 0);
});
test("safe は 32bit 上限付近でも lo と hi の間に収まる", () => {
  const m = midSafe(INT32_MAX - 1, INT32_MAX);
  assert.ok(INT32_MAX - 1 <= m && m <= INT32_MAX);
});
test("lo = hi のとき safe はその値", () => assert.equal(midSafe(INT32_MAX, INT32_MAX), INT32_MAX));
test("Lean の bv_decide が見つけた反例を TS でも再現できる", () => {
  assert.equal(midNaive(1172860967, 1369542665), -876281832);
  const m = midSafe(1172860967, 1369542665);
  assert.ok(1172860967 <= m && m <= 1369542665);
});
