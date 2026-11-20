# 第3章: 挿入ソート ― 「仕様」を正しく書く

- TS 実装: [`ts/ch3_sort.ts`](../ts/ch3_sort.ts) / テスト: [`ts/ch3_sort.test.ts`](../ts/ch3_sort.test.ts)
- Lean: [`lean/Tutorial/Ch3Sort.lean`](../lean/Tutorial/Ch3Sort.lean)

この章のテーマは証明テクニックよりも **「何を証明すべきか」** です。
形式検証は「仕様どおりであること」を保証しますが、**仕様そのものが間違っていたら意味がありません**。

## 1. モデル

TS は配列の要素を右にずらしながら挿入します。Lean では同じ考え方を2つの関数で書きます。

```lean
def insert (a : Int) : List Int → List Int
  | []      => [a]
  | x :: xs => if a ≤ x then a :: x :: xs else x :: insert a xs

def isort : List Int → List Int
  | []      => []
  | x :: xs => insert x (isort xs)
```

## 2. 「ソート済み」を定義する

```lean
inductive Sorted : List Int → Prop
  | nil : Sorted []
  | single (x : Int) : Sorted [x]
  | cons (x y : Int) (rest : List Int) :
      x ≤ y → Sorted (y :: rest) → Sorted (x :: y :: rest)
```

- `Prop` は「命題」の型。`Sorted xs` は true/false を計算する関数ではなく、「xs は昇順である」という**主張**です
- `inductive` は「この3つの規則で作れるものだけが `Sorted`」という意味です
  - 例: `Sorted [1, 2, 3]` は `cons 1 2 [3] (1≤2) (cons 2 3 [] (2≤3) (single 3))` と組み立てられます

## 3. 定理: 出力はソート済み

まず補題「ソート済みリストに挿入してもソート済み」を示します（`insert_sorted`）。
今回は `Sorted` の規則についての帰納法（`induction h`）を使い、`a` が先頭に来るか、2番目に来るのが `a` か `y` かで場合分けしています。

```lean
    by_cases hax : a ≤ x
    · -- a が先頭に来る
      ...
    · by_cases hay : a ≤ y
      · ... Sorted.cons x a _ (by omega) ih   -- x ≤ a は ¬(a ≤ x) から omega が導く
      · ... Sorted.cons x y _ hxy ih
```

`by_cases` は「成り立つ場合」と「成り立たない場合」に分けるタクティクです。
TS で `if` を書いたら、両方の分岐をテストしたくなりますよね。証明では**全分岐を漏れなく扱わないと Lean が通してくれません**。

あとは `isort` についての帰納法で `isort_sorted : Sorted (isort xs)` が示せます。

## 4. 落とし穴: 「ソート済み」だけでは仕様として不十分

```lean
def badSort (_ : List Int) : List Int := []

theorem badSort_sorted (xs : List Int) : Sorted (badSort xs) := Sorted.nil
```

**常に空リストを返す関数** も「出力はソート済み」を満たしてしまいます。
`[3, 1, 2]` を入れて `[1, 2]` が出てくる（要素が消える）関数や、`[1, 1, 1]` が出てくる関数も同様です。

> テストでも同じことが言えます。`isSorted(result)` だけを確認するテストは、壊れたソートを見逃します。

## 5. 仕様その2: 並べ替え（Permutation）

```lean
theorem isort_perm (xs : List Int) : List.Perm (isort xs) xs
```

`List.Perm l₁ l₂` は「`l₁` は `l₂` の要素の順番を入れ替えたもの」という意味です（標準ライブラリにあります）。
証明は補題 `insert_perm : List.Perm (insert a xs) (a :: xs)` を経由し、標準ライブラリの `List.Perm.swap`（隣を入れ替えても並べ替え）や `List.Perm.trans`（並べ替えの並べ替えは並べ替え）を組み合わせています。

並べ替えであれば「各値の出現回数が同じ」なので、重複要素も正しく扱えていることが分かります。

```lean
theorem isort_count (a : Int) (xs : List Int) : (isort xs).count a = xs.count a
```

最終的な仕様はこの2つの組み合わせです:

```lean
theorem isort_correct (xs : List Int) : Sorted (isort xs) ∧ List.Perm (isort xs) xs
```

## 6. まとめ: 仕様のレビューが一番大事

| 仕様 | 防げる間違い | 防げない間違い |
|---|---|---|
| 整列だけ | 順番が狂う | 要素が消える・増える・変わる |
| 並べ替えだけ | 要素が消える・増える | 順番が狂う（何もしない関数も通る） |
| **整列 ∧ 並べ替え** | 両方 | ― |

形式検証で一番レビューすべきなのは、**証明ではなく定理の主張（`theorem ... :` の右側）** です。
証明の正しさは Lean が機械的にチェックしてくれますが、「その主張で本当に十分か」は人間にしか判断できません。
