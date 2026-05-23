import { describe, it, expect } from 'vitest';
import { scanProject } from '../../src/pipeline/scanner/file-scanner.js';
import { parseProject } from '../../src/pipeline/parser/ast-parser.js';
import { traceFlow } from '../../src/pipeline/flow/flow-tracer.js';
import { resolve } from 'path';

describe('Flow Tracer', () => {
  const root = resolve(__dirname, '../fixtures/ecommerce-app');

  it('traces a checkout flow', async () => {
    const scan = await scanProject(root);
    if (!scan.ok) throw new Error('Scan failed');
    const parsed = await parseProject(scan.value);
    if (!parsed.ok) throw new Error('Parse failed');

    const flow = traceFlow(parsed.value, 'checkout');
    expect(flow.ok).toBe(true);
    if (!flow.ok) return;
    expect(flow.value.nodes.length).toBeGreaterThan(0);
    expect(flow.value.name).toBe('checkout');
  });

  it('traces all routes when no target specified', async () => {
    const scan = await scanProject(root);
    if (!scan.ok) throw new Error('Scan failed');
    const parsed = await parseProject(scan.value);
    if (!parsed.ok) throw new Error('Parse failed');

    const flow = traceFlow(parsed.value);
    expect(flow.ok).toBe(true);
    if (!flow.ok) return;
    expect(flow.value.nodes.length).toBeGreaterThanOrEqual(4);
  });
});
