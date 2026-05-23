import type { DomainSignal, RouteNode, DomainCategory } from '../../../shared/types.js';
import { DOMAIN_KEYWORDS } from '../domains.js';

export function extractRouteSignals(routes: RouteNode[]): DomainSignal[] {
  const signals: DomainSignal[] = [];

  for (const route of routes) {
    const pathSegments = route.path.toLowerCase().split('/').filter(Boolean);

    for (const [category, keywords] of Object.entries(DOMAIN_KEYWORDS) as [DomainCategory, any][]) {
      for (const segment of pathSegments) {
        const clean = segment.replace(/^:/, '');
        if (keywords.routes.some((kw: string) => clean.includes(kw) || kw.includes(clean))) {
          signals.push({
            source: 'route',
            evidence: `Route "${route.path}" matches ${category} pattern`,
            category,
            weight: route.isDynamic ? 0.8 : 1.0,
          });
        }
      }
    }
  }

  return signals;
}
