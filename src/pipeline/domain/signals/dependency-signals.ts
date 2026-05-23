import type { DomainSignal, PackageJsonInfo, DomainCategory } from '../../../shared/types.js';
import { DOMAIN_KEYWORDS } from '../domains.js';

export function extractDependencySignals(pkg: PackageJsonInfo): DomainSignal[] {
  const signals: DomainSignal[] = [];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const [category, keywords] of Object.entries(DOMAIN_KEYWORDS) as [DomainCategory, any][]) {
    for (const kw of keywords.dependencies as string[]) {
      if (kw in allDeps) {
        signals.push({
          source: 'dependency',
          evidence: `Dependency "${kw}" strongly suggests ${category}`,
          category,
          weight: 1.5,
        });
      }
    }
  }

  return signals;
}
