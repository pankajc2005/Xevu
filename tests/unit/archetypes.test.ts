import { describe, it, expect } from 'vitest';
import { scanProject } from '../../src/pipeline/scanner/file-scanner.js';
import { parseProject } from '../../src/pipeline/parser/ast-parser.js';
import { detectDomain } from '../../src/pipeline/domain/domain-detector.js';
import { traceFlow } from '../../src/pipeline/flow/flow-tracer.js';
import { runArchetypes } from '../../src/pipeline/archetypes/archetype-engine.js';
import { resolve } from 'path';

describe('Archetype Engine', () => {
  const root = resolve(__dirname, '../fixtures/ecommerce-app');

  it('runs all 5 archetypes against a checkout flow', async () => {
    const scan = await scanProject(root);
    if (!scan.ok) throw new Error('Scan failed');
    const parsed = await parseProject(scan.value);
    if (!parsed.ok) throw new Error('Parse failed');
    const domain = detectDomain(scan.value, parsed.value);
    if (!domain.ok) throw new Error('Domain detection failed');
    const flow = traceFlow(parsed.value, 'checkout');
    if (!flow.ok) throw new Error('Flow tracing failed');

    const results = runArchetypes(flow.value, domain.value);

    expect(results.length).toBe(5);
    expect(results.map((r) => r.archetype)).toContain('first-timer');
    expect(results.map((r) => r.archetype)).toContain('goal-getter');
    expect(results.map((r) => r.archetype)).toContain('skeptic');
    expect(results.map((r) => r.archetype)).toContain('returning-user');
    expect(results.map((r) => r.archetype)).toContain('rusher');

    for (const result of results) {
      expect(result.findings.length).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it('can run a specific archetype subset', async () => {
    const scan = await scanProject(root);
    if (!scan.ok) throw new Error('Scan failed');
    const parsed = await parseProject(scan.value);
    if (!parsed.ok) throw new Error('Parse failed');
    const domain = detectDomain(scan.value, parsed.value);
    if (!domain.ok) throw new Error('Domain detection failed');
    const flow = traceFlow(parsed.value);
    if (!flow.ok) throw new Error('Flow tracing failed');

    const results = runArchetypes(flow.value, domain.value, ['rusher']);

    expect(results.length).toBe(1);
    expect(results[0].archetype).toBe('rusher');
  });
});
