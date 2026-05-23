// ============================================================
// FILE: src/pipeline/parser/text-extractor.ts
// PURPOSE: Extract user-visible text from JSX
// ============================================================

import traverseModule from '@babel/traverse';
import type { File as ASTFile } from '@babel/types';
import type { ExtractedText } from '../../shared/types.js';

const traverse: any = (traverseModule as any).default ?? traverseModule;

const UI_PROPS = new Set([
  'label',
  'placeholder',
  'title',
  'alt',
  'aria-label',
  'description',
  'helperText',
  'errorText',
  'tooltip',
  'buttonText',
  'submitText',
  'cancelText',
  'confirmText',
  'heading',
  'subheading',
  'caption',
]);

export function extractTexts(ast: ASTFile, filePath: string): ExtractedText[] {
  const texts: ExtractedText[] = [];

  traverse(ast, {
    JSXText(path: any) {
      const value = path.node.value.trim();
      if (value && value.length > 1 && !looksLikeCode(value)) {
        texts.push({
          value,
          source: 'jsx-text',
          line: path.node.loc?.start.line ?? 0,
        });
      }
    },

    JSXAttribute(path: any) {
      const nameNode = path.node.name;
      if (nameNode.type !== 'JSXIdentifier') return;
      const propName = nameNode.name;

      if (!UI_PROPS.has(propName)) return;

      if (path.node.value?.type === 'StringLiteral') {
        const value = path.node.value.value.trim();
        if (value) {
          texts.push({
            value,
            source: 'prop',
            propName,
            line: path.node.loc?.start.line ?? 0,
          });
        }
      }
    },

    JSXExpressionContainer(path: any) {
      const expr = path.node.expression;
      if (expr.type === 'StringLiteral' && expr.value.trim().length > 1) {
        texts.push({
          value: expr.value.trim(),
          source: 'expression',
          line: path.node.loc?.start.line ?? 0,
        });
      }
    },
  });

  return texts;
}

function looksLikeCode(text: string): boolean {
  return /^[{}\[\]()=><;]/.test(text) || /^[a-z]+[A-Z]/.test(text);
}
