# TypeScript × Lean 4 で学ぶ形式検証チュートリアル

TypeScript で書いた身近なコードを題材に、**Lean 4 で「すべての入力で正しい」ことを証明** し、
さらに実務で使われる **差分テスト** で TS 実装と証明済みモデルの整合性を確かめます。

## 形式検証とは

| | テスト | 形式検証（証明） |
|---|---|---|
| 確かめる範囲 | 書いた入力だけ | **すべての入力** |
| 結果の意味 | 「この入力ではバグが見つからなかった」 | 「この性質は必ず成り立つ」 |
| 必要なもの | テストケース | 仕様（定理）＋証明 |

Lean 4 は関数型プログラミング言語であり、書いた証明が正しいかを機械的にチェックする「証明支援系」でもあります。

## 目次

| 章 | 題材 | 学ぶこと |
|---|---|---|
| [第1章](docs/ch1-sum.md) | 合計関数 `sum(n)` | Lean の基本、数学的帰納法、ループ不変条件 |
| [第2章](docs/ch2-reverse.md) | 配列の反転 | 証明が詰まったら補題を立てる |
| [第3章](docs/ch3-sort.md) | 挿入ソート | 仕様の書き方（整列だけでは不十分） |
| [第4章](docs/ch4-midpoint.md) | 二分探索の中点 | モデルの選び方、`bv_decide` による反例発見 |
| [第5章](docs/ch5-difftest.md) | 差分テスト | TS と Lean の整合性を実務でどう担保するか |

各章は次の3点セットです:
- `ts/chN_*.ts` … TypeScript 実装とテスト
- `lean/Tutorial/ChN*.lean` … Lean のモデル・定理・証明（コメントで解説付き）
- `docs/chN-*.md` … 日本語の解説

## セットアップ

```bash
# Lean（elan はバージョン管理ツール。~/.elan に入ります）
curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh -s -- -y
source ~/.elan/env

# TypeScript 側
npm install
```

エディタは VS Code ＋ 拡張機能「Lean 4」がおすすめです。`lean/` フォルダを開くと、カーソル位置の**残りゴール**が横に表示され、証明を1行ずつ追えます。

## コマンド

```bash
npm run lean:build      # 全ての証明をチェック＋オラクルをビルド（成功し、かつ `declaration uses 'sorry'` 警告が無ければ証明に穴はない）
npm test                # TS のテスト（差分テストのテストを含むので、先に lean:build が必要）
npm run typecheck       # TS の型チェック
npm run difftest        # 差分テスト: TS 実装と Lean モデルを各 1000 ケースで比較
npm run difftest:buggy  # バグ入りソートで差分テストがバグを見つける様子を見る
```

## 構成

```
ts/          TypeScript 実装とテスト
lean/        Lean 4 プロジェクト（Mathlib なし、Lean コアのみ）
  Tutorial/  各章のモデルと証明
  Main.lean  差分テスト用オラクル（JSON Lines で Lean の関数を呼べる実行ファイル）
difftest/    差分テストのハーネス（fast-check）
docs/        解説
```

## おすすめの進め方

1. 各章の解説を読みながら、`lean/Tutorial/ChN*.lean` を VS Code で開いて証明を1行ずつ追う
2. 証明の1行を消したり変えたりして `lake build` し、Lean がどこで何を要求してくるか見る
3. TS 側の実装をわざと壊して `npm run difftest` を実行し、どう検出されるか見る
