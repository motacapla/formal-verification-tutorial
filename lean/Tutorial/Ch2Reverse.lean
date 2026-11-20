/-!
# 第2章: 配列の反転

TypeScript 版 (`ts/ch2_reverse.ts`):
```ts
export function reverse(xs: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = xs.length - 1; i >= 0; i--) out.push(xs[i]);
  return out;
}
```
Lean では配列の代わりにリスト `List Int` で考える。
-/

namespace Ch2

/-- 反転の定義: 先頭 x を取り出し、残りを反転したものの **末尾** に付ける。 -/
def rev : List Int → List Int
  | []      => []
  | x :: xs => rev xs ++ [x]

#eval rev [1, 2, 3]  -- [3, 2, 1]

/-! ## 定理1: 長さが変わらない -/
theorem rev_length (xs : List Int) : (rev xs).length = xs.length := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [rev, ih]

/-! ## 定理2: 2回反転すると元に戻る

いきなり `rev (rev xs) = xs` を帰納法で示そうとすると、
`rev (rev xs ++ [x]) = x :: xs` というゴールで詰まる。
「`++` の反転」についての知識が足りないからだ。そこで先に **補題** を用意する。 -/

/-- 補題: 連結したものを反転すると、順番が入れ替わる。 -/
theorem rev_append (xs ys : List Int) : rev (xs ++ ys) = rev ys ++ rev xs := by
  induction xs with
  | nil => simp [rev]
  | cons x xs ih => simp [rev, ih, List.append_assoc]

/-- 本題: 補題を使えば一行で済む。 -/
theorem rev_rev (xs : List Int) : rev (rev xs) = xs := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [rev, rev_append, ih]

/-! ## 定理3: 標準ライブラリの `List.reverse` と一致する
自作の定義が「よく知られた正しい定義」と同じであることを示すのも、よく使う手法。 -/
theorem rev_eq_reverse (xs : List Int) : rev xs = xs.reverse := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [rev, ih]

end Ch2
