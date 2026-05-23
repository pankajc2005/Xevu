// ============================================================
// FILE: src/pipeline/archetypes/returning-user.ts
// PURPOSE: The Returning-User archetype — expects continuity and shortcuts
// ============================================================

import { BaseArchetype, type ArchetypeQuestion } from './base-archetype.js';
import type {
  ArchetypeName,
  DomainCategory,
  DomainContext,
  FlowGraph,
  FlowNode,
  FlowEdge,
  Finding,
} from '../../shared/types.js';

export class ReturningUserArchetype extends BaseArchetype {
  readonly name: ArchetypeName = 'returning-user';
  readonly coreBehavior = 'Knows the product, expects remembered state and shortcuts';

  getQuestions(domain: DomainCategory): ArchetypeQuestion[] {
    const base = [
      'Does the app remember prior choices or preferences?',
      'Are frequent actions available without re-learning the flow?',
      'Can the user resume where they left off?',
      'Is important state preserved between visits?',
    ];

    const domainSpecific: Partial<Record<DomainCategory, string[]>> = {
      ecommerce: [
        'Can a returning shopper reuse saved cart or address information?',
        'Are repeat purchases faster than the first purchase?',
      ],
      saas: [
        'Does the app surface the most-used workspace or dashboard on return?',
        'Are recently used settings or actions easy to revisit?',
      ],
    };

    return [...base, ...(domainSpecific[domain] ?? [])].map((question) => ({
      question,
      archetype: this.name,
      domain,
    }));
  }

  protected evaluateNode(
    node: FlowNode,
    context: { domain: DomainContext; graph: FlowGraph },
  ): Finding[] {
    const findings: Finding[] = [];

    if (node.userActions.length > 0 && !node.loadingStates && node.information.length === 0) {
      findings.push(
        this.makeFinding(
          node,
          'minor',
          'broken-continuity',
          `"${node.componentName}" offers actions without continuity cues`,
          'Returning users expect the app to remember context and move quickly. A blank, state-less screen forces them to re-orient.',
          'Repeat users do not want to relearn the interface every visit.',
          'Show previously selected state, recent items, or clear shortcuts so the user can continue faster.',
        ),
      );
    }

    if (node.userActions.some((action) => action.type === 'submit') && !node.errorStates) {
      findings.push(
        this.makeFinding(
          node,
          'minor',
          'missing-feedback',
          `"${node.componentName}" has a repeat action but no explicit confirmation`,
          'Returning users move faster and need confirmation that the action completed successfully.',
          'Fast users do not slow down to double-check the UI. Clear confirmation avoids duplicate submissions.',
          'Show a short success state or persistent confirmation after the action completes.',
        ),
      );
    }

    return findings;
  }

  protected evaluateEdge(edge: FlowEdge, from: FlowNode, to: FlowNode): Finding[] {
    if (!edge.isReversible && edge.type === 'navigation') {
      return [
        this.makeFinding(
          from,
          'minor',
          'broken-continuity',
          `Returning users cannot quickly reverse from "${from.componentName}" to "${to.componentName}"`,
          'Repeat visitors expect to navigate with confidence and minimum friction. One-way navigation interrupts continuity.',
          'If a returning user cannot backtrack instantly, the flow feels slower than it should.',
          'Add a fast back path or persistent navigation so repeat visitors can continue with less friction.',
        ),
      ];
    }

    return [];
  }

  protected evaluateFlow(graph: FlowGraph, context: { domain: DomainContext }): Finding[] {
    const findings: Finding[] = [];

    if (graph.nodes.length > 3) {
      const entry = graph.nodes[0];
      if (entry) {
        findings.push(
          this.makeFinding(
            entry,
            'minor',
            'excessive-friction',
            `Flow "${graph.name}" may be too long for a returning user`,
            'Returning users expect shortcuts and continuity. A longer-than-needed flow suggests the app is not optimizing for repeat usage.',
            'Repeat users usually abandon friction faster than first-time users.',
            'Surface shortcuts, remembered state, or direct navigation to reduce the path length for repeat visits.',
          ),
        );
      }
    }

    return findings;
  }
}
