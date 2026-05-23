// ============================================================
// FILE: src/pipeline/archetypes/goal-getter.ts
// PURPOSE: The Goal-Getter — knows what they want, hates extra steps
// ============================================================

import { BaseArchetype, type ArchetypeQuestion } from './base-archetype.js';
import type {
  ArchetypeName, DomainCategory, DomainContext, FlowGraph,
  FlowNode, FlowEdge, Finding,
} from '../../shared/types.js';

export class GoalGetterArchetype extends BaseArchetype {
  readonly name: ArchetypeName = 'goal-getter';
  readonly coreBehavior = 'Knows what they want, hates extra steps';

  getQuestions(domain: DomainCategory): ArchetypeQuestion[] {
    const base = [
      'Can the user reach their goal in the minimum number of steps?',
      'Are there unnecessary intermediate screens or confirmations?',
      'Is the search/filter functionality fast and effective?',
      'Are commonly used actions easily accessible?',
    ];

    const domainSpecific: Partial<Record<DomainCategory, string[]>> = {
      ecommerce: [
        'Can a returning customer re-order quickly?',
        'Is there a direct "Buy Now" path that skips the cart?',
      ],
      saas: [
        'Can the user access their most-used feature within 2 clicks from login?',
        'Are keyboard shortcuts available for power users?',
      ],
    };

    return [...base, ...(domainSpecific[domain] ?? [])].map((q) => ({
      question: q, archetype: this.name, domain,
    }));
  }

  protected evaluateNode(node: FlowNode, context: { domain: DomainContext; graph: FlowGraph }): Finding[] {
    const findings: Finding[] = [];

    if (node.decisions.length > 3) {
      findings.push(this.makeFinding(
        node, 'major', 'cognitive-overload',
        `"${node.componentName}" forces ${node.decisions.length} decisions`,
        `This component has ${node.decisions.length} conditional paths. A goal-oriented user has to process too many branches to find their path.`,
        'Goal-getters know what they want. Making them evaluate multiple conditional paths slows them down and increases frustration.',
        'Simplify the decision tree. Use smart defaults or progressive disclosure to reduce visible options.',
      ));
    }

    if (node.userActions.length > 4) {
      findings.push(this.makeFinding(
        node, 'minor', 'cognitive-overload',
        `"${node.componentName}" has ${node.userActions.length} actions — too many choices`,
        'Too many interactive elements compete for attention. A goal-getter needs to quickly identify the one action that matches their intent.',
        'Choice overload causes decision paralysis. Goal-getters prefer clear, prioritized actions.',
        'Prioritize actions visually: one primary button, secondary actions in a menu or less prominent styling.',
      ));
    }

    if (node.userActions.some((a) => a.type === 'submit') && !node.loadingStates) {
      findings.push(this.makeFinding(
        node, 'minor', 'missing-feedback',
        `"${node.componentName}" submits data but has no loading indicator`,
        'After clicking submit, goal-getters need immediate feedback that their action was received. Without a loading state, they may click again or leave.',
        'Goal-getters are efficient and expect the app to be too. No loading state = "is it working?"',
        'Add a loading/spinner state that appears immediately after form submission.',
      ));
    }

    return findings;
  }

  protected evaluateEdge(edge: FlowEdge, from: FlowNode, to: FlowNode): Finding[] {
    return [];
  }

  protected evaluateFlow(graph: FlowGraph, context: { domain: DomainContext }): Finding[] {
    const findings: Finding[] = [];

    const linearLength = graph.nodes.length;
    if (linearLength > 4) {
      const entry = graph.nodes[0];
      if (entry) {
        findings.push(this.makeFinding(
          entry, 'major', 'excessive-friction',
          `"${graph.name}" requires ${linearLength} steps to complete`,
          `This flow has ${linearLength} sequential steps. Each step is a point where a goal-getter might abandon if they feel progress is too slow.`,
          'Goal-getters calculate effort-to-value ratio. Too many steps for a simple outcome = not worth it.',
          'Look for steps that can be combined, pre-filled, or made optional. Consider a single-page form instead of a multi-step wizard.',
        ));
      }
    }

    return findings;
  }
}
