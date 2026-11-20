# 第4章: 二分探索の中点 ― 証明は「モデル」についての事実

- TS 実装: [`ts/ch4_midpoint.ts`](../ts/ch4_midpoint.ts) / テスト: [`ts/ch4_midpoint.test.ts`](../ts/ch4_midpoint.test.ts)
- Lean: [`lean/Tutorial/Ch4Midpoint.lean`](../lean/Tutorial/Ch4Midpoint.lean)

## 1. 有名なバグ

二分探索の `mid = (lo + hi) / 2` は、Java の標準ライブラリに **約9年間** 潜んでいたバグとして有名です（2006年に発覚）。
`lo + hi` が 32bit 整数の上限 `2^31 - 1` を超えると、値が負の数に折り返してしまうのです。

TS の `number` は 2^53 まで正確なので、`Math.floor((lo + hi) / 2)` と書けばこのバグは起きません。
ところが JS でよく見かける `(lo + hi) >> 1` は **同じバグを持ちます**。`>>` は計算前に値を 32bit 符号付き整数に変換するので、`lo + hi` が `2^31` 以上だと負の数になるのです（符号なしシフト `(lo + hi) >>> 1` なら `2^32` 未満まで安全です）。
`| 0`・`Int32Array`・WebAssembly などで 32bit 整数演算をする場合も同様です。この章では `| 0` で 32bit 演算を再現しています。

```ts
export function midNaive(lo: number, hi: number) { return ((lo + hi) | 0) >> 1; }
export function midSafe(lo: number, hi: number)  { return (lo + ((hi - lo) >> 1)) | 0; }
```

## 2. 間違ったモデルでは「証明できてしまう」

```lean
def midNat (lo hi : Nat) : Nat := (lo + hi) / 2

theorem midNat_bounds (lo hi : Nat) (h : lo ≤ hi) :
    lo ≤ midNat lo hi ∧ midNat lo hi ≤ hi := by
  unfold midNat
  omega
```

**証明は成功します。** `Nat` には上限が無いので、オーバーフローが起こりえないからです。
これが形式検証で最も危険な落とし穴です。

> **証明が通った ＝ 実装が正しい、ではない。**
> 証明が保証するのは「Lean で書いたモデルが、定理の主張を満たす」ことだけ。
> モデルが現実（32bit 演算）を正しく表していなければ、証明は空振りします。

## 3. 正しいモデル: `BitVec 32`

```lean
abbrev I32 := BitVec 32
def midNaive (lo hi : I32) : I32 := (lo + hi).sshiftRight 1
def midSafe  (lo hi : I32) : I32 := lo + (hi - lo).sshiftRight 1
```

| Lean | 意味 | TS での対応 |
|---|---|---|
| `BitVec 32` | 32ビットの値。演算は 2^32 で折り返す | `x \| 0` した値 |
| `a.sle b` | 符号付きで `a ≤ b` | `a <= b` |
| `x.sshiftRight 1` | 算術右シフト | `x >> 1` |
| `x.toInt` | 符号付き整数として読む | ― |

## 4. 反例を自動で見つける: `bv_decide`

同じ主張を `BitVec 32` 版の naive 実装で証明しようとすると:

```lean
theorem midNaive_bounds (lo hi : I32) (h0 : (0 : I32).sle lo) (h1 : lo.sle hi) :
    lo.sle (midNaive lo hi) ∧ (midNaive lo hi).sle hi := by
  unfold midNaive; bv_decide
```

```
error: The prover found a counterexample, consider the following assignment:
lo = 1172860967#32
hi = 1369542665#32
```

`bv_decide` は、ビット演算の問題を論理式に変換して **SATソルバ** に解かせるタクティクです。
証明に失敗すると「この入力で主張が崩れる」という**反例**を返してくれます。人間が境界値を考える必要はありません。

実際に計算すると:

```lean
#eval (midNaive 1172860967#32 1369542665#32).toInt   -- -876281832
```

TS のテストでも同じ値になることを確認しています（`ts/ch4_midpoint.test.ts` の最後のテスト）。
**Lean が見つけた反例を、TS の回帰テストにする** ― これは実務でもよく使う手法です。

バグがあること自体も定理として残せます。具体的な入力を1つ示せば、それが「存在する」ことの証明になります。

```lean
theorem midNaive_broken :
    ∃ lo hi : I32, (0 : I32).sle lo ∧ lo.sle hi ∧ (midNaive lo hi).slt 0 :=
  ⟨1172860967#32, 1369542665#32, by decide⟩
```

## 5. 修正版の証明

```lean
theorem midSafe_bounds (lo hi : I32) (h0 : (0 : I32).sle lo) (h1 : lo.sle hi) :
    lo.sle (midSafe lo hi) ∧ (midSafe lo hi).sle hi := by
  unfold midSafe
  bv_decide
```

入力の組み合わせは 2^32 × 2^32 = 約1800京通りあり、テストで全部試すのは不可能です。
`bv_decide` は1秒ほどでそれらすべてについて成り立つことを示します。

SATソルバの答えは「証明書（LRAT）」として Lean 側の検査プログラムでチェックされるので、ソルバ自体のバグに騙される心配はありません。
ただし、この検査プログラムは（遅いカーネルではなく）**コンパイルされたネイティブコードとして実行** されます。そのため「検査結果は正しい」という前提が、補助的な公理として追加されます。`#print axioms` で確かめてみましょう。

```lean
#print axioms Ch4.midSafe_bounds
-- [propext, Classical.choice, Quot.sound, Ch4.midSafe_bounds._native.bv_decide.ax_1_5]

#print axioms Ch4.midNaive_broken
-- [propext]
```

最後の `..._native.bv_decide.ax_1_5` が、「ネイティブコードで計算した検査結果を信じる」という公理です。
つまり `bv_decide` を使うと、**Lean のコンパイラとネイティブ実行も信頼する対象（TCB）に入ります**。カーネルだけで検査できる `decide` を使った `midNaive_broken` と比べると、信頼の土台がはっきり違うことが分かります。
実務ではこのトレードオフ（速さ vs 信頼する部品の少なさ）を理解したうえで使い分けます。

## 6. まとめ

| 手法 | 見つけたもの |
|---|---|
| 普通のテスト（小さい値） | 何も見つからない |
| `Nat` での証明 | 「正しい」と誤って結論 |
| `BitVec 32` での証明 | 反例を自動発見 → 修正版は全入力で正しいと証明 |

モデルを選ぶ時は、**実装が実際に動く環境の意味（整数の幅、浮動小数点、例外、並行性…）をどこまで再現するか** を意識しましょう。
