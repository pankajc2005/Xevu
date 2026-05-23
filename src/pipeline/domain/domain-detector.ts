// ============================================================
// FILE: src/pipeline/domain/domain-detector.ts
// PURPOSE: Orchestrate domain detection from all signal sources
// ============================================================

import type {
  DomainContext,
  DomainCategory,
  DomainSignal,
  ParsedProject,
  ScannedProject,
} from '../../shared/types.js';
import { Result, ok } from '../../infra/result.js';
import { logger } from '../../infra/logger.js';
import { extractRouteSignals } from './signals/route-signals.js';
import { extractComponentSignals } from './signals/component-signals.js';
import { extractTextSignals } from './signals/text-signals.js';
import { extractDependencySignals } from './signals/dependency-signals.js';
import { extractFileNameSignals } from './signals/file-name-signals.js';

const SOURCE_WEIGHTS: Record<DomainSignal['source'], number> = {
  dependency: 3.0,
  route: 2.5,
  component: 2.0,
  text: 1.5,
  filename: 1.0,
};

export function detectDomain(
  scanned: ScannedProject,
  parsed: ParsedProject,
): Result<DomainContext, Error> {
  const signals: DomainSignal[] = [
    ...extractRouteSignals(parsed.routes),
    ...extractComponentSignals(parsed.components),
    ...extractTextSignals(parsed.texts),
    ...extractDependencySignals(scanned.packageJson),
    ...extractFileNameSignals(scanned.files),
  ];

  const scores: Record<string, number> = {};

  for (const signal of signals) {
    const weight = SOURCE_WEIGHTS[signal.source] * signal.weight;
    scores[signal.category] = (scores[signal.category] ?? 0) + weight;
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  if (total === 0) {
    logger.info('No domain signals found, defaulting to general');
    return ok({
      primary: 'general',
      confidence: 0,
      signals: [],
      secondaryDomains: [],
    });
  }

  const ranked = Object.entries(scores)
    .map(([cat, score]) => ({ category: cat as DomainCategory, confidence: score / total }))
    .sort((a, b) => b.confidence - a.confidence);

  const result: DomainContext = {
    primary: ranked[0].category,
    confidence: Math.round(ranked[0].confidence * 100) / 100,
    signals,
    secondaryDomains: ranked
      .slice(1, 3)
      .filter((d) => d.confidence > 0.15)
      .map((d) => d.category),
  };

  logger.info('Domain detected', {
    primary: result.primary,
    confidence: result.confidence,
    signalCount: signals.length,
  });

  return ok(result);
}
