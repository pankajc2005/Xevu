// ============================================================
// FILE: src/infra/cache.ts
// PURPOSE: In-memory LRU cache with content-hash invalidation.
//
// AI IDE GUIDANCE:
// Used to avoid re-parsing files that haven't changed.
// The cache is keyed by file path and invalidated when
// the file's MD5 hash changes.
// ============================================================

import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

export class FileCache<T> {
  private hashes = new Map<string, string>();
  private entries = new Map<string, T>();
  private readonly maxSize: number;

  constructor(maxSize: number = 500) {
    this.maxSize = maxSize;
  }

  async getOrCompute(
    filePath: string,
    compute: (content: string) => T,
  ): Promise<T> {
    const content = await readFile(filePath, 'utf-8');
    const hash = createHash('md5').update(content).digest('hex');

    if (this.hashes.get(filePath) === hash && this.entries.has(filePath)) {
      return this.entries.get(filePath)!;
    }

    const result = compute(content);

    // Evict oldest if at capacity
    if (this.entries.size >= this.maxSize) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) {
        this.entries.delete(oldest);
        this.hashes.delete(oldest);
      }
    }

    this.hashes.set(filePath, hash);
    this.entries.set(filePath, result);
    return result;
  }

  invalidate(filePath: string): void {
    this.hashes.delete(filePath);
    this.entries.delete(filePath);
  }

  invalidateAll(): void {
    this.hashes.clear();
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
