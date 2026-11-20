/-!
# 第3章: 挿入ソート

TypeScript 版 (`ts/ch3_sort.ts`) は配列の要素を右にずらしながら挿入する。
Lean では「ソート済みリストに 1 要素を正しい位置へ挿入する」関数 `insert` を
繰り返し使う形でモデル化する（アルゴリズムの考え方は同じ）。
-/

namespace Ch3

/-- ソート済みリストの正しい位置に `a` を挿入する。 -/
def insert (a : Int) : List Int → List Int
  | []      => [a]
  | x :: xs => if a ≤ x then a :: x :: xs else x :: insert a xs

/-- 挿入ソート: 後ろの部分をソートしてから、先頭を挿入する。 -/
def isort : List Int → List Int
  | []      => []
  | x :: xs => insert x (isort xs)

#eval isort [3, 1, 2, 1]  -- [1, 1, 2, 3]

/-! ## 仕様その1: 「昇順に並んでいる」を定義する

`Sorted xs` は「xs が昇順である」という **命題**。3つの規則で定義する:
- 空リストはソート済み
- 要素1つのリストはソート済み
- `x ≤ y` で、`y :: rest` がソート済みなら、`x :: y :: rest` もソート済み -/
inductive Sorted : List Int → Prop
  | nil : Sorted []
  | single (x : Int) : Sorted [x]
  | cons (x y : Int) (rest : List Int) :
      x ≤ y → Sorted (y :: rest) → Sorted (x :: y :: rest)

/-- 補題: ソート済みリストに挿入しても、ソート済みのまま。 -/
theorem insert_sorted (a : Int) {xs : List Int} (h : Sorted xs) : Sorted (insert a xs) := by
  induction h with
  | nil => exact Sorted.single a
  | single x =>
    simp only [insert]
    split
    · exact Sorted.cons a x [] ‹_› (Sorted.single x)
    · exact Sorted.cons x a [] (by omega) (Sorted.single a)
  | cons x y rest hxy hs ih =>
    -- ih : Sorted (insert a (y :: rest))
    by_cases hax : a ≤ x
    · -- a が先頭に来る: a :: x :: y :: rest
      simp only [insert, hax, ↓reduceIte]
      exact Sorted.cons a x _ hax (Sorted.cons x y rest hxy hs)
    · -- x が先頭のまま: x :: insert a (y :: rest)。2番目に来るのが a か y かで分ける
      by_cases hay : a ≤ y
      · simp only [insert, hax, hay, ↓reduceIte] at ih ⊢
        exact Sorted.cons x a _ (by omega) ih
      · simp only [insert, hax, hay, ↓reduceIte] at ih ⊢
        exact Sorted.cons x y _ hxy ih

/-- 定理: 挿入ソートの出力はソート済み。 -/
theorem isort_sorted (xs : List Int) : Sorted (isort xs) := by
  induction xs with
  | nil => exact Sorted.nil
  | cons x xs ih => exact insert_sorted x ih

/-! ## 仕様その2: 「要素が失われない・増えない」

`Sorted` だけでは仕様として不十分。例えば「常に空リストを返す関数」もソート済みを満たしてしまう。 -/
def badSort (_ : List Int) : List Int := []

theorem badSort_sorted (xs : List Int) : Sorted (badSort xs) := Sorted.nil

/-! そこで「出力は入力の並べ替え（置換, permutation）である」ことも証明する。
`List.Perm l₁ l₂`は「順番を入れ替えれば同じリスト」という意味。 -/

/-- 補題: `insert a xs` は `a :: xs` の並べ替え。 -/
theorem insert_perm (a : Int) (xs : List Int) : List.Perm (insert a xs) (a :: xs) := by
  induction xs with
  | nil => simp [insert]
  | cons x xs ih =>
    simp only [insert]
    split
    · exact List.Perm.refl _
    · -- x :: insert a xs  →(ih)→  x :: a :: xs  →(swap)→  a :: x :: xs
      exact (ih.cons x).trans (List.Perm.swap a x xs)

/-- 定理: 挿入ソートの出力は入力の並べ替え。 -/
theorem isort_perm (xs : List Int) : List.Perm (isort xs) xs := by
  induction xs with
  | nil => exact List.Perm.refl _
  | cons x xs ih => exact (insert_perm x _).trans (ih.cons x)

/-- 系: どの値についても、出現回数が変わらない（重複も正しく保たれる）。 -/
theorem isort_count (a : Int) (xs : List Int) : (isort xs).count a = xs.count a :=
  (isort_perm xs).count_eq a

/-- まとめ: 挿入ソートは「ソートの仕様」を完全に満たす。 -/
theorem isort_correct (xs : List Int) : Sorted (isort xs) ∧ List.Perm (isort xs) xs :=
  ⟨isort_sorted xs, isort_perm xs⟩

end Ch3
