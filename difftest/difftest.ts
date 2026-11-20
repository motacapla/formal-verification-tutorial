/**
 * 使い方:
 *   npm run difftest         # 正しい実装で TS と Lean が一致することを確認（CI 向け、不一致なら exit 1）
 *   npm run difftest:buggy   # バグ入りソートに差し替え、差分テストがバグを見つける様子を見る
 */
import { runDiffTests } from "./targets.ts";

const buggy = process.argv.includes("--buggy");
const numRuns = 1000;

console.log(`差分テスト: TS 実装 vs Lean モデル（各関数 ${numRuns} ケース${buggy ? "、バグ入りソート" : ""}）\n`);
const results = await runDiffTests({ buggy, numRuns });

for (const r of results) {
  if (r.ok) {
    console.log(`  ✔ ${r.name.padEnd(9)} ${r.numRuns} ケースすべて一致`);
  } else {
    console.log(`  ✘ ${r.name.padEnd(9)} 不一致を発見（${r.numRuns} ケース目、縮小済み）`);
    console.log(`      入力: ${JSON.stringify(r.counterexample)}`);
    console.log(`      TS  : ${JSON.stringify(r.ts)}`);
    console.log(`      Lean: ${JSON.stringify(r.lean)}   ← Lean モデル`);
  }
}

const failed = results.filter((r) => !r.ok).length;
console.log(failed === 0 ? "\nすべて一致しました。" : `\n${failed} 個の関数で TS と Lean が食い違いました。`);
process.exitCode = failed === 0 ? 0 : 1;
