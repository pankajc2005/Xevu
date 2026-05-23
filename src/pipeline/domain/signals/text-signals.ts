import type { DomainSignal, ExtractedText, DomainCategory } from '../../../shared/types.js';
import { DOMAIN_KEYWORDS } from '../domains.js';

export function extractTextSignals(texts: ExtractedText[]): DomainSignal[] {
  const signals: DomainSignal[] = [];
  const seen = new Set<string>();

  for (const text of texts) {
    const valueLower = text.value.toLowerCase();

    for (const [category, keywords] of Object.entries(DOMAIN_KEYWORDS) as [DomainCategory, any][]) {
      for (const kw of keywords.texts as string[]) {
        if (valueLower.includes(kw)) {
          const key = `${category}:${kw}`;
          if (!seen.has(key)) {
            seen.add(key);
            signals.push({
              source: 'text',
              evidence: `Text "${text.value}" contains "${kw}" (${category})`,
              category,
              weight: 0.8,
            });
          }
        }
      }
    }
  }

  return signals;
}
