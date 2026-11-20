import Lean.Data.Json
import Tutorial

/-!
# 差分テスト用オラクル

Lean で定義・証明したモデルを、そのまま実行可能な「正解」として外部に公開する。
標準入力から 1 行 1 リクエストの JSON を読み、1 行の JSON で答える。

  入力: {"fn":"sort","args":[[3,1,2]]}
  出力: {"ok":[1,2,3]}   または   {"error":"..."}
-/

open Lean

/-- `args` の i 番目を型 α として取り出す。 -/
def arg {α : Type} [FromJson α] (args : Array Json) (i : Nat) : Except String α :=
  match args[i]? with
  | some v => fromJson? v
  | none   => .error s!"missing argument #{i}"

def toI32 (x : Int) : Ch4.I32 := BitVec.ofInt 32 x

def handle (req : Json) : Except String Json := do
  let fn   ← req.getObjValAs? String "fn"
  let args ← req.getObjValAs? (Array Json) "args"
  match fn with
  | "sum"      => return toJson (Ch1.sumTo (← arg (α := Nat) args 0))
  | "reverse"  => return toJson (Ch2.rev (← arg (α := Array Int) args 0).toList)
  | "sort"     => return toJson (Ch3.isort (← arg (α := Array Int) args 0).toList)
  | "midNaive" => return toJson (Ch4.midNaive (toI32 (← arg args 0)) (toI32 (← arg args 1))).toInt
  | "midSafe"  => return toJson (Ch4.midSafe  (toI32 (← arg args 0)) (toI32 (← arg args 1))).toInt
  | other      => throw s!"unknown fn: {other}"

partial def loop (stdin stdout : IO.FS.Stream) : IO Unit := do
  let line ← stdin.getLine
  if line.isEmpty then return   -- EOF
  let line := line.trimAscii.toString
  unless line.isEmpty do
    let resp := match Json.parse line >>= handle with
      | .ok v    => Json.mkObj [("ok", v)]
      | .error e => Json.mkObj [("error", toJson e)]
    stdout.putStrLn resp.compress
    stdout.flush                -- 1 行ごとに即座に返す（対話的に使うため）
  loop stdin stdout

def main : IO Unit := do
  loop (← IO.getStdin) (← IO.getStdout)
