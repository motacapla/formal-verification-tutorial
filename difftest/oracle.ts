/**
 * Lean のオラクル実行ファイル（lean/Main.lean）を子プロセスとして起動し、
 * JSON Lines で 1 リクエストずつ問い合わせるクライアント。
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

export type Req =
  | { fn: "sum"; args: [number] }
  | { fn: "reverse" | "sort"; args: [number[]] }
  | { fn: "midNaive" | "midSafe"; args: [number, number] }
  | { fn: string; args: unknown[] };

export type Resp = { ok: unknown } | { error: string };

type Waiter = { resolve: (r: Resp) => void; reject: (e: Error) => void };

const ORACLE_BIN = fileURLToPath(new URL("../lean/.lake/build/bin/oracle", import.meta.url));

export class Oracle {
  private proc: ChildProcess;
  private waiting: Waiter[] = [];
  /** プロセスが使えなくなった理由。以後の問い合わせはすべてこれで reject する。 */
  private dead: Error | null = null;

  constructor(bin: string = ORACLE_BIN) {
    // stderr はそのまま表示する（Lean のスタックオーバーフロー等のメッセージが見えるように）
    this.proc = spawn(bin, [], { stdio: ["pipe", "pipe", "inherit"] });
    this.proc.on("error", (e) =>
      this.fail(new Error(`Lean オラクルを起動できません (${bin})。先に npm run lean:build を実行してください: ${e.message}`)),
    );
    this.proc.on("exit", (code, signal) =>
      this.fail(new Error(`Lean オラクルが終了しました (code=${code}, signal=${signal})`)),
    );
    this.proc.stdin!.on("error", () => {}); // EPIPE は exit 側で扱う
    createInterface({ input: this.proc.stdout! }).on("line", (line) => {
      const w = this.waiting.shift();
      if (!w) return;
      try {
        w.resolve(JSON.parse(line) as Resp);
      } catch {
        w.reject(new Error(`Lean オラクルの出力が JSON ではありません: ${line}`));
      }
    });
  }

  private fail(err: Error): void {
    this.dead ??= err;
    for (const w of this.waiting.splice(0)) w.reject(this.dead);
  }

  /** 生の 1 行を送り、1 行の応答を JSON として返す。 */
  queryRaw(line: string): Promise<Resp> {
    return new Promise((resolve, reject) => {
      if (this.dead) return reject(this.dead);
      this.waiting.push({ resolve, reject });
      this.proc.stdin!.write(line + "\n");
    });
  }

  query(req: Req): Promise<Resp> {
    return this.queryRaw(JSON.stringify(req));
  }

  close(): void {
    this.proc.stdin!.end();
  }
}
