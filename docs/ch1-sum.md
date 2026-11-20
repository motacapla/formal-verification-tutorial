# 第1章: 合計関数 ― 「テスト」と「証明」は何が違うのか

- TS 実装: [`ts/ch1_sum.ts`](../ts/ch1_sum.ts) / テスト: [`ts/ch1_sum.test.ts`](../ts/ch1_sum.test.ts)
- Lean: [`lean/Tutorial/Ch1Sum.lean`](../lean/Tutorial/Ch1Sum.lean)

## 1. 出発点: テストで分かること

```ts
export function sum(n: number): number {
  let s = 0;
  for (let i = 1; i <= n; i++) s += i;
  return s;
}
```

テストは `sum(0)=0`, `sum(1)=1`, `sum(10)=55` を確認します。
でも、確認できたのは **その3つの入力だけ** です。`sum(12345)` が正しいかは、テストからは何も言えません。

形式検証では、代わりに **「すべての n について `sum(n) = n(n+1)/2`」という命題を数学的に証明** します。

## 2. Lean に書き写す（モデル化）

Lean は「関数型プログラミング言語」＋「証明チェッカー」です。まず同じ計算を Lean で書きます。

```lean
def sumTo : Nat → Nat
  | 0     => 0
  | n + 1 => sumTo n + (n + 1)
```

- `Nat` は **0 以上の整数（上限なし）**。TS の `number`（64bit 浮動小数点）とは別物です → 第6節
- `| 0 => ...` `| n + 1 => ...` は「0 の場合」「1 以上の場合」のパターンマッチ
- `#eval sumTo 10` で実行でき、`55` と表示されます。Lean の定義は**動くプログラム**でもあります（第5章で活用）

## 3. 定理を書く

```lean
theorem sumTo_eq (n : Nat) : 2 * sumTo n = n * (n + 1) := by
```

- `theorem 名前 (n : Nat) : 命題 := by 証明` という形
- 「任意の自然数 n について」が `(n : Nat)` で表されています
- 割り算 `/ 2` は自然数だと切り捨てが絡んで扱いにくいので、両辺を2倍した形にしました（割り算版も後で導きます）

## 4. 証明を読む: 数学的帰納法

```lean
  induction n with
  | zero => rfl
  | succ k ih =>
    calc 2 * sumTo (k + 1)
        = 2 * sumTo k + 2 * (k + 1) := by rw [sumTo, Nat.mul_add]
      _ = k * (k + 1) + 2 * (k + 1) := by rw [ih]
      _ = (k + 2) * (k + 1)         := by rw [← Nat.add_mul]
      _ = (k + 1) * (k + 1 + 1)     := by rw [Nat.mul_comm]
```

| 行 | 意味 |
|---|---|
| `induction n` | n について帰納法を使う。「n=0 の場合」と「k で成り立つなら k+1 でも成り立つ」の2つを示せばよい |
| `zero => rfl` | n=0 なら両辺とも計算すると 0。`rfl` は「計算したら同じ」 |
| `succ k ih` | n=k+1 の場合。`ih`（induction hypothesis）は `2 * sumTo k = k * (k + 1)` という**使ってよい仮定** |
| `calc` | 式変形を1行ずつ書く。各行の `by ...` がその1歩の根拠 |
| `rw [sumTo]` | `sumTo` の定義で書き換え（`sumTo (k+1)` → `sumTo k + (k+1)`） |
| `rw [ih]` | 帰納法の仮定で書き換え。**ここが証明の核心** |
| `Nat.add_mul` など | 標準ライブラリにある分配法則などの定理 |

Lean は各ステップを機械的にチェックし、1つでも飛躍があればエラーにします。

### 注意: `sorry` と `#print axioms`

Lean には `sorry`（「ここは後で証明する」という仮置き）があり、これを使うと **証明が未完成でも `lake build` は成功します**。出るのは次の警告だけです。

```
warning: declaration uses `sorry`
```

なので「ビルドが成功した」だけでは不十分で、**`sorry` の警告が出ていないこと** まで確認してください。
より確実なのは `#print axioms` で、その定理が最終的に何を前提にしているかを表示できます。

```lean
#print axioms Ch3.isort_correct
-- 'Ch3.isort_correct' depends on axioms: [propext, Quot.sound]
```

`propext` や `Quot.sound` は Lean の標準的な公理なので問題ありません。ここに `sorryAx` が出てきたら、どこかに `sorry` が残っています。

> 💡 試してみよう: `rw [ih]` の行を消して `lake build` すると、どこで何が示せていないかを Lean が教えてくれます。

### 自動化: `grind`

```lean
  | succ k ih => grind [sumTo]
```

同じことを自動証明タクティク `grind` に任せることもできます。実務では「人が方針（帰納法）を決め、細部は自動化に任せる」スタイルが一般的です。

`sumTo_eq_div` では、2倍版の定理から `omega`（整数の線形算術を自動で解くタクティク）で割り算版 `sumTo n = n * (n + 1) / 2` を導いています。

## 5. TS のループにもっと近づける: ループ不変条件

TS のコードは再帰ではなく「途中の合計 `s` を持ち回るループ」でした。Lean でもそれに近い形が書けます。

```lean
def sumIter (n : Nat) : Nat := go n 0
where
  go : Nat → Nat → Nat
    | 0,     acc => acc
    | k + 1, acc => go k (acc + (k + 1))
```

このループ版が正しいことを示すカギが **ループ不変条件** です。

```lean
theorem go_eq (k acc : Nat) : sumIter.go k acc = acc + sumTo k
```

「途中結果 `acc` ＋ まだ足していない分 `sumTo k` ＝ 最終結果」が、ループのどの時点でも成り立つ、という主張です。
証明で `induction k generalizing acc` と書いているのは、帰納法の途中で `acc` の値が変わる（`acc + (k+1)` になる）ので、**どんな acc でも成り立つ**形で帰納法を回す必要があるからです。

> ループの検証 ＝ 「不変条件を見つけて、それを帰納法で示す」。これは Dafny の `invariant` と本質的に同じ作業です。

最後に `sumIter_eq_sumTo : sumIter n = sumTo n` で「実装寄りの版」と「仕様寄りの版」が全入力で一致することを証明しています。
**実装を直接証明する代わりに、分かりやすい仕様と一致することを証明する** ― これが形式検証の基本パターンです。

## 6. 注意: 証明したのは「Lean 版」

| | TS `number` | Lean `Nat` |
|---|---|---|
| 負の数 | ある（`sum(-3)` は 0 を返す） | 無い |
| 上限 | 2^53 を超えると精度が落ちる | 無制限 |
| 小数 | `sum(2.5)` も動いてしまう | 無い |

つまり Lean の定理を TS に当てはめられるとしても、**最大で**「0 以上で、大きすぎない整数」の範囲だけです。
しかも Lean の定理が直接語っているのは Lean 版のことだけで、TS 版が本当に同じ動きをするかは別問題です（第5章で確かめます）。
この「モデルと実装のズレ」をどう扱うかは第4章・第5章のテーマです。
