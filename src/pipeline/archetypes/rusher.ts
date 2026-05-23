// ============================================================
// FILE: src/pipeline/archetypes/rusher.ts
// PURPOSE: The Rusher — no patience, likely mobile, needs instant feedback
// ============================================================

import { BaseArchetype, type ArchetypeQuestion } from './base-archetype.js';
import type {
  ArchetypeName, DomainCategory, DomainContext, FlowGraph,
  FlowNode, FlowEdge, Finding,
} from '../../shared/types.js';

export class RusherArchetype extends BaseArchetype {
  readonly name: ArchetypeName = 'rusher';
  readonly coreBehavior = 'No patience, likely on mobile, needs instant feedback';

  getQuestions(domain: DomainCategory): ArchetypeQuestion[] {
    const base = [
      'Does every interactive element provide instant visual feedback?',
      'Are there loading skeletons or optimistic updates?',
      'Can the user understand the current screen in under 3 seconds?',
      'Is the interface usable on a small mobile screen?',
    ];

    const domainSpecific: Partial<Record<DomainCategory, string[]>> = {
      ecommerce: [
        'Can the user add to cart and see instant confirmation?',
        'Does the checkout auto-fill or save previous information?',
      ],
      saas: [
        'Do dashboard widgets load independently with skeleton states?',
        'Can the user complete quick tasks without a full page load?',
      ],
    };

    return [...base, ...(domainSpecific[domain] ?? [])].map((q) => ({
      question: q, archetype: this.name, domain,
    }));
  }

  protected evaluateNode(node: FlowNode, context: { domain: DomainContext; graph: FlowGraph }): Finding[] {
    const findings: Finding[] = [];

    if (!node.loadingStates && node.userActions.length > 0) {
      findings.push(this.makeFinding(
        node, 'major', 'missing-feedback',
        `"${node.componentName}" has no loading state management`,
        'This component has user interactions but no loading state. Rushers expect instant feedback — any delay without visual acknowledgment makes them think the app froze.',
        'Rushers operate in "did it work?" mode. Without instant feedback, they rage-tap, reload, or leave within seconds.',
        'Add loading states: spinner for actions, skeleton screens for data loading, optimistic updates where possible.',
      ));
    }

    if (node.information.length > 5) {
      findings.push(this.makeFinding(
        node, 'minor', 'cognitive-overload',
        `"${node.componentName}" shows ${node.information.length} text elements — too verbose for rushers`,
        'This component displays a lot of text content. Rushers scan, never read. They will miss important information buried in paragraphs.',
        'Rushers make decisions in 1-2 seconds. Walls of text are invisible to them.',
        'Use visual hierarchy: bold key info, use icons, break text into scannable chunks. Front-load the most important information.',
      ));
    }

    if (node.formFields.length > 4) {
      findings.push(this.makeFinding(
        node, 'major', 'excessive-friction',
        `"${node.componentName}" has ${node.formFields.length} form fields — form fatigue`,
        `A form with ${node.formFields.length} fields causes immediate fatigue for rushers, especially on mobile where typing is slow.`,
        'Rushers will abandon a long form on sight. Every extra field reduces completion rate.',
        'Reduce to essential fields only. Use auto-fill, smart defaults, and consider splitting into smaller steps with progress indication.',
      ));
    }

    const hasSubmit = node.userActions.some((a) => a.type === 'submit');
    if (hasSubmit && !node.loadingStates && !node.errorStates) {
      findings.push(this.makeFinding(
        node, 'critical', 'missing-feedback',
        `"${node.componentName}" submits data with no feedback mechanism`,
        'This component submits data but has neither loading indicators nor error handling. After tapping submit, the rusher gets zero feedback.',
        'This is the #1 rusher killer. They will tap submit repeatedly, causing duplicate submissions, or leave thinking it failed.',
        'Add: (1) disable button + spinner on submit, (2) success confirmation, (3) error message with retry option.',
      ));
    }

    return findings;
  }

  protected evaluateEdge(edge: FlowEdge, from: FlowNode, to: FlowNode): Finding[] {
    return [];
  }

  protected evaluateFlow(graph: FlowGraph, context: { domain: DomainContext }): Finding[] {
    const findings: Finding[] = [];

    if (graph.nodes.length > 3) {
      const entry = graph.nodes[0];
      if (entry) {
        findings.push(this.makeFinding(
          entry, 'major', 'excessive-friction',
          `"${graph.name}" has ${graph.nodes.length} steps — rushers will drop off`,
          `Multi-step flows are the nemesis of rushers. Each additional step after 3 roughly halves the completion rate.`,
          'Rushers operate on impulse. If they can\'t see the finish line, they won\'t start.',
          'Show a progress bar. Better yet, reduce steps. Consider a single-page layout with accordion sections.',
        ));
      }
    }

    return findings;
  }
}
