// ============================================================
// FILE: src/pipeline/flow/component-graph.ts
// PURPOSE: Build a graph of component render relationships
// ============================================================

import type { ComponentNode, ImportEdge } from '../../shared/types.js';

export interface ComponentGraphNode {
  name: string;
  filePath: string;
  renderedBy: string[];
  renders: string[];
}

export function buildComponentGraph(
  components: ComponentNode[],
  imports: ImportEdge[],
): Map<string, ComponentGraphNode> {
  const graph = new Map<string, ComponentGraphNode>();

  for (const comp of components) {
    graph.set(comp.name, {
      name: comp.name,
      filePath: comp.filePath,
      renderedBy: [],
      renders: [...comp.children],
    });
  }

  for (const comp of components) {
    for (const childName of comp.children) {
      const child = graph.get(childName);
      if (child && !child.renderedBy.includes(comp.name)) {
        child.renderedBy.push(comp.name);
      }
    }
  }

  return graph;
}
