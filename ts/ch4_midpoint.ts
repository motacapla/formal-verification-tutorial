/**
 * 第4章: 二分探索の中点計算（32bit 符号付き整数として計算する版）。
 *
 * JS の number は 2^53 まで正確なので `(lo + hi) / 2` はふつう壊れない。
 * しかし `| 0` や Int32Array、WebAssembly などで 32bit 整数演算をすると、
 * Java や C と同じ「足し算のオーバーフロー」バグが起きる。
 * ここでは `| 0` で 32bit 演算を明示的に再現する。
 */
export const INT32_MAX = 2 ** 31 - 1;

/** 危険: lo + hi が 2^31 を超えると負の数に化ける。 */
export function midNaive(lo: number, hi: number): number {
  return ((lo + hi) | 0) >> 1;
}

/** 安全: 前提 0 <= lo <= hi のもとで、hi - lo も結果もはみ出さない。 */
export function midSafe(lo: number, hi: number): number {
  return (lo + ((hi - lo) >> 1)) | 0;
}
