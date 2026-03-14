import { describe, expect, it } from 'vitest';
import { orderTranscriptEntries } from '../utils/listen-transcript';

describe('orderTranscriptEntries', () => {
  it('reconstructs spoken order from previous entry links', () => {
    const ordered = orderTranscriptEntries([
      { id: 'b', previousEntryId: 'a', timestamp: 2000 },
      { id: 'a', previousEntryId: null, timestamp: 3000 },
      { id: 'c', previousEntryId: 'b', timestamp: 1000 },
    ]);

    expect(ordered.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
  });

  it('falls back to timestamps when no chain is available', () => {
    const ordered = orderTranscriptEntries([
      { id: 'second', timestamp: 2000 },
      { id: 'first', timestamp: 1000 },
    ]);

    expect(ordered.map((entry) => entry.id)).toEqual(['first', 'second']);
  });
});
