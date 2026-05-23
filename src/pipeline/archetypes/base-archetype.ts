// ============================================================
// FILE: src/pipeline/archetypes/base-archetype.ts
// PURPOSE: Abstract base class for all behavioral archetypes
// ============================================================

import type {
  ArchetypeName,
  DomainCategory,
  DomainContext,
  FlowGraph,
  FlowNode,
  FlowEdge,
  Finding,
  FindingCategory,
  Severity,
} from '../../shared/types.js';
import { makeId } from '../../shared/utils.js';

export interface ArchetypeQuestion {
  question: string;
  archetype: ArchetypeName;
  domain: DomainCategory;
}

export abstract class BaseArchetype {
  abstract readonly name: ArchetypeName;
  abstract readonly coreBehavior: string;

  abstract getQuestions(domain: DomainCategory): ArchetypeQuestion[];

  evaluate(graph: FlowGraph, domain: DomainContext): Finding[] {
    const findings: Finding[] = [];

    for (const node of graph.nodes) {
      findings.push(...this.evaluateNode(node, { domain, graph }));
    }

    for (const edge of graph.edges) {
      const from = graph.nodes.find((n) => n.id === edge.from);
      const to = graph.nodes.find((n) => n.id === edge.to);
      if (from && to) {
        findings.push(...this.evaluateEdge(edge, from, to, { domain, graph }));
      }
    }

    findings.push(...this.evaluateFlow(graph, { domain }));

    return findings;
  }

  protected abstract evaluateNode(
    node: FlowNode,
    context: { domain: DomainContext; graph: FlowGraph },
  ): Finding[];

  protected abstract evaluateEdge(
    edge: FlowEdge,
    from: FlowNode,
    to: FlowNode,
    context: { domain: DomainContext; graph: FlowGraph },
  ): Finding[];

  protected abstract evaluateFlow(graph: FlowGraph, context: { domain: DomainContext }): Finding[];

  protected makeFinding(
    node: FlowNode,
    severity: Severity,
    category: FindingCategory,
    title: string,
    description: string,
    whyItMatters: string,
    suggestion: string,
  ): Finding {
    return {
      id: makeId(this.name, node.componentName, category),
      severity,
      category,
      title,
      description,
      whyItMatters,
      affectedComponents: [node.componentName],
      codeLocation: {
        filePath: node.filePath,
        line: 0,
        componentName: node.componentName,
      },
      suggestion,
    };
  }
}
