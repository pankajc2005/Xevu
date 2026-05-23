// ============================================================
// FILE: src/pipeline/parser/ast-parser.ts
// PURPOSE: Orchestrate AST parsing of all scanned files
// ============================================================

import { parse, type ParserOptions } from '@babel/parser';
import type { File as ASTFile } from '@babel/types';
import { Result, ok, err } from '../../infra/result.js';
import { ParseFileError } from '../../infra/errors.js';
import { logger } from '../../infra/logger.js';
import { FileCache } from '../../infra/cache.js';
import type { ScannedProject, ParsedProject, ParseError, ComponentNode, RouteNode, HookUsage, ExtractedText, ImportEdge } from '../../shared/types.js';
import { extractComponents } from './component-extractor.js';
import { extractRoutes } from './route-extractor.js';
import { extractTexts } from './text-extractor.js';
import { extractImports } from './import-extractor.js';
import { extractHooks } from './hook-analyzer.js';

const PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module',
  errorRecovery: true,
  plugins: [
    'jsx',
    'typescript',
    'classProperties',
    'decorators-legacy',
    'optionalChaining',
    'nullishCoalescingOperator',
    'dynamicImport',
    'exportDefaultFrom',
    'importAttributes',
  ],
};

const astCache = new FileCache<ASTFile>();

export async function parseProject(project: ScannedProject): Promise<Result<ParsedProject, Error>> {
  logger.info('Starting AST parsing', { fileCount: project.files.length });

  const allComponents: ComponentNode[] = [];
  const allRoutes: RouteNode[] = [];
  const allHooks: HookUsage[] = [];
  const allTexts: ExtractedText[] = [];
  const allImports: ImportEdge[] = [];
  const errors: ParseError[] = [];

  // Only parse component, page, layout, and hook files
  const filesToParse = project.files.filter((f) =>
    ['component', 'page', 'layout', 'hook', 'unknown'].includes(f.type)
  );

  for (const file of filesToParse) {
    try {
      const ast = await astCache.getOrCompute(file.absolutePath, (content) => {
        return parse(content, PARSER_OPTIONS);
      });

      // Extract all data from this file's AST
      const components = extractComponents(ast, file.absolutePath);
      const routes = extractRoutes(ast, file.absolutePath);
      const texts = extractTexts(ast, file.absolutePath);
      const imports = extractImports(ast, file.absolutePath);
      const hooks = extractHooks(ast, file.absolutePath, components);

      allComponents.push(...components);
      allRoutes.push(...routes);
      allTexts.push(...texts);
      allImports.push(...imports);
      allHooks.push(...hooks);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn('Failed to parse file', { file: file.relativePath, error: msg });
      errors.push({ filePath: file.relativePath, message: msg });
    }
  }

  logger.info('Parsing complete', {
    components: allComponents.length,
    routes: allRoutes.length,
    texts: allTexts.length,
    errors: errors.length,
  });

  return ok({
    components: allComponents,
    routes: allRoutes,
    hooks: allHooks,
    texts: allTexts,
    imports: allImports,
    errors,
  });
}
