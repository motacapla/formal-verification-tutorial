/**
 * 第1章: 1 から n までの合計をループで求める。
 * 仕様（Lean で証明する性質）: n >= 0 の整数なら sum(n) === n * (n + 1) / 2
 */
export function sum(n: number): number {
  let s = 0;
  for (let i = 1; i <= n; i++) {
    s += i;
  }
  return s;
}
