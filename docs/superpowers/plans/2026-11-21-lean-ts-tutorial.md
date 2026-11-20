# Lean × TypeScript 形式検証チュートリアル Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TS 実装と Lean 4 の証明を章ごとに並べ、第5章で差分テストにより両者の整合性を検査する学習用リポジトリを作る。

**Architecture:** `ts/` に素の TS 実装、`lean/` に同じアルゴリズムの Lean モデルと定理（Lake プロジェクト、差分テスト用 exe `oracle` を含む）、`difftest/` に fast-check で入力を生成し TS と Lean exe の出力を比較するハーネス。`docs/` に日本語解説。

**Tech Stack:** Lean 4（elan, 安定版, Mathlib なし）, Node 22, TypeScript, tsx, fast-check, node:test

**Spec:** `docs/design.md`

## Global Constraints
- Mathlib は使わない（Lean コアのみ）
- 証明に `sorry` を残さない（`lake build` で warning ゼロを確認）
- 解説は日本語。TS `number` と Lean `Nat`/`Int`/`BitVec` の意味のズレを各章で明示
- git リポジトリではないため commit ステップは無し（ユーザーが希望すれば `git init`）

## Review Focus
- 負数入力: TS `sum(-3)` は 0 を返すが Lean `Nat` には負数が無い → 差分テストは非負に限定し、解説で明記（Task 2）
- 空配列・要素1個: reverse / sort が正しく扱う（Task 3, 4 のテストに含める）
- 重複要素を含むソート: 個数保存の定理と TS テストの両方で扱う（Task 4）
- 32bit 境界: `lo=hi=2^31-1` 付近で naive 中点が壊れる例を TS と Lean 両方で示す（Task 5）
- Lean exe への不正 JSON 行: エラーメッセージを返し落ちない（Task 6）

---

### Task 1: 環境構築とプロジェクト雛形
**Files:** Create `package.json`, `tsconfig.json`, `lean/lakefile.toml`, `lean/lean-toolchain`, `lean/Tutorial.lean`, `README.md`（目次と実行方法）
- [ ] elan を `~/.elan` に導入し `lean --version` が出る
- [ ] `npm i -D typescript tsx fast-check @types/node`
- [ ] `cd lean && lake build` が成功（空ライブラリ `Tutorial`、exe `oracle`）
- [ ] `npx tsc --noEmit` が成功

### Task 2: 第1章 合計関数
**Files:** `ts/ch1_sum.ts`, `ts/ch1_sum.test.ts`, `lean/Tutorial/Ch1Sum.lean`, `docs/ch1-sum.md`
**Produces:** TS `sum(n: number): number`（for ループ）; Lean `sumTo : Nat → Nat`, `theorem sumTo_eq (n) : 2 * sumTo n = n * (n + 1)`
- [ ] テスト: `sum(0)=0, sum(1)=1, sum(10)=55, sum(-3)=0`
- [ ] 実装→ `npx tsx --test ts/` PASS
- [ ] Lean 定義と帰納法による証明、`#eval sumTo 10` = 55、`lake build` 成功
- [ ] 解説: ループ ↔ 再帰の対応、帰納法、`Nat` と `number` の違い

### Task 3: 第2章 配列反転
**Files:** `ts/ch2_reverse.ts`(+test), `lean/Tutorial/Ch2Reverse.lean`, `docs/ch2-reverse.md`
**Produces:** TS `reverse(xs: number[]): number[]`（新配列, 末尾から push）; Lean `rev : List Int → List Int`（`rev [] = []`, `rev (x::xs) = rev xs ++ [x]`）, 定理 `rev_length`, `rev_append`（補題）, `rev_rev`
- [ ] テスト: `[]`, `[1]`, `[1,2,3]→[3,2,1]`, 元配列を変更しない
- [ ] Lean 証明（補題 `rev_append : rev (xs ++ ys) = rev ys ++ rev xs` を経由）
- [ ] 解説: 補題を立てる理由、`simp`/`induction` の読み方

### Task 4: 第3章 挿入ソート
**Files:** `ts/ch3_sort.ts`(+test), `lean/Tutorial/Ch3Sort.lean`, `docs/ch3-sort.md`
**Produces:** TS `insertionSort(xs: number[]): number[]`; Lean `insert`, `isort : List Int → List Int`, `inductive Sorted`, 定理 `isort_sorted`, `isort_count (a xs) : (isort xs).count a = xs.count a`
- [ ] テスト: 空, 重複 `[3,1,2,1]→[1,1,2,3]`, 既ソート, 逆順
- [ ] Lean 証明
- [ ] 解説: 「仕様＝整列 ∧ 個数保存」、片方だけだと何が抜けるか（例: 常に `[]` を返す関数）

### Task 5: 第4章 二分探索の中点
**Files:** `ts/ch4_midpoint.ts`(+test), `lean/Tutorial/Ch4Midpoint.lean`, `docs/ch4-midpoint.md`
**Produces:** TS `midNaive(lo,hi) = ((lo + hi) | 0) >> 1`, `midSafe(lo,hi) = lo + ((hi - lo) >> 1)`（Int32 前提）; Lean `BitVec 32` 版 `midNaive`, `midSafe`, 定理 `midSafe_bounds : lo ≤ hi → lo ≤ midSafe lo hi ∧ midSafe lo hi ≤ hi`（符号なし比較）, naive の反例を `decide`/`#eval` で示す
- [ ] テスト: `midNaive(2**31-2, 2**31-1) < 0`（壊れる）, `midSafe` は範囲内
- [ ] Lean 証明（`bv_decide` または `omega` で `toNat` に落とす）
- [ ] 解説: 証明が「モデルの選び方」に依存する（`Nat` で証明していたら見逃す）

### Task 6: 第5章 差分テスト
**Files:** `lean/Main.lean`（exe `oracle`）, `difftest/oracle.ts`, `difftest/difftest.ts`, `difftest/buggy.ts`, `docs/ch5-difftest.md`
**Interfaces:** oracle は stdin に JSON Lines `{"fn":"sum"|"reverse"|"sort"|"midSafe","args":[...]}` を受け、1 行ずつ `{"ok":<result>}` または `{"error":"..."}` を返す
**Produces:** `runOracle(reqs: Req[]): Promise<unknown[]>`（1 プロセスでバッチ）; `npm run difftest`（全関数×1000ケース, 一致で exit 0）; `npm run difftest:buggy`（バグ版 sort で不一致を検出し反例を表示, exit 1）
- [ ] 不正 JSON 行で `{"error":...}` を返すテスト
- [ ] `npm run difftest` 全一致
- [ ] `npm run difftest:buggy` が最小化された反例を表示
- [ ] 解説: Cedar の事例、CI への組み込み、証明の外側（TCB）の明記
