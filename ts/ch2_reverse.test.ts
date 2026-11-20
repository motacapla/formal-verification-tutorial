import { test } from "node:test";
import assert from "node:assert/strict";
import { reverse } from "./ch2_reverse.ts";

test("空配列は空配列", () => assert.deepEqual(reverse([]), []));
test("要素1個はそのまま", () => assert.deepEqual(reverse([1]), [1]));
test("[1,2,3] は [3,2,1]", () => assert.deepEqual(reverse([1, 2, 3]), [3, 2, 1]));
test("2回反転すると元に戻る", () => assert.deepEqual(reverse(reverse([4, 5, 6, 7])), [4, 5, 6, 7]));
test("元の配列を変更しない", () => {
  const xs = [1, 2, 3];
  reverse(xs);
  assert.deepEqual(xs, [1, 2, 3]);
});
