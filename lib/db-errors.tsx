// Postgres error shape isn't typed by node-postgres/Neon, so we narrow it
// with a type guard instead of reaching for `any`.
type PgError = { code: string };

function isPgError(err: unknown): err is PgError {
  return typeof err === "object" && err !== null && "code" in err && typeof (err as PgError).code === "string";
}

export function isPgUniqueViolation(err: unknown): boolean {
  return isPgError(err) && err.code === "23505";
}