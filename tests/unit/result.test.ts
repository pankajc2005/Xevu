import { describe, it, expect } from 'vitest';
import { ok, err, unwrapOr, tryCatch } from '../../src/infra/result.js';

describe('Result monad', () => {
  it('ok wraps a value', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it('err wraps an error', () => {
    const r = err(new Error('fail'));
    expect(r.ok).toBe(false);
  });

  it('unwrapOr returns value on ok', () => {
    expect(unwrapOr(ok(42), 0)).toBe(42);
  });

  it('unwrapOr returns fallback on err', () => {
    expect(unwrapOr(err(new Error('fail')), 0)).toBe(0);
  });

  it('tryCatch catches thrown errors', async () => {
    const r = await tryCatch(async () => {
      throw new Error('boom');
    });
    expect(r.ok).toBe(false);
  });

  it('tryCatch returns ok on success', async () => {
    const r = await tryCatch(async () => 'hello');
    expect(r.ok).toBe(true);
  });
});
