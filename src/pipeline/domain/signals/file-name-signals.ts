import type { DomainSignal, ScannedFile, DomainCategory } from '../../../shared/types.js';
import { DOMAIN_KEYWORDS } from '../domains.js';
import { basename, extname } from 'path';

export function extractFileNameSignals(files: ScannedFile[]): DomainSignal[] {
  const signals: DomainSignal[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const name = basename(file.relativePath, extname(file.relativePath)).toLowerCase();

    for (const [category, keywords] of Object.entries(DOMAIN_KEYWORDS) as [DomainCategory, any][]) {
      for (const kw of keywords.filenames as string[]) {
        if (name.includes(kw) && !seen.has(`${category}:${kw}`)) {
          seen.add(`${category}:${kw}`);
          signals.push({
            source: 'filename',
            evidence: `File "${file.relativePath}" matches ${category} pattern`,
            category,
            weight: 0.6,
          });
        }
      }
    }
  }

  return signals;
}
