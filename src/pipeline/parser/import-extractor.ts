// ============================================================
// FILE: src/pipeline/parser/import-extractor.ts
// PURPOSE: Extract import declarations to build a dependency graph
// ============================================================

import traverseModule from '@babel/traverse';
import type { File as ASTFile } from '@babel/types';
import type { ImportEdge } from '../../shared/types.js';

const traverse: any = (traverseModule as any).default ?? traverseModule;

export function extractImports(ast: ASTFile, filePath: string): ImportEdge[] {
  const imports: ImportEdge[] = [];

  traverse(ast, {
    ImportDeclaration(path: any) {
      const source = path.node.source.value;
      if (!source.startsWith('.') && !source.startsWith('/')) return;

      const importedNames = path.node.specifiers.map((spec: any) => {
        if (spec.type === 'ImportDefaultSpecifier') return 'default';
        if (spec.type === 'ImportNamespaceSpecifier') return '*';
        if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
          return spec.imported.name;
        }
        return 'unknown';
      });

      imports.push({
        fromFile: filePath,
        toFile: source,
        importedNames,
      });
    },
  });

  return imports;
}
