import { test } from "node:test";
import assert from "node:assert/strict";
import { insertionSort } from "./ch3_sort.ts";

test("空配列", () => assert.deepEqual(insertionSort([]), []));
test("重複を含む", () => assert.deepEqual(insertionSort([3, 1, 2, 1]), [1, 1, 2, 3]));
test("ソート済み", () => assert.deepEqual(insertionSort([1, 2, 3]), [1, 2, 3]));
test("逆順", () => assert.deepEqual(insertionSort([5, 4, 3, 2, 1]), [1, 2, 3, 4, 5]));
test("負数を含む", () => assert.deepEqual(insertionSort([0, -2, 7, -2]), [-2, -2, 0, 7]));
test("元の配列を変更しない", () => {
  const xs = [2, 1];
  insertionSort(xs);
  assert.deepEqual(xs, [2, 1]);
});
