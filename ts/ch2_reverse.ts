/**
 * 第2章: 配列を反転した新しい配列を返す（元の配列は変更しない）。
 * 仕様（Lean で証明する性質）:
 *   - reverse(xs).length === xs.length
 *   - reverse(reverse(xs)) は xs と等しい
 */
export function reverse(xs: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = xs.length - 1; i >= 0; i--) {
    out.push(xs[i]);
  }
  return out;
}
