type PgErrorLike = { code?: string; constraint_name?: string };

/** Mencari galat Postgres, termasuk yang dibungkus (cause) oleh Drizzle. */
function findPgError(error: unknown): PgErrorLike | null {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    const candidate = current as PgErrorLike & { cause?: unknown };
    if (typeof candidate.code === "string" && /^[0-9A-Z]{5}$/.test(candidate.code)) {
      return candidate;
    }
    current = candidate.cause;
  }
  return null;
}

/** True jika galat adalah pelanggaran unique pada constraint tertentu. */
export function isUniqueViolation(error: unknown, constraint: string) {
  const pgError = findPgError(error);
  return pgError?.code === "23505" && pgError.constraint_name === constraint;
}
