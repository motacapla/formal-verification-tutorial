/**
 * 第3章: 挿入ソート（元の配列は変更せず、新しい配列を返す）。
 * 仕様（Lean で証明する性質）:
 *   - 出力は昇順に並んでいる
 *   - 出力は入力の並べ替え（各値の個数が変わらない）
 */
export function insertionSort(xs: readonly number[]): number[] {
  const out = [...xs];
  for (let i = 1; i < out.length; i++) {
    const key = out[i];
    let j = i - 1;
    // key より大きい要素を1つずつ右にずらし、空いた場所に key を入れる
    while (j >= 0 && out[j] > key) {
      out[j + 1] = out[j];
      j--;
    }
    out[j + 1] = key;
  }
  return out;
}
