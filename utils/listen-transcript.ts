export interface OrderableTranscriptEntry {
  id: string;
  previousEntryId?: string | null;
  timestamp: number;
}

function buildDepthResolver<T extends OrderableTranscriptEntry>(entriesById: Map<string, T>) {
  const depths = new Map<string, number>();
  const visiting = new Set<string>();

  const resolveDepth = (id: string): number => {
    if (depths.has(id)) return depths.get(id)!;
    if (visiting.has(id)) return 0;

    visiting.add(id);
    const entry = entriesById.get(id);
    const previousId = entry?.previousEntryId || null;
    const previousDepth = previousId && entriesById.has(previousId)
      ? resolveDepth(previousId)
      : -1;
    const depth = previousDepth + 1;

    visiting.delete(id);
    depths.set(id, depth);
    return depth;
  };

  return resolveDepth;
}

export function orderTranscriptEntries<T extends OrderableTranscriptEntry>(entries: T[]): T[] {
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]));
  const resolveDepth = buildDepthResolver(entriesById);

  return [...entries].sort((a, b) => {
    const depthDiff = resolveDepth(a.id) - resolveDepth(b.id);
    if (depthDiff !== 0) return depthDiff;
    return a.timestamp - b.timestamp;
  });
}
