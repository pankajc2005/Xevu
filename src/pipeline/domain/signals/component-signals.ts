import type { DomainSignal, ComponentNode, DomainCategory } from '../../../shared/types.js';
import { DOMAIN_KEYWORDS } from '../domains.js';

export function extractComponentSignals(components: ComponentNode[]): DomainSignal[] {
  const signals: DomainSignal[] = [];

  for (const comp of components) {
    const nameNormalized = normalizeName(comp.name);
    if (nameNormalized.length < 4) {
      continue;
    }

    for (const [category, keywords] of Object.entries(DOMAIN_KEYWORDS) as [DomainCategory, any][]) {
      if (
        keywords.components.some((kw: string) =>
          matchesComponentName(nameNormalized, normalizeName(kw)),
        )
      ) {
        signals.push({
          source: 'component',
          evidence: `Component "${comp.name}" matches ${category} pattern`,
          category,
          weight: 1.0,
        });
      }
    }
  }

  return signals;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchesComponentName(name: string, keyword: string): boolean {
  if (name.length < 4 || keyword.length < 4) {
    return false;
  }

  return name === keyword || name.startsWith(keyword) || keyword.startsWith(name);
}
