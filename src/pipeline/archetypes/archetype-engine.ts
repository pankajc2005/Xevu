// ============================================================
// FILE: src/pipeline/archetypes/archetype-engine.ts
// PURPOSE: Orchestrate running all archetypes against a flow
// ============================================================

import type {
  ArchetypeName,
  ArchetypeFindings,
  DomainContext,
  FlowGraph,
  Finding,
} from '../../shared/types.js';
import { logger } from '../../infra/logger.js';
import { BaseArchetype } from './base-archetype.js';
import { FirstTimerArchetype } from './first-timer.js';
import { GoalGetterArchetype } from './goal-getter.js';
import { ReturningUserArchetype } from './returning-user.js';
import { SkepticArchetype } from './skeptic.js';
import { RusherArchetype } from './rusher.js';

const ALL_ARCHETYPES: BaseArchetype[] = [
  new FirstTimerArchetype(),
  new GoalGetterArchetype(),
  new SkepticArchetype(),
  new ReturningUserArchetype(),
  new RusherArchetype(),
];

export function runArchetypes(
  flow: FlowGraph,
  domain: DomainContext,
  selectedArchetypes?: ArchetypeName[],
): ArchetypeFindings[] {
  const archetypesToRun = selectedArchetypes
    ? ALL_ARCHETYPES.filter((a) => selectedArchetypes.includes(a.name))
    : ALL_ARCHETYPES;

  logger.info('Running archetypes', {
    archetypes: archetypesToRun.map((a) => a.name),
    flowNodes: flow.nodes.length,
  });

  const results: ArchetypeFindings[] = [];

  for (const archetype of archetypesToRun) {
    try {
      const findings = archetype.evaluate(flow, domain);
      const score = calculateScore(findings);

      results.push({
        archetype: archetype.name,
        flowName: flow.name,
        findings,
        overallScore: score,
      });

      logger.info(`Archetype "${archetype.name}" found ${findings.length} issues, score: ${score}`);
    } catch (e) {
      logger.error(`Archetype "${archetype.name}" failed`, {
        error: e instanceof Error ? e.message : String(e),
      });
      results.push({
        archetype: archetype.name,
        flowName: flow.name,
        findings: [],
        overallScore: -1,
      });
    }
  }

  return results;
}

function calculateScore(findings: Finding[]): number {
  const SEVERITY_PENALTY = {
    critical: 25,
    major: 15,
    minor: 5,
    suggestion: 2,
  };

  let penalty = 0;
  for (const f of findings) {
    penalty += SEVERITY_PENALTY[f.severity];
  }

  return Math.max(0, 100 - penalty);
}

export { ALL_ARCHETYPES };
