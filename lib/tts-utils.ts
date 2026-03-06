import { createHash } from 'crypto';

export function buildCacheLogContext(sanitizedText: string) {
  return {
    length: sanitizedText.length,
    hash: createHash('sha256').update(sanitizedText).digest('hex'),
  };
}
