// ============================================================
// FILE: src/infra/config.ts
// PURPOSE: Analysis configuration with safe defaults.
//
// AI IDE GUIDANCE:
// These limits prevent runaway analysis on huge codebases.
// Adjust maxFiles and maxFileSizeBytes if users report truncated results.
// ============================================================

export interface XevuConfig {
  maxFiles: number;
  maxFileSizeBytes: number;
  parseTimeoutMs: number;
  totalTimeoutMs: number;
  maxAstDepth: number;
  ignoredPatterns: string[];
}

export const DEFAULT_CONFIG: XevuConfig = {
  maxFiles: 500,
  maxFileSizeBytes: 50 * 1024, // 50KB
  parseTimeoutMs: 5000,
  totalTimeoutMs: 60000,
  maxAstDepth: 50,
  ignoredPatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/coverage/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/*.stories.{ts,tsx,js,jsx}',
    '**/__tests__/**',
    '**/__mocks__/**',
    '**/*.d.ts',
    '**/*.config.{ts,js,mjs,cjs}',
  ],
};
