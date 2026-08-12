import { isPgUniqueViolation } from "@/lib/db-errors";

// The neon-http driver used in this project doesn't support db.transaction(),
// so sequential codes ("2026-STD-014", "2026-TCH-007") can't be reserved with
// a single atomic statement. Instead: read the current max, try to insert
// with the next number, and if two requests raced and collided on the same
// number (unique constraint violation), re-read and retry. Whoever's insert
// actually lands first keeps the lower number — the loser just gets bumped
// to the next one and retries, so numbers stay gapless and race-safe.
export async function withSequentialCode<T>(
  getNextCode: () => Promise<string>,
  attemptInsert: (code: string) => Promise<T>,
  maxAttempts = 5
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = await getNextCode();
    try {
      return await attemptInsert(code);
    } catch (err) {
      if (!isPgUniqueViolation(err)) throw err;
      lastError = err;
      // another request just took this code — loop around and try the next one
    }
  }

  throw lastError;
}

// Extracts the numeric sequence from codes like "2026-STD-014" -> 14.
export function nextSequenceNumber(existingCodes: (string | null)[], year: number, infix: string): number {
  const prefix = `${year}-${infix}-`;
  let max = 0;
  for (const code of existingCodes) {
    if (!code || !code.startsWith(prefix)) continue;
    const n = Number(code.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

export function formatSequentialCode(year: number, infix: string, seq: number): string {
  return `${year}-${infix}-${String(seq).padStart(3, "0")}`;
}
