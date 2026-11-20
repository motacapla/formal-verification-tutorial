import Std.Tactic.BVDecide

/-!
# 第4章: 二分探索の中点 ― モデルの選び方で結論が変わる

TypeScript 版 (`ts/ch4_midpoint.ts`):
```ts
export function midNaive(lo: number, hi: number) { return ((lo + hi) | 0) >> 1; }
export function midSafe(lo: number, hi: number)  { return (lo + ((hi - lo) >> 1)) | 0; }
```
どちらも 32bit 符号付き整数として計算している。
-/

namespace Ch4

/-! ## 1. 間違ったモデル: 自然数 `Nat` で考える

`Nat` には上限が無いので、オーバーフローは起こりえない。この世界では naive 版が「正しく」証明できてしまう。 -/
def midNat (lo hi : Nat) : Nat := (lo + hi) / 2

theorem midNat_bounds (lo hi : Nat) (h : lo ≤ hi) :
    lo ≤ midNat lo hi ∧ midNat lo hi ≤ hi := by
  unfold midNat
  omega

/-! **証明できた ＝ バグが無い、ではない。** 証明は「モデルについての」事実でしかない。

## 2. 正しいモデル: 32bit ビットベクトル `BitVec 32`

`BitVec 32` は 32 個のビット。足し算は 2^32 で折り返す（CPU や `| 0` と同じ）。
`sle` は符号付きの `≤`、`sshiftRight 1` は算術右シフト（TS の `>> 1`）。 -/
abbrev I32 := BitVec 32

def midNaive (lo hi : I32) : I32 := (lo + hi).sshiftRight 1
def midSafe  (lo hi : I32) : I32 := lo + (hi - lo).sshiftRight 1

/-! 次の定理を `bv_decide` で証明しようとすると、Lean は失敗して **反例を出力する**:
```
theorem midNaive_bounds (lo hi : I32) (h0 : (0 : I32).sle lo) (h1 : lo.sle hi) :
    lo.sle (midNaive lo hi) ∧ (midNaive lo hi).sle hi := by
  unfold midNaive; bv_decide
-- error: The prover found a counterexample, consider the following assignment:
-- lo = 1172860967#32
-- hi = 1369542665#32
```
反例を実行して確かめる（`toInt` は符号付き整数として読む）: -/
#eval (midNaive 1172860967#32 1369542665#32).toInt   -- 負の数になる
#eval (midNaive 2147483646#32 2147483647#32).toInt   -- 上限ぎりぎり: -2（TS のテストと同じ境界）
#eval (midSafe  2147483646#32 2147483647#32).toInt   -- 2147483646

/-- バグの存在そのものも定理として記録できる（具体例を示すだけで証明になる）。 -/
theorem midNaive_broken :
    ∃ lo hi : I32, (0 : I32).sle lo ∧ lo.sle hi ∧ (midNaive lo hi).slt 0 :=
  ⟨1172860967#32, 1369542665#32, by decide⟩

/-- 修正版は、0 ≤ lo ≤ hi のとき **2^64 通りすべての組** で lo ≤ mid ≤ hi を満たす。
`bv_decide` は問題を論理式 (SAT) に変換し、SAT ソルバで全探索と同等の確認を行う。 -/
theorem midSafe_bounds (lo hi : I32) (h0 : (0 : I32).sle lo) (h1 : lo.sle hi) :
    lo.sle (midSafe lo hi) ∧ (midSafe lo hi).sle hi := by
  unfold midSafe
  bv_decide

end Ch4
