/**
 * わざとバグを入れた挿入ソート（差分テストのデモ用）。
 * `j >= 0` を `j > 0` と書き間違えたため、要素を先頭（index 0）まで移動できない。
 * 例: [2, 1] → [2, 1] のまま。
 */
export function buggyInsertionSort(xs: readonly number[]): number[] {
  const out = [...xs];
  for (let i = 1; i < out.length; i++) {
    const key = out[i];
    let j = i - 1;
    while (j > 0 && out[j] > key) { // ← バグ: 正しくは j >= 0
      out[j + 1] = out[j];
      j--;
    }
    out[j + 1] = key;
  }
  return out;
}
