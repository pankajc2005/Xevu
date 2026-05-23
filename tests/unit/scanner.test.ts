import { describe, it, expect } from 'vitest';
import { scanProject } from '../../src/pipeline/scanner/file-scanner.js';
import { resolve } from 'path';

describe('File Scanner', () => {
  const fixtureRoot = resolve(__dirname, '../fixtures/minimal-app');

  it('scans a minimal React project', async () => {
    const result = await scanProject(fixtureRoot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.files.length).toBeGreaterThan(0);
    expect(result.value.packageJson.name).toBe('minimal-test-app');
  });

  it('returns error for non-existent path', async () => {
    const result = await scanProject('/does/not/exist');
    expect(result.ok).toBe(false);
  });
});
