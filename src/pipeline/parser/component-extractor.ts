// ============================================================
// FILE: src/pipeline/parser/component-extractor.ts
// PURPOSE: Extract React component definitions from a single file's AST
// ============================================================

import traverseModule from '@babel/traverse';
import type { File as ASTFile, Node } from '@babel/types';
import { isPascalCase } from '../../shared/utils.js';
import type { ComponentNode, ConditionalRender } from '../../shared/types.js';

const traverse: any = (traverseModule as any).default ?? traverseModule;

export function extractComponents(ast: ASTFile, filePath: string): ComponentNode[] {
  const components: ComponentNode[] = [];

  traverse(ast, {
    VariableDeclarator(path: any) {
      if (path.node.id.type !== 'Identifier') return;
      const name = path.node.id.name;
      if (!isPascalCase(name)) return;

      const init = path.node.init;
      if (!init) return;

      let type: ComponentNode['type'] = 'function';
      let funcNode = init;

      if (init.type === 'CallExpression') {
        const callee = init.callee;
        if (callee.type === 'MemberExpression' &&
            callee.object.type === 'Identifier' && callee.object.name === 'React') {
          if (callee.property.type === 'Identifier') {
            if (callee.property.name === 'memo') type = 'memo';
            if (callee.property.name === 'forwardRef') type = 'forwardRef';
          }
          funcNode = init.arguments[0] ?? init;
        } else if (callee.type === 'Identifier') {
          if (callee.name === 'memo') type = 'memo';
          if (callee.name === 'forwardRef') type = 'forwardRef';
          funcNode = init.arguments[0] ?? init;
        }
      }

      if (funcNode.type !== 'ArrowFunctionExpression' && funcNode.type !== 'FunctionExpression') return;
      if (!containsJSX(funcNode)) return;

      components.push(buildComponentNode(name, filePath, type, funcNode));
    },

    FunctionDeclaration(path: any) {
      if (!path.node.id) return;
      const name = path.node.id.name;
      if (!isPascalCase(name)) return;
      if (!containsJSX(path.node)) return;

      components.push(buildComponentNode(name, filePath, 'function', path.node));
    },

    ClassDeclaration(path: any) {
      if (!path.node.id) return;
      const name = path.node.id.name;
      const superClass = path.node.superClass;

      let isComponent = false;
      if (superClass?.type === 'Identifier' && ['Component', 'PureComponent'].includes(superClass.name)) {
        isComponent = true;
      }
      if (superClass?.type === 'MemberExpression' &&
          superClass.object.type === 'Identifier' && superClass.object.name === 'React') {
        isComponent = true;
      }

      if (!isComponent) return;
      components.push(buildComponentNode(name, filePath, 'class', path.node));
    },

    ExportDefaultDeclaration(path: any) {
      const decl = path.node.declaration;
      if (decl.type === 'FunctionDeclaration' && !decl.id && containsJSX(decl)) {
        components.push(buildComponentNode('DefaultExport', filePath, 'function', decl));
      }
    },
  });

  return components;
}

function buildComponentNode(
  name: string,
  filePath: string,
  type: ComponentNode['type'],
  node: Node
): ComponentNode {
  const hooks: string[] = [];
  const stateVariables: string[] = [];
  const eventHandlers: string[] = [];
  const children: string[] = [];
  const conditionalRenders: ConditionalRender[] = [];

  traverse(node as any, {
    noScope: true,

    CallExpression(path: any) {
      const callee = path.node.callee;
      if (callee.type === 'Identifier' && callee.name.startsWith('use')) {
        hooks.push(callee.name);
        if (callee.name === 'useState') {
          const parent = path.parent;
          if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'ArrayPattern') {
            const firstEl = parent.id.elements[0];
            if (firstEl?.type === 'Identifier') {
              stateVariables.push(firstEl.name);
            }
          }
        }
      }
    },

    JSXOpeningElement(path: any) {
      const nameNode = path.node.name;
      if (nameNode.type === 'JSXIdentifier' && isPascalCase(nameNode.name)) {
        if (!children.includes(nameNode.name)) {
          children.push(nameNode.name);
        }
      }
    },

    JSXAttribute(path: any) {
      const attrName = path.node.name;
      if (attrName.type === 'JSXIdentifier' && attrName.name.startsWith('on')) {
        eventHandlers.push(attrName.name);
      }
    },

    ConditionalExpression(path: any) {
      const loc = path.node.loc;
      if (loc) {
        conditionalRenders.push({ condition: 'ternary', line: loc.start.line });
      }
    },

    LogicalExpression(path: any) {
      if (path.node.operator === '&&') {
        const loc = path.node.loc;
        if (loc) {
          conditionalRenders.push({ condition: 'logical-and', line: loc.start.line });
        }
      }
    },
  });

  return {
    name,
    filePath,
    type,
    props: [],
    children,
    hooks,
    stateVariables,
    eventHandlers,
    conditionalRenders,
    texts: [],
    loc: {
      start: (node as any).loc?.start?.line ?? 0,
      end: (node as any).loc?.end?.line ?? 0,
    },
  };
}

function containsJSX(node: Node): boolean {
  let found = false;
  try {
    traverse(node as any, {
      noScope: true,
      JSXElement() { found = true; },
      JSXFragment() { found = true; },
    });
  } catch {
    /* ignore traversal errors */
  }
  return found;
}
