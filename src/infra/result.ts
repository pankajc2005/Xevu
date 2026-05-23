// ============================================================
// FILE: src/infra/result.ts
// PURPOSE: Result<T, E> monad for fail-soft pipeline stages.
//
// AI IDE GUIDANCE:
// Every pipeline stage returns Result<T, E> instead of throwing.
// Use ok() for success, err() for failure with optional partial data.
// This ensures no single stage can crash the entire pipeline.
// ============================================================

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E; partial?: Partial<T> };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E, partial?: unknown): Result<never, E> {
  return partial !== undefined
    ? { ok: false, error, partial: partial as Partial<never> }
    : { ok: false, error };
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMsg?: string,
): Promise<Result<T, Error>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    if (errorMsg) error.message = `${errorMsg}: ${error.message}`;
    return err(error);
  }
}
