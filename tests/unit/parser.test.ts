import { describe, it, expect } from 'vitest';
import { scanProject } from '../../src/pipeline/scanner/file-scanner.js';
import { parseProject } from '../../src/pipeline/parser/ast-parser.js';
import { resolve } from 'path';

describe('AST Parser', () => {
  const fixtureRoot = resolve(__dirname, '../fixtures/ecommerce-app');

  it('extracts components from a React project', async () => {
    const scanResult = await scanProject(fixtureRoot);
    expect(scanResult.ok).toBe(true);
    if (!scanResult.ok) return;

    const parseResult = await parseProject(scanResult.value);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const { components, routes, texts } = parseResult.value;
    expect(components.length).toBeGreaterThanOrEqual(4);
    expect(routes.length).toBeGreaterThanOrEqual(4);
    expect(texts.length).toBeGreaterThan(0);
  });

  it('detects hooks in components', async () => {
    const scanResult = await scanProject(fixtureRoot);
    if (!scanResult.ok) return;
    const parseResult = await parseProject(scanResult.value);
    if (!parseResult.ok) return;

    const home = parseResult.value.components.find((c) => c.name === 'Home');
    expect(home).toBeDefined();
    expect(home!.hooks).toContain('useState');
    expect(home!.stateVariables).toContain('search');
  });

  it('extracts user-visible text', async () => {
    const scanResult = await scanProject(fixtureRoot);
    if (!scanResult.ok) return;
    const parseResult = await parseProject(scanResult.value);
    if (!parseResult.ok) return;

    const textValues = parseResult.value.texts.map((t) => t.value);
    expect(textValues).toContain('Welcome to our store');
  });
});
