/-!
# 第1章: 合計関数

TypeScript 版 (`ts/ch1_sum.ts`):
```ts
export function sum(n: number): number {
  let s = 0;
  for (let i = 1; i <= n; i++) { s += i; }
  return s;
}
```
-/

namespace Ch1

/-! ## 1. 「仕様」としての再帰定義
`sumTo n = 0 + 1 + ... + n` を、数学の定義そのままに再帰で書く。 -/
def sumTo : Nat → Nat
  | 0     => 0
  | n + 1 => sumTo n + (n + 1)

-- 証明の前に、まず実行して感触を確かめる（Lean の定義は実行できる）
#eval sumTo 10   -- 55

/-! ## 2. 定理: ガウスの公式
`n(n+1)/2` の割り算を避けるため、両辺を 2 倍した形で述べる。 -/
theorem sumTo_eq (n : Nat) : 2 * sumTo n = n * (n + 1) := by
  induction n with
  | zero => rfl                         -- n = 0: 両辺とも 0。計算するだけで一致
  | succ k ih =>                        -- n = k+1: ih : 2 * sumTo k = k * (k + 1)
    calc 2 * sumTo (k + 1)
        = 2 * sumTo k + 2 * (k + 1) := by rw [sumTo, Nat.mul_add]
      _ = k * (k + 1) + 2 * (k + 1) := by rw [ih]          -- 帰納法の仮定を使う
      _ = (k + 2) * (k + 1)         := by rw [← Nat.add_mul]
      _ = (k + 1) * (k + 1 + 1)     := by rw [Nat.mul_comm]

/-- 同じ定理を自動化タクティク `grind` で。`grind` は等式推論と算術ソルバを組み合わせ、上の calc の式変形を自動で見つけてくれる。 -/
theorem sumTo_eq' (n : Nat) : 2 * sumTo n = n * (n + 1) := by
  induction n with
  | zero => rfl
  | succ k ih => grind [sumTo]

/-- 割り算の形（TS のドキュメントに書いた仕様）も、上の定理から導ける。 -/
theorem sumTo_eq_div (n : Nat) : sumTo n = n * (n + 1) / 2 := by
  have h := sumTo_eq n
  omega

/-! ## 3. TS のループにより近いモデル
TS は「途中の合計 `s` を持ち回るループ」。これを末尾再帰 `go` で書く。
（ここでは数える向きが TS と逆で、n から 0 へ数え下げる。足し算の順番が変わるだけで結果は同じ） -/
def sumIter (n : Nat) : Nat := go n 0
where
  go : Nat → Nat → Nat
    | 0,     acc => acc
    | k + 1, acc => go k (acc + (k + 1))

#eval sumIter 10  -- 55

/-- **ループ不変条件**:「いまの途中結果 acc ＋ 残りの合計 ＝ 最終結果」。
`acc` を一般化 (generalizing) しないと帰納法が回らない点がポイント。 -/
theorem go_eq (k acc : Nat) : sumIter.go k acc = acc + sumTo k := by
  induction k generalizing acc with
  | zero => simp [sumIter.go, sumTo]
  | succ k ih =>
    simp only [sumIter.go, sumTo]
    rw [ih]
    omega

/-- ループ版と仕様版は全ての n で一致する。 -/
theorem sumIter_eq_sumTo (n : Nat) : sumIter n = sumTo n := by
  simp [sumIter, go_eq]

end Ch1
