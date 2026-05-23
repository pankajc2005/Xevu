// ============================================================
// FILE: src/pipeline/parser/hook-analyzer.ts
// PURPOSE: Extract and classify React hook usage
// ============================================================

import traverseModule from '@babel/traverse';
import type { File as ASTFile } from '@babel/types';
import type { HookUsage, ComponentNode } from '../../shared/types.js';

const traverse: any = (traverseModule as any).default ?? traverseModule;

export function extractHooks(
  ast: ASTFile,
  filePath: string,
  components: ComponentNode[],
): HookUsage[] {
  const hooks: HookUsage[] = [];
  const componentNames = new Set(components.map((c) => c.name));

  traverse(ast, {
    CallExpression(path: any) {
      const callee = path.node.callee;
      if (callee.type !== 'Identifier' || !callee.name.startsWith('use')) return;

      let componentName = 'unknown';
      let current = path.parentPath;
      while (current) {
        if (current.node.type === 'FunctionDeclaration' && current.node.id) {
          componentName = current.node.id.name;
          break;
        }
        if (current.node.type === 'VariableDeclarator' && current.node.id.type === 'Identifier') {
          componentName = current.node.id.name;
          break;
        }
        current = current.parentPath;
      }

      if (!componentNames.has(componentName) && componentName !== 'unknown') {
        // keep inferred name even if not pre-collected in component scan
      }

      hooks.push({
        name: callee.name,
        componentName,
        filePath,
        arguments: path.node.arguments.map((arg: any) => {
          if (arg.type === 'StringLiteral') return arg.value;
          if (arg.type === 'Identifier') return arg.name;
          return '...';
        }),
      });
    },
  });

  return hooks;
}
