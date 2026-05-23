// ============================================================
// FILE: src/pipeline/parser/route-extractor.ts
// PURPOSE: Extract route definitions from React Router usage
// ============================================================

import traverseModule from '@babel/traverse';
import type { File as ASTFile } from '@babel/types';
import type { RouteNode } from '../../shared/types.js';

const traverse: any = (traverseModule as any).default ?? traverseModule;

export function extractRoutes(ast: ASTFile, filePath: string): RouteNode[] {
  const routes: RouteNode[] = [];

  traverse(ast, {
    JSXOpeningElement(path: any) {
      const nameNode = path.node.name;
      if (nameNode.type !== 'JSXIdentifier' || nameNode.name !== 'Route') return;

      const attrs = path.node.attributes;
      let routePath = '';
      let componentName = '';
      let isIndex = false;

      for (const attr of attrs) {
        if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') continue;

        if (attr.name.name === 'path' && attr.value?.type === 'StringLiteral') {
          routePath = attr.value.value;
        }
        if (attr.name.name === 'index') {
          isIndex = true;
        }
        if (attr.name.name === 'element' && attr.value?.type === 'JSXExpressionContainer') {
          const expr = attr.value.expression;
          if (expr.type === 'JSXElement' && expr.openingElement.name.type === 'JSXIdentifier') {
            componentName = expr.openingElement.name.name;
          }
        }
        if (attr.name.name === 'component' && attr.value?.type === 'JSXExpressionContainer') {
          const expr = attr.value.expression;
          if (expr.type === 'Identifier') {
            componentName = expr.name;
          }
        }
      }

      if (routePath || isIndex) {
        routes.push({
          path: routePath || '/',
          componentName,
          filePath,
          guards: [],
          children: [],
          isIndex,
          isLayout: false,
          isDynamic: routePath.includes(':') || routePath.includes('*'),
        });
      }
    },

    CallExpression(path: any) {
      const callee = path.node.callee;
      if (callee.type !== 'Identifier') return;
      if (!['createBrowserRouter', 'createHashRouter', 'createMemoryRouter'].includes(callee.name))
        return;

      const firstArg = path.node.arguments[0];
      if (firstArg?.type !== 'ArrayExpression') return;

      const objectRoutes = extractRoutesFromArray(firstArg.elements, filePath);
      routes.push(...objectRoutes);
    },
  });

  return routes;
}

function extractRoutesFromArray(elements: any[], filePath: string): RouteNode[] {
  const routes: RouteNode[] = [];

  for (const el of elements) {
    if (!el || el.type !== 'ObjectExpression') continue;

    let routePath = '';
    let componentName = '';
    let isIndex = false;
    let children: RouteNode[] = [];

    for (const prop of el.properties) {
      if (prop.type !== 'ObjectProperty' || prop.key.type !== 'Identifier') continue;

      if (prop.key.name === 'path' && prop.value.type === 'StringLiteral') {
        routePath = prop.value.value;
      }
      if (prop.key.name === 'index' && prop.value.type === 'BooleanLiteral') {
        isIndex = prop.value.value;
      }
      if (prop.key.name === 'element' && prop.value.type === 'JSXElement') {
        const opening = prop.value.openingElement;
        if (opening.name.type === 'JSXIdentifier') {
          componentName = opening.name.name;
        }
      }
      if (prop.key.name === 'children' && prop.value.type === 'ArrayExpression') {
        children = extractRoutesFromArray(prop.value.elements, filePath);
      }
    }

    if (routePath || isIndex) {
      routes.push({
        path: routePath || '/',
        componentName,
        filePath,
        guards: [],
        children,
        isIndex,
        isLayout: componentName.toLowerCase().includes('layout'),
        isDynamic: routePath.includes(':') || routePath.includes('*'),
      });
    }
  }

  return routes;
}
