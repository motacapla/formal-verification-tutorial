import { test } from "node:test";
import assert from "node:assert/strict";
import { sum } from "./ch1_sum.ts";

test("sum(0) は 0", () => assert.equal(sum(0), 0));
test("sum(1) は 1", () => assert.equal(sum(1), 1));
test("sum(10) は 55", () => assert.equal(sum(10), 55));
test("負数はループが回らず 0（Lean の Nat には負数が無い点に注意）", () => assert.equal(sum(-3), 0));
