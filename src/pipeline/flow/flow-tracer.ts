// ============================================================
// FILE: src/pipeline/flow/flow-tracer.ts
// PURPOSE: Trace user flows across components and routes
// ============================================================

import type {
  FlowGraph,
  FlowNode,
  FlowEdge,
  ComponentNode,
  RouteNode,
  ParsedProject,
  UserAction,
  FormField,
} from '../../shared/types.js';
import { Result, ok, err } from '../../infra/result.js';
import { FlowTracingError } from '../../infra/errors.js';
import { logger } from '../../infra/logger.js';
import { makeId, levenshtein } from '../../shared/utils.js';
import { buildComponentGraph, type ComponentGraphNode } from './component-graph.js';

export function traceFlow(
  parsed: ParsedProject,
  flowTarget?: string,
): Result<FlowGraph, FlowTracingError> {
  logger.info('Tracing flow', { target: flowTarget ?? 'all' });

  const componentGraph = buildComponentGraph(parsed.components, parsed.imports);

  const relevantRoutes = flowTarget ? matchRoutes(parsed.routes, flowTarget) : parsed.routes;

  if (relevantRoutes.length === 0 && flowTarget) {
    const matchedComponents = matchComponents(parsed.components, flowTarget);
    if (matchedComponents.length === 0) {
      return err(
        new FlowTracingError(
          `No routes or components found matching "${flowTarget}". ` +
            `Available routes: ${parsed.routes.map((r) => r.path).join(', ')}`,
        ),
      );
    }
    return ok(buildFlowFromComponents(matchedComponents, componentGraph, parsed, flowTarget));
  }

  return ok(buildFlowFromRoutes(relevantRoutes, componentGraph, parsed, flowTarget ?? 'main'));
}

function matchRoutes(routes: RouteNode[], target: string): RouteNode[] {
  const targetLower = target.toLowerCase();

  return routes.filter((route) => {
    const pathLower = route.path.toLowerCase();
    const compLower = route.componentName.toLowerCase();

    return (
      pathLower.includes(targetLower) ||
      compLower.includes(targetLower) ||
      targetLower.includes(pathLower.replace(/\//g, '')) ||
      levenshtein(targetLower, compLower) <= 3
    );
  });
}

function matchComponents(components: ComponentNode[], target: string): ComponentNode[] {
  const targetLower = target.toLowerCase();

  return components.filter((comp) => {
    const nameLower = comp.name.toLowerCase();
    return (
      nameLower.includes(targetLower) ||
      targetLower.includes(nameLower) ||
      levenshtein(targetLower, nameLower) <= 3
    );
  });
}

function buildFlowFromRoutes(
  routes: RouteNode[],
  graph: Map<string, ComponentGraphNode>,
  parsed: ParsedProject,
  flowName: string,
): FlowGraph {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  for (const route of routes) {
    const component = parsed.components.find((c) => c.name === route.componentName);
    if (!component) continue;

    const node = buildFlowNode(component, route.path, parsed);
    nodes.push(node);
  }

  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      from: nodes[i].id,
      to: nodes[i + 1].id,
      trigger: 'navigation',
      type: 'navigation',
      isReversible: true,
    });
  }

  for (const node of nodes) {
    const comp = parsed.components.find((c) => c.name === node.componentName);
    if (!comp) continue;

    for (const childName of comp.children) {
      const childNode = nodes.find((n) => n.componentName === childName);
      if (childNode && childNode.id !== node.id) {
        const alreadyLinked = edges.some((e) => e.from === node.id && e.to === childNode.id);
        if (!alreadyLinked) {
          edges.push({
            from: node.id,
            to: childNode.id,
            trigger: `renders ${childName}`,
            type: 'conditional',
            isReversible: false,
          });
        }
      }
    }
  }

  return {
    name: flowName,
    nodes,
    edges,
    entryPoints: nodes.length > 0 ? [nodes[0].id] : [],
    exitPoints: nodes.length > 0 ? [nodes[nodes.length - 1].id] : [],
  };
}

function buildFlowFromComponents(
  components: ComponentNode[],
  graph: Map<string, ComponentGraphNode>,
  parsed: ParsedProject,
  flowName: string,
): FlowGraph {
  const nodes = components.map((c) => buildFlowNode(c, undefined, parsed));
  const edges: FlowEdge[] = [];

  for (const comp of components) {
    for (const childName of comp.children) {
      const childComp = components.find((c) => c.name === childName);
      if (childComp) {
        edges.push({
          from: makeId(comp.name),
          to: makeId(childName),
          trigger: `renders ${childName}`,
          type: 'conditional',
          isReversible: false,
        });
      }
    }
  }

  return {
    name: flowName,
    nodes,
    edges,
    entryPoints: nodes.length > 0 ? [nodes[0].id] : [],
    exitPoints: nodes.length > 0 ? [nodes[nodes.length - 1].id] : [],
  };
}

function buildFlowNode(
  component: ComponentNode,
  route: string | undefined,
  parsed: ParsedProject,
): FlowNode {
  const userActions: UserAction[] = component.eventHandlers.map((handler) => ({
    type: handler === 'onSubmit' ? 'submit' : handler === 'onClick' ? 'click' : 'other',
    handler,
    element: component.name,
  }));

  const information = component.texts.map((t) => t.value);
  const formFields: FormField[] = [];

  const stateNames = component.stateVariables.map((s) => s.toLowerCase());
  const hasLoading = stateNames.some(
    (s) => s.includes('load') || s.includes('pending') || s.includes('fetch'),
  );
  const hasError = stateNames.some((s) => s.includes('error') || s.includes('err'));
  const hasEmpty = stateNames.some((s) => s.includes('empty') || s.includes('none'));

  return {
    id: makeId(component.name),
    componentName: component.name,
    filePath: component.filePath,
    route,
    userActions,
    information,
    decisions: component.conditionalRenders.map((cr) => `Conditional at line ${cr.line}`),
    formFields,
    loadingStates: hasLoading,
    errorStates: hasError,
    emptyStates: hasEmpty,
  };
}
