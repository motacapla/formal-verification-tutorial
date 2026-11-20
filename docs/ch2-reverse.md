# 第2章: 配列の反転 ― 補題を立てる

- TS 実装: [`ts/ch2_reverse.ts`](../ts/ch2_reverse.ts) / テスト: [`ts/ch2_reverse.test.ts`](../ts/ch2_reverse.test.ts)
- Lean: [`lean/Tutorial/Ch2Reverse.lean`](../lean/Tutorial/Ch2Reverse.lean)

## 1. 保証したいこと

```ts
export function reverse(xs: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = xs.length - 1; i >= 0; i--) out.push(xs[i]);
  return out;
}
```

- 長さが変わらない: `reverse(xs).length === xs.length`
- 2回反転すると元に戻る: `reverse(reverse(xs))` は `xs` と同じ

テストでは数個の配列でしか確かめられませんが、Lean では **あらゆる長さ・あらゆる中身のリスト** について証明します。

## 2. Lean のモデル

```lean
def rev : List Int → List Int
  | []      => []
  | x :: xs => rev xs ++ [x]
```

- `List Int` は整数のリスト。`[]` は空、`x :: xs` は「先頭が x、残りが xs」
- `++` はリストの連結
- TS の配列 `number[]` をリスト `List Int` で表しました（ズレ: `Int` は小数や `NaN` を持たない）

リストに対する帰納法は「空リストで成り立つ」＋「xs で成り立つなら `x :: xs` でも成り立つ」を示せば、全てのリストで成り立つ、というものです。

## 3. 定理1: 長さ保存（素直に解ける）

```lean
theorem rev_length (xs : List Int) : (rev xs).length = xs.length := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [rev, ih]
```

`simp` は「等式を使ってゴールを書き換え、簡単にする」タクティクです（等式は基本的に左辺 → 右辺の向きに使います）。
使う等式は2種類あります。標準ライブラリで `@[simp]` 印が付いた定理（`List.length_append : (xs ++ ys).length = xs.length + ys.length` など）は自動的に使われ、さらに `[rev, ih]` で「`rev` の定義と帰納法の仮定 `ih` も使ってよい」と追加で指示しています。
`(rev xs ++ [x]).length` → `(rev xs).length + 1`（`List.length_append` など）→ `xs.length + 1`（`ih`）と変形して終わります。

## 4. 定理2: 二重反転 ― 証明が詰まる体験

いきなり `rev (rev xs) = xs` を同じ方法で示そうとすると、Lean はこう返してきます。

```
error: unsolved goals
case cons
x : Int
xs : List Int
ih : rev (rev xs) = xs
⊢ rev (rev xs ++ [x]) = x :: xs
```

`⊢` の右が「まだ示せていないゴール」、上が「使える仮定」です。
ゴールは `rev (... ++ [x])`、つまり **連結したものの反転** を含んでいますが、それについての知識が何もありません。
仮定 `ih` は `rev (rev xs)` の形にしか使えず、形が合わないので役に立ちません。

### 解決: 補題を立てる

```lean
theorem rev_append (xs ys : List Int) : rev (xs ++ ys) = rev ys ++ rev xs := by
  induction xs with
  | nil => simp [rev]
  | cons x xs ih => simp [rev, ih, List.append_assoc]
```

「連結してから反転」＝「それぞれ反転して順番を入れ替えて連結」。これがあれば:

```
rev (rev xs ++ [x])
= rev [x] ++ rev (rev xs)     -- rev_append
= [x] ++ xs                   -- rev の定義と ih
= x :: xs
```

```lean
theorem rev_rev (xs : List Int) : rev (rev xs) = xs := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [rev, rev_append, ih]
```

> **教訓**: 証明が詰まったら、Lean が示す「残りゴール」を読み、**足りない知識を補題として切り出す**。
> これはプログラミングでヘルパー関数を切り出すのとよく似ています。形式検証の作業時間の大半はここに使われます。

## 5. 定理3: 既知の正しい実装と一致させる

```lean
theorem rev_eq_reverse (xs : List Int) : rev xs = xs.reverse
```

自作の `rev` が標準ライブラリの `List.reverse` と同じであることを示しました。
こうしておくと、標準ライブラリにある `List.reverse` についての大量の定理を、`rev` にもそのまま使えるようになります。

## 6. TS 実装との関係

Lean の `rev` は「先頭を取って末尾に付ける」再帰で、TS の「後ろから順に push するループ」とは書き方が違います。
**計算方法が違っても結果が同じ** ことは Lean では証明していません（TS のコードは Lean の中に無いので）。
このギャップを埋めるのが、第5章の差分テストです。
