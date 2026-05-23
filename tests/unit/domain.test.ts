import { describe, it, expect } from 'vitest';
import { scanProject } from '../../src/pipeline/scanner/file-scanner.js';
import { parseProject } from '../../src/pipeline/parser/ast-parser.js';
import { detectDomain } from '../../src/pipeline/domain/domain-detector.js';
import { extractComponentSignals } from '../../src/pipeline/domain/signals/component-signals.js';
import { resolve } from 'path';

describe('Domain Detection', () => {
  it('detects ecommerce domain from fixture project', async () => {
    const root = resolve(__dirname, '../fixtures/ecommerce-app');
    const scan = await scanProject(root);
    if (!scan.ok) throw new Error('Scan failed');

    const parsed = await parseProject(scan.value);
    if (!parsed.ok) throw new Error('Parse failed');

    const domain = detectDomain(scan.value, parsed.value);
    if (!domain.ok) throw new Error('Domain detection failed');

    expect(domain.value.primary).toBe('ecommerce');
    expect(domain.value.confidence).toBeGreaterThan(0.3);
    expect(domain.value.signals.length).toBeGreaterThan(0);
  });

  it('does not treat App as a healthcare-specific component', () => {
    const signals = extractComponentSignals([
      {
        name: 'App',
        filePath: 'src/App.tsx',
        type: 'function',
        props: [],
        children: [],
        hooks: [],
        stateVariables: [],
        eventHandlers: [],
        conditionalRenders: [],
        texts: [],
        loc: { start: 1, end: 1 },
      },
    ]);

    expect(signals.some((signal) => signal.category === 'healthcare')).toBe(false);
  });
});
