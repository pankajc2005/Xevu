// ============================================================
// FILE: src/shared/utils.ts
// PURPOSE: Pure utility functions used across modules.
//
// AI IDE GUIDANCE:
// All functions here must be pure (no side effects, no I/O).
// If you need I/O, put it in infra/. If it's domain-specific,
// put it in the relevant pipeline module.
// ============================================================

import { basename, extname } from 'path';
import type { FileType } from './types.js';

/**
 * Classify a file by its path and name into a FileType category.
 */
export function classifyFile(relativePath: string): FileType {
  const base = basename(relativePath, extname(relativePath)).toLowerCase();
  const dir = relativePath.toLowerCase();

  if (
    dir.includes('__tests__') ||
    dir.includes('.test.') ||
    dir.includes('.spec.')
  )
    return 'test';
  if (dir.includes('.stories.')) return 'test';
  if (extname(relativePath).match(/\.(css|scss|less|sass|styl)$/))
    return 'style';
  if (
    base.match(
      /^(tailwind|postcss|vite|webpack|babel|jest|vitest|tsconfig|eslint|prettier)/,
    )
  )
    return 'config';

  // React-specific classifications
  if (dir.includes('/pages/') || (dir.includes('/app/') && base !== 'layout'))
    return 'page';
  if (base === 'layout' || base.includes('layout')) return 'layout';
  if (base.startsWith('use') || dir.includes('/hooks/')) return 'hook';
  if (
    dir.includes('/utils/') ||
    dir.includes('/lib/') ||
    dir.includes('/helpers/')
  )
    return 'util';
  if (
    dir.includes('/components/') ||
    extname(relativePath).match(/\.(tsx|jsx)$/)
  )
    return 'component';

  return 'unknown';
}

/**
 * Normalize a file path to forward slashes (cross-platform).
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Check if a string is PascalCase (likely a React component name).
 */
export function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Generate a stable kebab-case ID from parts.
 */
export function makeId(...parts: string[]): string {
  return parts
    .map((p) => p.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    .join('--');
}

/**
 * Levenshtein distance for fuzzy string matching.
 */
export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}
