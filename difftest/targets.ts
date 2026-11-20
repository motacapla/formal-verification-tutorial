/**
 * 差分テストの本体: 同じランダム入力を TS 実装と Lean オラクルに与え、出力を比較する。
 * fast-check が入力を生成し、不一致が見つかると入力を自動で小さく（縮小, shrinking）してくれる。
 */
import fc from "fast-check";
import { isDeepStrictEqual } from "node:util";
import { Oracle, type Req } from "./oracle.ts";
import { sum } from "../ts/ch1_sum.ts";
import { reverse } from "../ts/ch2_reverse.ts";
import { insertionSort } from "../ts/ch3_sort.ts";
import { midNaive, midSafe, INT32_MAX } from "../ts/ch4_midpoint.ts";
import { buggyInsertionSort } from "./buggy.ts";

export type DiffResult = {
  name: string;
  ok: boolean;
  numRuns: number;
  counterexample?: unknown[];
  ts?: unknown;
  lean?: unknown;
};

type Target = {
  name: Req["fn"];
  // 入力の生成器。**Lean モデルが正しく表現できる範囲** に限定するのがポイント
  arb: fc.Arbitrary<unknown[]>;
  impl: (...args: never[]) => unknown;
};

// 32bit 境界付近の値を多めに出す: バグは境界に潜みやすい
const int32NonNeg = fc.oneof(
  fc.integer({ min: 0, max: INT32_MAX }),
  fc.integer({ min: INT32_MAX - 1000, max: INT32_MAX }),
);
const loHi = fc.tuple(int32NonNeg, int32NonNeg).map(([a, b]) => (a <= b ? [a, b] : [b, a]));

function targets(buggy: boolean): Target[] {
  return [
    // TS の number は負数・小数があり、2^53 を超えると精度が落ちる。Lean の Nat は負数・小数が無く上限も無い。
    // → 0..10000 の整数に限定（TS の結果が正確なまま、かつ Lean の再帰が深くなりすぎない範囲）
    { name: "sum", arb: fc.tuple(fc.nat({ max: 10000 })), impl: sum },
    { name: "reverse", arb: fc.tuple(fc.array(fc.integer())), impl: reverse },
    // 値の範囲を狭くして重複要素を出やすくする
    {
      name: "sort",
      arb: fc.tuple(fc.array(fc.integer({ min: -100, max: 100 }), { maxLength: 30 })),
      impl: buggy ? buggyInsertionSort : insertionSort,
    },
    { name: "midNaive", arb: loHi, impl: midNaive },
    { name: "midSafe", arb: loHi, impl: midSafe },
  ];
}

export async function runDiffTests(opts: { buggy: boolean; numRuns: number }): Promise<DiffResult[]> {
  const oracle = new Oracle();
  const results: DiffResult[] = [];
  try {
    for (const t of targets(opts.buggy)) {
      const check = await fc.check(
        fc.asyncProperty(t.arb, async (args) => {
          const res = await oracle.query({ fn: t.name, args } as Req);
          if (!("ok" in res)) throw new Error(`Lean オラクルのエラー: ${res.error}`);
          return isDeepStrictEqual(t.impl(...(args as never[])), res.ok);
        }),
        { numRuns: opts.numRuns },
      );
      if (!check.failed) {
        results.push({ name: t.name, ok: true, numRuns: check.numRuns });
        continue;
      }
      const ce = check.counterexample![0] as unknown[];
      const lean = await oracle.query({ fn: t.name, args: ce } as Req);
      results.push({
        name: t.name,
        ok: false,
        numRuns: check.numRuns,
        counterexample: ce,
        ts: t.impl(...(ce as never[])),
        lean: "ok" in lean ? lean.ok : lean,
      });
    }
  } finally {
    oracle.close();
  }
  return results;
}
