// ============================================================
// FILE: src/pipeline/report/report-builder.ts
// PURPOSE: Assemble the final structured report from pipeline outputs
// ============================================================

import type {
  StructuredReport,
  DomainContext,
  FlowGraph,
  ArchetypeFindings,
  PipelineWarning,
  ArchetypeName,
} from '../../shared/types.js';

export function buildReport(input: {
  domain: DomainContext;
  flow: FlowGraph | null;
  archetypes: ArchetypeFindings[];
  warnings: PipelineWarning[];
  filesScanned: number;
  filesSkipped: number;
  startTime: number;
}): StructuredReport {
  const analysisTimeMs = Date.now() - input.startTime;

  const totalFindings = input.archetypes.reduce((sum, a) => sum + a.findings.length, 0);
  const criticalCount = input.archetypes.reduce(
    (sum, a) => sum + a.findings.filter((f) => f.severity === 'critical').length,
    0,
  );
  const majorCount = input.archetypes.reduce(
    (sum, a) => sum + a.findings.filter((f) => f.severity === 'major').length,
    0,
  );

  const summaryParts: string[] = [];
  summaryParts.push(
    `Detected domain: ${input.domain.primary} (${Math.round(input.domain.confidence * 100)}% confidence).`,
  );

  if (input.flow) {
    summaryParts.push(
      `Analyzed flow "${input.flow.name}" with ${input.flow.nodes.length} components.`,
    );
  }

  summaryParts.push(
    `Found ${totalFindings} UX issues: ${criticalCount} critical, ${majorCount} major.`,
  );

  if (input.archetypes.length > 0) {
    const avgScore = Math.round(
      input.archetypes.reduce((sum, a) => sum + (a.overallScore >= 0 ? a.overallScore : 0), 0) /
        input.archetypes.length,
    );
    summaryParts.push(`Average archetype score: ${avgScore}/100.`);
  }

  if (input.warnings.length > 0) {
    summaryParts.push(`${input.warnings.length} warning(s) during analysis.`);
  }

  return {
    status: input.warnings.length > 0 ? 'partial' : 'success',
    domain: input.domain,
    flow: input.flow,
    archetypes: input.archetypes,
    metadata: {
      filesScanned: input.filesScanned,
      filesSkipped: input.filesSkipped,
      analysisTimeMs,
      warnings: input.warnings,
      archetypesApplied: input.archetypes.map((a) => a.archetype),
    },
    summary: summaryParts.join(' '),
  };
}
