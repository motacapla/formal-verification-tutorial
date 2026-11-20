import { test } from "node:test";
import assert from "node:assert/strict";
import { Oracle } from "./oracle.ts";

test("オラクルが途中で異常終了したら、待っている問い合わせは分かりやすいエラーで reject される", async () => {
  const oracle = new Oracle();
  // sumTo は末尾再帰でないため、巨大な n ではスタックオーバーフローで Lean プロセスが落ちる
  await assert.rejects(oracle.query({ fn: "sum", args: [100_000_000] }), /Lean オラクルが終了しました/);
});

test("オラクルが起動直後に終了しても、EPIPE で落ちずに reject される", async () => {
  const oracle = new Oracle("/bin/true");
  await new Promise((r) => setTimeout(r, 100));
  await assert.rejects(oracle.query({ fn: "sum", args: [1] }), /Lean オラクルが終了しました/);
});

test("オラクルの実行ファイルが無ければ、例外ではなく reject になる", async () => {
  const oracle = new Oracle("/nonexistent/oracle");
  await assert.rejects(oracle.query({ fn: "sum", args: [1] }), /npm run lean:build/);
});
