// ============================================================
// FILE: src/pipeline/archetypes/first-timer.ts
// PURPOSE: The First-Timer archetype — reads nothing, needs guidance
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

export class FirstTimerArchetype extends BaseArchetype {
  readonly name: ArchetypeName = 'first-timer';
  readonly coreBehavior = 'Reads nothing, clicks everything, needs guidance';

  getQuestions(domain: DomainCategory): ArchetypeQuestion[] {
    const base = [
      'Is there a clear visual hierarchy showing what to do first?',
      'Are there empty states with helpful guidance?',
      'Is the primary action obvious without reading instructions?',
      'Can a user complete the core task without prior knowledge of the app?',
    ];

    const domainSpecific: Partial<Record<DomainCategory, string[]>> = {
      ecommerce: [
        'Can a first-time shopper find and add a product to cart in under 3 clicks?',
        'Is the checkout flow understandable without creating an account first?',
      ],
      saas: [
        'Does the onboarding show the core value within the first screen?',
        'Can the user reach their first "aha moment" without complex setup?',
      ],
      content: [
        'Is there content visible immediately, or does the user face a blank feed?',
        'Are content categories and navigation self-explanatory?',
      ],
    };

    return [...base, ...(domainSpecific[domain] ?? [])].map((q) => ({
      question: q,
      archetype: this.name,
      domain,
    }));
  }

  protected evaluateNode(
    node: FlowNode,
    context: { domain: DomainContext; graph: FlowGraph },
  ): Finding[] {
    const findings: Finding[] = [];

    if (node.userActions.length > 2 && node.information.length === 0) {
      findings.push(
        this.makeFinding(
          node,
          'major',
          'missing-guidance',
          `"${node.componentName}" has actions but no guidance`,
          `This component offers ${node.userActions.length} interactive elements but shows no descriptive text. A first-time user won't know which action to take or what they do.`,
          'First-timers read nothing and click everything. Without visual guidance, they will click the wrong thing or abandon the page.',
          'Add a short heading or helper text explaining the purpose of this view and what the user should do first.',
        ),
      );
    }

    if (!node.emptyStates && node.loadingStates) {
      findings.push(
        this.makeFinding(
          node,
          'minor',
          'missing-guidance',
          `"${node.componentName}" handles loading but not empty states`,
          'When data loads successfully but is empty, the user sees nothing. First-timers need guidance on what to do to populate this view.',
          'A blank screen after loading tells a first-timer the app is broken. An empty state with a call to action keeps them engaged.',
          'Add an empty state component with a clear message and action button (e.g., "No items yet — start by adding one").',
        ),
      );
    }

    if (!node.errorStates && node.userActions.some((a) => a.type === 'submit')) {
      findings.push(
        this.makeFinding(
          node,
          'major',
          'missing-error-recovery',
          `"${node.componentName}" has form submission but no visible error handling`,
          "This component submits data but has no error state management. When something fails, first-timers won't know what happened or what to do.",
          'First-timers blame themselves when errors occur. Without clear error messages, they assume they did something wrong and leave.',
          'Add error state handling that shows what went wrong and how to fix it (e.g., "Invalid email — please check the format").',
        ),
      );
    }

    if (node.formFields.length > 0) {
      const unlabeled = node.formFields.filter((f) => !f.label);
      if (unlabeled.length > 0) {
        findings.push(
          this.makeFinding(
            node,
            'major',
            'missing-guidance',
            `"${node.componentName}" has form fields without labels`,
            `${unlabeled.length} form field(s) lack visible labels. Placeholders alone are not sufficient as they disappear once the user starts typing.`,
            'First-timers need persistent visual cues. Disappearing placeholders leave them guessing what each field expects.',
            'Add visible labels above each form field. Keep placeholders as examples, not as the only label.',
          ),
        );
      }
    }

    return findings;
  }

  protected evaluateEdge(edge: FlowEdge, from: FlowNode, to: FlowNode): Finding[] {
    const findings: Finding[] = [];

    if (!edge.isReversible && edge.type === 'navigation') {
      findings.push(
        this.makeFinding(
          from,
          'minor',
          'navigation-confusion',
          `No way back from "${from.componentName}" to "${to.componentName}"`,
          `The transition from ${from.componentName} to ${to.componentName} appears to be one-way. Users cannot navigate back.`,
          "First-timers explore by trial and error. If they can't go back, they feel trapped and lose trust in the app.",
          'Ensure there is a back button or breadcrumb navigation between these views.',
        ),
      );
    }

    return findings;
  }

  protected evaluateFlow(graph: FlowGraph, context: { domain: DomainContext }): Finding[] {
    const findings: Finding[] = [];

    if (graph.nodes.length > 5) {
      const entry = graph.nodes[0];
      if (entry) {
        findings.push(
          this.makeFinding(
            entry,
            'minor',
            'excessive-friction',
            `Flow "${graph.name}" has ${graph.nodes.length} steps — may overwhelm first-timers`,
            `This flow involves ${graph.nodes.length} distinct views/components. First-time users may lose track of where they are or give up before completing it.`,
            'First-timers have limited patience. Multi-step flows without progress indicators cause drop-offs.',
            'Consider adding a progress indicator (stepper/breadcrumb) or reducing the number of steps by combining related views.',
          ),
        );
      }
    }

    if (graph.entryPoints.length > 0) {
      const entryNode = graph.nodes.find((n) => n.id === graph.entryPoints[0]);
      if (entryNode && entryNode.information.length === 0 && entryNode.userActions.length > 0) {
        findings.push(
          this.makeFinding(
            entryNode,
            'major',
            'missing-guidance',
            `Flow "${graph.name}" starts without any explanatory text`,
            'The first screen of this flow has interactive elements but no text explaining the purpose or what to expect.',
            'First-timers decide in seconds whether to engage. A screen with buttons but no context will be abandoned.',
            'Add a heading and brief description at the start of this flow explaining what the user will accomplish.',
          ),
        );
      }
    }

    return findings;
  }
}
