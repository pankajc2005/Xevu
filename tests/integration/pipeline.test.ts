import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { scanProject } from '../../src/pipeline/scanner/file-scanner.js';
import { parseProject } from '../../src/pipeline/parser/ast-parser.js';
import { detectDomain } from '../../src/pipeline/domain/domain-detector.js';
import { traceFlow } from '../../src/pipeline/flow/flow-tracer.js';
import { runArchetypes } from '../../src/pipeline/archetypes/archetype-engine.js';
import { buildReport } from '../../src/pipeline/report/report-builder.js';

describe('Full Pipeline Integration', () => {
  it('runs the complete pipeline on an ecommerce fixture', async () => {
    const root = resolve(__dirname, '../fixtures/ecommerce-app');
    const startTime = Date.now();

    const scan = await scanProject(root);
    expect(scan.ok).toBe(true);
    if (!scan.ok) return;

    const parsed = await parseProject(scan.value);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const domain = detectDomain(scan.value, parsed.value);
    expect(domain.ok).toBe(true);
    if (!domain.ok) return;
    expect(domain.value.primary).toBe('ecommerce');

    const flow = traceFlow(parsed.value, 'checkout');
    expect(flow.ok).toBe(true);
    if (!flow.ok) return;

    const archetypes = runArchetypes(flow.value, domain.value);
    expect(archetypes.length).toBe(5);

    const report = buildReport({
      domain: domain.value,
      flow: flow.value,
      archetypes,
      warnings: [],
      filesScanned: scan.value.files.length,
      filesSkipped: parsed.value.errors.length,
      startTime,
    });

    expect(report.status).toBe('success');
    expect(report.domain.primary).toBe('ecommerce');
    expect(report.summary).toBeTruthy();
    expect(report.metadata.analysisTimeMs).toBeGreaterThan(0);
  });
});
