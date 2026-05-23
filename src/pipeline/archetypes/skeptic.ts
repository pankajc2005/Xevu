// ============================================================
// FILE: src/pipeline/archetypes/skeptic.ts
// PURPOSE: The Skeptic archetype — distrusts claims and needs proof
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

export class SkepticArchetype extends BaseArchetype {
  readonly name: ArchetypeName = 'skeptic';
  readonly coreBehavior = 'Distrusts claims, wants proof, looks for friction';

  getQuestions(domain: DomainCategory): ArchetypeQuestion[] {
    const base = [
      'Does the UI prove its claims with visible evidence?',
      'Are trust signals present before asking for commitment?',
      'Can the user verify what happens before submitting?',
      'Are errors explained clearly and recoverably?',
    ];

    const domainSpecific: Partial<Record<DomainCategory, string[]>> = {
      ecommerce: [
        'Are pricing, shipping, and return details easy to verify?',
        'Does checkout reassure the user before payment is captured?',
      ],
      saas: [
        'Is there enough proof before asking the user to upgrade?',
        'Can the user see what data is being collected or synced?',
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

    if (node.userActions.some((action) => action.type === 'submit') && !node.errorStates) {
      findings.push(
        this.makeFinding(
          node,
          'major',
          'trust-gap',
          `"${node.componentName}" asks for submission without clear failure recovery`,
          'A skeptical user wants to know what happens when something goes wrong. Without visible error handling, the flow feels risky and opaque.',
          'Skeptics assume the worst when systems are silent. Missing recovery cues lowers trust fast.',
          'Show explicit validation and error recovery so the user knows how to recover from a failed action.',
        ),
      );
    }

    if (node.information.length === 0 && node.userActions.length > 0) {
      findings.push(
        this.makeFinding(
          node,
          'minor',
          'missing-feedback',
          `"${node.componentName}" provides no explanatory context`,
          'If a screen offers action without explanation, a skeptic has no reason to trust it.',
          'Skeptical users need context before they commit.',
          'Add short supporting copy that explains the purpose and consequence of the action.',
        ),
      );
    }

    return findings;
  }

  protected evaluateEdge(edge: FlowEdge, from: FlowNode, to: FlowNode): Finding[] {
    if (!edge.isReversible) {
      return [
        this.makeFinding(
          from,
          'minor',
          'navigation-confusion',
          `"${from.componentName}" moves to "${to.componentName}" without a visible escape path`,
          'Skeptical users want control. A one-way transition can feel like a trap.',
          'When users cannot back out, trust drops and abandonment rises.',
          'Provide a clear back path, cancel action, or breadcrumb so the user can verify they are in control.',
        ),
      ];
    }

    return [];
  }

  protected evaluateFlow(graph: FlowGraph, context: { domain: DomainContext }): Finding[] {
    const findings: Finding[] = [];

    if (
      graph.nodes.some((node) => node.loadingStates) &&
      graph.nodes.every((node) => !node.errorStates)
    ) {
      const entry = graph.nodes[0];
      if (entry) {
        findings.push(
          this.makeFinding(
            entry,
            'minor',
            'trust-gap',
            `Flow "${graph.name}" shows loading but no visible error recovery`,
            'Skeptical users need proof that the system can fail safely. Loading without recovery looks incomplete.',
            'If the flow cannot explain failure states, it feels unreliable.',
            'Add a visible recovery path and an error message near the point of failure.',
          ),
        );
      }
    }

    return findings;
  }
}
